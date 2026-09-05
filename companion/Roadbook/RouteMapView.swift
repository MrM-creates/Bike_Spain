import SwiftUI
import MapKit

private struct DisplayLine: Identifiable {
    let id: String
    let kind: String
    let coordinates: [CLLocationCoordinate2D]
}
private struct DisplayStop: Identifiable {
    let id: String
    let label: String
    let numbers: String
    let coordinate: CLLocationCoordinate2D
    var badge: String {
        let values = numbers.components(separatedBy: ", ").compactMap(Int.init)
        if let first = values.first, let last = values.last, values.count > 1, last - first + 1 == values.count {
            return "\(first)–\(last)"
        }
        return numbers
    }
}

private func coordinate(_ point: [Double]) -> CLLocationCoordinate2D {
    CLLocationCoordinate2D(latitude: point[1], longitude: point[0])
}

struct RouteMapSection: View {
    let trip: TripPlan
    var day: TripDay? = nil
    var prominentHeight: CGFloat? = nil
    @State private var explanationExpanded = false
    @Environment(\.horizontalSizeClass) private var sizeClass
    private var days: [TripDay] { day.map { [$0] } ?? trip.days }
    private var available: Bool { days.contains { !($0.map?.lines.isEmpty ?? true) || $0.map?.stop != nil } }
    var body: some View {
        Section(day == nil ? "Die Reise auf der Karte" : day!.rest ? "Dein Aufenthaltsort" : "Deine Tagesstrecke") {
            if available {
                RouteMapCanvas(days: days, interactive: false)
                    .frame(height: prominentHeight ?? (sizeClass == .regular ? 320 : 230))
                    .allowsHitTesting(false)
                    .accessibilityLabel(day == nil ? "Übersichtskarte der Reise" : "Karte der Tagesetappe")
                    .accessibilityIdentifier(day == nil ? "trip-map-preview" : "day-map-preview")
                NavigationLink {
                    RouteMapScreen(trip: trip, day: day)
                } label: {
                    Label("Karte vergrössern", systemImage: "arrow.up.left.and.arrow.down.right")
                }.accessibilityIdentifier(day == nil ? "open-trip-map" : "open-day-map")
            }
            if prominentHeight != nil {
                if days.contains(where: { !$0.rest && ($0.map?.lines.isEmpty ?? true) }) {
                    Label("Der passende Kartenverlauf fehlt. Bitte die Streckenhinweise und den Maps-Link beachten.", systemImage: "exclamationmark.triangle")
                        .font(.caption)
                }
                DisclosureGroup("Zur Karte", isExpanded: $explanationExpanded) { MapExplanation(days: days) }
                    .font(.subheadline)
            } else { MapExplanation(days: days) }
        }
    }
}

private struct MapExplanation: View {
    let days: [TripDay]
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            let count = days.filter { !$0.rest && !($0.map?.lines.isEmpty ?? true) }.count
            if count > 0 {
                Text("\(count) \(count == 1 ? "Fahretappe" : "Fahretappen") mit Streckenverlauf")
                    .accessibilityIdentifier("map-route-count")
            }
            if days.contains(where: { !$0.rest && ($0.map?.lines.isEmpty ?? true) }) {
                Label("Für einzelne Etappen fehlt der passende Kartenverlauf. Die Streckenhinweise und Maps-Links bleiben verfügbar.", systemImage: "exclamationmark.triangle")
            }
            if days.contains(where: { $0.map?.lines.contains(where: { $0.kind == "ferry" }) == true }) {
                Text("Grün: Strasse · gestrichelt: Fähre, schematischer Verlauf")
            } else { Text("Geplanter Verlauf · keine Neuberechnung") }
            Text("Markierungen: Übernachtungsorte, ungefähre Lage — keine genauen Unterkunftsadressen.")
            Text("Die Kartengrundlage benötigt gegebenenfalls Internet.")
        }.font(.caption).foregroundStyle(.secondary)
    }
}

struct RouteMapScreen: View {
    let trip: TripPlan
    let day: TripDay?
    @State private var reset = UUID()
    private var days: [TripDay] { day.map { [$0] } ?? trip.days }
    var body: some View {
        RouteMapCanvas(days: days, interactive: true)
            .id(reset)
            .safeAreaInset(edge: .bottom) {
                MapExplanation(days: days).padding(12).frame(maxWidth: .infinity, alignment: .leading)
                    .background(.regularMaterial)
            }
            .navigationTitle(day.map { "Tag \($0.number) · Karte" } ?? "Reisekarte")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                Button("Gesamte Strecke") { reset = UUID() }.accessibilityIdentifier("reset-route-map")
            }
    }
}

private struct RouteMapCanvas: View {
    let days: [TripDay]
    let interactive: Bool
    @Environment(\.colorScheme) private var colorScheme
    // The app accent alone disappears into Apple's green night-time terrain.
    // A separate casing preserves the route against both roads and terrain.
    private var routeColor: Color {
        colorScheme == .dark ? Color(red: 0.30, green: 1.0, blue: 0.70) : RoadbookStyle.accent
    }
    private var ferryColor: Color {
        colorScheme == .dark ? Color(red: 1.0, green: 0.78, blue: 0.30) : Color(red: 0.60, green: 0.38, blue: 0.09)
    }
    private var lines: [DisplayLine] {
        days.flatMap { day in
            (day.map?.lines ?? []).enumerated().map { index, line in
                DisplayLine(id: "\(day.id)-\(index)", kind: line.kind, coordinates: line.coordinates.map(coordinate))
            }
        }
    }
    private var stops: [DisplayStop] {
        // Consecutive rest days at the same base share one marker, preserving all day numbers.
        var result: [DisplayStop] = []
        for day in days {
            guard let stop = day.map?.stop else { continue }
            let key = "\(stop.coordinate[0]),\(stop.coordinate[1])"
            if let index = result.firstIndex(where: { $0.id == key }) {
                let old = result[index]
                result[index] = DisplayStop(id: key, label: old.label, numbers: old.numbers + ", \(day.number)", coordinate: old.coordinate)
            } else {
                result.append(DisplayStop(id: key, label: stop.label, numbers: "\(day.number)", coordinate: coordinate(stop.coordinate)))
            }
        }
        return result
    }
    private var region: MKCoordinateRegion {
        let points = lines.flatMap(\.coordinates) + stops.map(\.coordinate)
        guard let first = points.first else { return MKCoordinateRegion(center: coordinate([12, 45]), span: MKCoordinateSpan(latitudeDelta: 12, longitudeDelta: 15)) }
        let lats = points.map(\.latitude), lons = points.map(\.longitude)
        let minLat = lats.min() ?? first.latitude, maxLat = lats.max() ?? first.latitude
        let minLon = lons.min() ?? first.longitude, maxLon = lons.max() ?? first.longitude
        return MKCoordinateRegion(center: CLLocationCoordinate2D(latitude: (minLat + maxLat) / 2, longitude: (minLon + maxLon) / 2),
                                  span: MKCoordinateSpan(latitudeDelta: max(0.07, (maxLat - minLat) * 1.3), longitudeDelta: max(0.07, (maxLon - minLon) * 1.3)))
    }
    var body: some View {
        Map(initialPosition: .region(region), interactionModes: interactive ? [.pan, .zoom, .rotate] : []) {
            ForEach(lines) { line in
                MapPolyline(coordinates: line.coordinates)
                    .stroke(colorScheme == .dark ? Color.black.opacity(0.85) : Color.white.opacity(0.95),
                            style: StrokeStyle(lineWidth: 9, lineCap: .round, lineJoin: .round, dash: line.kind == "ferry" ? [10, 8] : []))
                MapPolyline(coordinates: line.coordinates)
                    .stroke(line.kind == "ferry" ? ferryColor : routeColor,
                            style: StrokeStyle(lineWidth: 5, lineCap: .round, lineJoin: .round, dash: line.kind == "ferry" ? [10, 8] : []))
            }
            ForEach(stops) { stop in
                Annotation(stop.label, coordinate: stop.coordinate) {
                    Text(stop.badge).font(.caption2.bold()).padding(6)
                        .foregroundStyle(.white).background(RoadbookStyle.accent, in: Capsule())
                        .overlay(Capsule().stroke(.white, lineWidth: 2))
                        .accessibilityLabel("Tag \(stop.numbers): \(stop.label), ungefähre Lage")
                }
            }
        }
        .mapStyle(.standard(elevation: .flat, pointsOfInterest: .excludingAll, showsTraffic: false))
    }
}
