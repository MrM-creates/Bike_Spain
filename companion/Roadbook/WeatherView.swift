import SwiftUI

struct StageWeatherSection: View {
    @Environment(WeatherStore.self) private var weather
    let trip: TripPlan
    let day: TripDay
    @State private var expanded = false
    private var request: StageWeatherRequest { StageWeatherRequest(trip: trip, day: day) }

    var body: some View {
        if weather.enabled {
            let request = request
            Section {
                TimelineView(.periodic(from: .now, by: 60)) { context in
                    let saved = request.points.compactMap { weather.snapshot(request, $0) }
                    let summary = WeatherSummary(hours: saved.flatMap(\.hours))
                    DisclosureGroup(isExpanded: $expanded) {
                        ForEach(request.points) { point in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(point.label).font(.subheadline.weight(.semibold))
                                if request.ferry { Text(displayDate(point.date)).font(.caption).foregroundStyle(.secondary) }
                                if let snapshot = weather.snapshot(request, point), let detail = snapshot.summary {
                                    Label(detail.condition, systemImage: detail.symbol)
                                    Text(detail.text).font(.subheadline)
                                    if !snapshot.complete { Text("Zeitfenster nur teilweise verfügbar").font(.caption).foregroundStyle(.secondary) }
                                } else {
                                    Text(emptyMessage(point, request: request, now: context.date)).font(.subheadline).foregroundStyle(.secondary)
                                }
                            }.frame(maxWidth: .infinity, alignment: .leading).padding(.vertical, 6)
                        }
                        Text("09–18 Uhr Ortszeit. Temperaturspanne, höchste stündliche Niederschlagswahrscheinlichkeit und stärkste Böe an den gezeigten Punkten. Die Streckenmitte ist kein eigener Wetterbericht für Bergpässe.")
                            .font(.caption).foregroundStyle(.secondary)
                        if request.ferry {
                            Text("Wetter an Land vor und nach der Überfahrt; keine Seewettervorhersage.").font(.caption).foregroundStyle(.secondary)
                        }
                        if request.points.contains(where: { $0.canFetch(at: context.date) }) {
                            Button { Task { await weather.refresh(request, force: true) } } label: {
                                Label("Wetter aktualisieren", systemImage: "arrow.clockwise")
                            }.disabled(!weather.connected || request.points.contains { weather.loading.contains(weather.key(request, $0)) })
                            .accessibilityIdentifier("refresh-weather")
                        }
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Label(request.ferry ? "Wetter · vor & nach der Fähre" : "Wetter · 09–18 Uhr", systemImage: summary?.symbol ?? "cloud.sun")
                                .font(.subheadline.weight(.semibold))
                            if let summary {
                                Text(summary.text).font(.subheadline).foregroundStyle(.secondary)
                                    .accessibilityIdentifier("weather-summary")
                                if saved.count < request.points.count || saved.contains(where: { !$0.complete }) {
                                    Text("Teilweise verfügbar").font(.caption).foregroundStyle(.secondary)
                                }
                                if let oldest = saved.map(\.fetchedAt).min() {
                                    Text(status(saved, now: context.date) + " · Stand " + oldest.formatted(.dateTime.day().month().hour().minute()))
                                        .font(.caption).foregroundStyle(.secondary).accessibilityIdentifier("weather-status")
                                }
                            } else {
                                Text(request.points.first.map { emptyMessage($0, request: request, now: context.date) } ?? "Keine Wetterpunkte für diese Etappe")
                                    .font(.subheadline).foregroundStyle(.secondary).accessibilityIdentifier("weather-empty")
                            }
                        }.padding(.vertical, 3)
                    }.accessibilityIdentifier("weather-details-toggle")
                }
                if request.points.contains(where: { weather.snapshot(request, $0) != nil }) {
                    HStack {
                        Label("Weather", systemImage: "apple.logo").accessibilityLabel("Apple Weather")
                        Spacer()
                        Link("Wetterdaten & Quellen", destination: weather.legalURL)
                    }.font(.caption).foregroundStyle(.secondary)
                }
            }
            .task(id: request.id) { await weather.refresh(request) }
        }
    }
    private func status(_ saved: [WeatherSnapshot], now: Date) -> String {
        if !weather.connected {
            return saved.contains(where: { !$0.isFresh(at: now) }) ? "Offline · veraltet" : "Offline · gespeichert"
        }
        if saved.contains(where: { !$0.isFresh(at: now) }) { return "Veraltet · gespeichert" }
        return "Aktualisiert"
    }
    private func emptyMessage(_ point: WeatherPoint, request: StageWeatherRequest, now: Date) -> String {
        if point.end <= now { return "Reisetag liegt in der Vergangenheit" }
        if !point.canFetch(at: now) { return "Vorhersage noch nicht verfügbar" }
        if !weather.connected { return "Offline · noch keine Vorhersage gespeichert" }
        let key = weather.key(request, point)
        if weather.failures.contains(key) { return "Wetter momentan nicht verfügbar" }
        return "Vorhersage wird geladen …"
    }
}
