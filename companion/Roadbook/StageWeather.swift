import Foundation
import CryptoKit

struct WeatherPoint: Codable, Hashable, Identifiable {
    let label: String
    let longitude: Double
    let latitude: Double
    let date: String
    let timeZone: String
    var id: String { "\(label)|\(longitude)|\(latitude)|\(date)|\(timeZone)" }
    var calendar: Calendar {
        var value = Calendar(identifier: .gregorian)
        value.timeZone = TimeZone(identifier: timeZone) ?? TimeZone(identifier: "Europe/Rome")!
        return value
    }
    var start: Date {
        let parser = DateFormatter()
        parser.calendar = calendar
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.timeZone = calendar.timeZone
        parser.dateFormat = "yyyy-MM-dd HH"
        parser.isLenient = false
        guard let value = parser.date(from: date + " 09"), parser.string(from: value) == date + " 09" else { return .distantPast }
        return value
    }
    var end: Date { calendar.date(byAdding: .hour, value: 9, to: start)! }
    func canFetch(at now: Date) -> Bool {
        let today = calendar.startOfDay(for: now)
        let limit = calendar.date(byAdding: .day, value: 10, to: today)!
        return end > now && start < limit
    }
}

struct StageWeatherRequest: Identifiable {
    let id: String
    let points: [WeatherPoint]
    let ferry: Bool
    init(trip: TripPlan, day: TripDay) {
        // These two mainland European itineraries share CET/CEST, including Albania.
        let zone = "Europe/Rome"
        func point(_ coordinates: [Double], _ label: String, date: String? = nil) -> WeatherPoint {
            WeatherPoint(label: label, longitude: coordinates[0], latitude: coordinates[1],
                         date: date ?? day.date, timeZone: zone)
        }
        let roads = (day.map?.lines ?? []).filter { $0.kind == "road" }.flatMap(\.coordinates)
        let crossing = day.map?.lines.first { $0.kind == "ferry" }
        ferry = crossing != nil
        var result: [WeatherPoint] = []
        if let crossing, let departure = crossing.coordinates.first, let arrival = crossing.coordinates.last {
            if let first = roads.first { result.append(point(first, "Start")) }
            result.append(point(departure, "Fährhafen · Abfahrt"))
            if let next = trip.adjacentDay(to: day.id, offset: 1) {
                result.append(point(arrival, "Fährhafen · Ankunft", date: next.date))
            }
        } else if day.rest, let stop = day.map?.stop {
            result = [point(stop.coordinate, "Vor Ort")]
        } else if let first = roads.first, let last = roads.last {
            result = [point(first, "Start")]
            if let middle = Self.midpoint(roads), Self.length(roads) > 10 {
                result.append(point(middle, "Unterwegs · Streckenmitte"))
            }
            result.append(point(last, "Ziel"))
        } else if let stop = day.map?.stop {
            result = [point(stop.coordinate, "Ziel")]
        }
        points = result.filter { $0.start != .distantPast }
        // Include the full geometry so a published detour cannot reuse the old stage's weather.
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let geometry = (try? encoder.encode(day.map)) ?? Data()
        let signature = Data("v1|\(trip.id)|\(day.id)|\(day.date)|\(day.mapsURL)|\(result.map(\.id).joined())".utf8) + geometry
        id = SHA256.hash(data: signature).map { String(format: "%02x", $0) }.joined()
    }
    static func distance(_ a: [Double], _ b: [Double]) -> Double {
        let r = Double.pi / 180
        let dlat = (b[1] - a[1]) * r, dlon = (b[0] - a[0]) * r
        let h = pow(sin(dlat / 2), 2) + cos(a[1] * r) * cos(b[1] * r) * pow(sin(dlon / 2), 2)
        return 6371 * 2 * asin(sqrt(min(1, h)))
    }
    static func length(_ coordinates: [[Double]]) -> Double {
        zip(coordinates, coordinates.dropFirst()).reduce(0) { $0 + distance($1.0, $1.1) }
    }
    static func midpoint(_ coordinates: [[Double]]) -> [Double]? {
        guard let first = coordinates.first else { return nil }
        let halfway = length(coordinates) / 2
        var accumulated = 0.0
        for (a, b) in zip(coordinates, coordinates.dropFirst()) {
            let segment = distance(a, b)
            if accumulated + segment >= halfway && segment > 0 {
                let ratio = (halfway - accumulated) / segment
                return [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]
            }
            accumulated += segment
        }
        return first
    }
}

struct WeatherHour: Codable {
    let date: Date
    let temperature: Double
    let precipitationChance: Double
    let gust: Double?
    let symbol: String
    let condition: String
}

struct WeatherSummary {
    let low: Double
    let high: Double
    let rain: Double
    let gust: Double?
    let symbol: String
    let condition: String
    init?(hours: [WeatherHour]) {
        guard let representative = hours.max(by: { $0.precipitationChance < $1.precipitationChance }) else { return nil }
        low = hours.map(\.temperature).min()!
        high = hours.map(\.temperature).max()!
        rain = hours.map(\.precipitationChance).max()!
        gust = hours.compactMap(\.gust).max()
        symbol = representative.symbol
        condition = representative.condition
    }
    var text: String {
        "\(Int(low.rounded()))–\(Int(high.rounded())) °C · Niederschlag bis \(Int((rain * 100).rounded())) % · " +
        (gust.map { "Böen bis \(Int($0.rounded())) km/h" } ?? "Böen unbekannt")
    }
}

struct WeatherSnapshot: Codable {
    let point: WeatherPoint
    let fetchedAt: Date
    let expiresAt: Date
    let hours: [WeatherHour]
    func isFresh(at now: Date) -> Bool {
        now >= fetchedAt && now.timeIntervalSince(fetchedAt) < 3600 && now < expiresAt
    }
    var summary: WeatherSummary? { WeatherSummary(hours: hours) }
    var complete: Bool { Set(hours.map(\.date)).count >= 9 }
}
