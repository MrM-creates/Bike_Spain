import Foundation

struct PlanFeed: Codable {
    let schemaVersion: Int
    let trips: [TripPlan]
    var routeLineCount: Int { trips.reduce(0) { $0 + $1.days.reduce(0) { $0 + ($1.map?.lines.count ?? 0) } } }

    // Backfill only an identical, version-matched route; changed routes must never
    // silently inherit stale geometry. Used for old caches and older API payloads.
    func enriched(from bundled: PlanFeed?) -> PlanFeed {
        PlanFeed(schemaVersion: schemaVersion, trips: trips.map { trip in
            var next = trip
            next.days = trip.days.map { day in
                var result = day
                if result.map == nil,
                   let known = bundled?.trips.first(where: { $0.id == trip.id && $0.version == trip.version })?.days.first(where: { $0.id == day.id }),
                   day.sameRoute(as: known) { result.map = known.map }
                return result
            }
            return next
        })
    }

    func validated() throws -> PlanFeed {
        guard schemaVersion == 1, !trips.isEmpty, Set(trips.map(\.id)).count == trips.count else { throw PlanError.invalid }
        for trip in trips {
            guard !trip.id.isEmpty, !trip.version.isEmpty, !trip.days.isEmpty,
                  Set(trip.days.map(\.id)).count == trip.days.count else { throw PlanError.invalid }
            for day in trip.days {
                guard !day.id.isEmpty, day.number > 0, day.date.count == 10 else { throw PlanError.invalid }
                if let map = day.map {
                    guard map.lines.count <= 10, map.lines.allSatisfy({ line in
                        ["road", "ferry"].contains(line.kind) && line.coordinates.count >= 2 &&
                        line.coordinates.count <= 100_000 && line.coordinates.allSatisfy(validCoordinate)
                    }), map.stop.map({ validCoordinate($0.coordinate) }) ?? true else { throw PlanError.invalid }
                }
                if !day.mapsURL.isEmpty {
                    guard let url = URL(string: day.mapsURL), url.scheme == "https",
                          url.host == "www.google.com", url.path.hasPrefix("/maps/") else { throw PlanError.invalid }
                }
                if let parts = day.navigationParts {
                    guard !day.rest, (2...10).contains(parts.count), Set(parts.map(\.id)).count == parts.count else { throw PlanError.invalid }
                    let complete = try navigationRoutePoints(day.mapsURL)
                    let avoidance = navigationAvoidance(day.mapsURL)
                    var flattened: [String] = []
                    for (index, part) in parts.enumerated() {
                        let points = try navigationRoutePoints(part.mapsURL)
                        guard !part.id.isEmpty, !part.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                              points.count <= 5, navigationAvoidance(part.mapsURL) == avoidance,
                              index == 0 || flattened.last == points.first else { throw PlanError.invalid }
                        flattened.append(contentsOf: index == 0 ? points : Array(points.dropFirst()))
                    }
                    guard flattened == complete else { throw PlanError.invalid }
                }
            }
        }
        return self
    }
}
struct TripPlan: Codable, Identifiable {
    let id: String
    let name: String
    let version: String
    let status: String
    let startDate: String
    let endDate: String
    let description: String
    var days: [TripDay]

    func adjacentDay(to dayID: String, offset: Int) -> TripDay? {
        guard offset == -1 || offset == 1 else { return nil }
        let ordered = days.sorted { $0.number == $1.number ? $0.id < $1.id : $0.number < $1.number }
        guard let index = ordered.firstIndex(where: { $0.id == dayID }), ordered.indices.contains(index + offset) else { return nil }
        return ordered[index + offset]
    }
}
struct TripDay: Codable, Identifiable {
    let id: String
    let number: Int
    let date: String
    let title: String
    let rest: Bool
    let distance: String
    let duration: String
    let overnight: String
    let roads: String
    let notes: String
    let mapsURL: String
    let accommodation: StayPlan?
    var map: StageMap? = nil
    var navigationParts: [NavigationPart]? = nil

    func sameRoute(as other: TripDay) -> Bool {
        id == other.id && title == other.title && rest == other.rest && mapsURL == other.mapsURL &&
        roads == other.roads && overnight == other.overnight
    }
}
struct NavigationPart: Codable, Identifiable {
    let id: String
    let title: String
    let mapsURL: String
}

func navigationRoutePoints(_ value: String) throws -> [String] {
    guard let url = URLComponents(string: value), url.scheme == "https", url.host == "www.google.com",
          url.user == nil, url.password == nil, url.path == "/maps/dir/", let items = url.queryItems else { throw PlanError.invalid }
    for key in ["api", "origin", "destination", "travelmode", "waypoints", "avoid"] {
        guard items.filter({ $0.name == key }).count <= 1 else { throw PlanError.invalid }
    }
    func item(_ key: String) -> String? { items.first(where: { $0.name == key })?.value }
    guard item("api") == "1", item("travelmode") == "driving", let origin = item("origin"),
          !origin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
          let destination = item("destination"), !destination.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw PlanError.invalid }
    let raw = item("waypoints") ?? ""
    let waypoints = raw.isEmpty ? [] : raw.components(separatedBy: "|")
    guard waypoints.allSatisfy({ !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) else { throw PlanError.invalid }
    return [origin] + waypoints + [destination]
}
func navigationAvoidance(_ value: String) -> String {
    URLComponents(string: value)?.queryItems?.first(where: { $0.name == "avoid" })?.value ?? ""
}
func validCoordinate(_ value: [Double]) -> Bool {
    value.count == 2 && value.allSatisfy(\.isFinite) && abs(value[0]) <= 180 && abs(value[1]) <= 90
}
struct StageMap: Codable {
    let lines: [RouteLine]
    let stop: RouteStop?
}
struct RouteLine: Codable {
    let kind: String
    let coordinates: [[Double]] // GeoJSON order: longitude, latitude.
}
struct RouteStop: Codable {
    let coordinate: [Double]
    let label: String
    let approximate: Bool
}
struct StayPlan: Codable {
    let status: String
    let first: StayOption?
    let alternative: StayOption?
    let notes: String
}
struct StayOption: Codable {
    let name: String
    let url: String
    let note: String
}
enum PlanError: LocalizedError {
    case invalid
    var errorDescription: String? { "Der neue Reiseplan ist nicht lesbar. Der bisherige Stand bleibt erhalten." }
}

func displayDate(_ value: String) -> String {
    let parser = DateFormatter()
    parser.locale = Locale(identifier: "en_US_POSIX")
    parser.timeZone = TimeZone(secondsFromGMT: 0)
    parser.dateFormat = "yyyy-MM-dd"
    guard let date = parser.date(from: value) else { return value }
    parser.locale = Locale(identifier: "de_CH")
    parser.dateFormat = "d. MMMM yyyy"
    return parser.string(from: date)
}
