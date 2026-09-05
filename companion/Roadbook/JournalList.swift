import SwiftUI
import SwiftData

private struct JournalStageGroup: Identifiable {
    let id: String
    let trip: TripPlan?
    let day: TripDay?
    let entries: [JournalEntry]
}

struct JournalList: View {
    let plans: PlanStore
    @Query(sort: \JournalEntry.createdAt) private var entries: [JournalEntry]
    @State private var composing = false

    private var groups: [JournalStageGroup] {
        let trips = plans.feed?.trips ?? []
        var result: [JournalStageGroup] = []
        // Stable IDs, never titles or dates, associate memories with their route.
        let byTrip = Dictionary(grouping: entries, by: \.tripID)
        let tripIDs = trips.map(\.id) + byTrip.keys.filter { id in !trips.contains { $0.id == id } }.sorted()
        for tripID in tripIDs {
            let trip = trips.first { $0.id == tripID }
            let byStage = Dictionary(grouping: byTrip[tripID] ?? [], by: \.stageID)
            let days = (trip?.days ?? []).sorted { $0.number < $1.number }
            let previous = byStage.keys.filter { id in !days.contains { $0.id == id } }.sorted {
                let left = byStage[$0]?.first?.originalDate ?? ""
                let right = byStage[$1]?.first?.originalDate ?? ""
                return left == right ? $0 < $1 : left < right
            }
            for stageID in days.map(\.id) + previous {
                guard let memories = byStage[stageID], !memories.isEmpty else { continue }
                result.append(JournalStageGroup(id: "\(tripID)/\(stageID)", trip: trip,
                                               day: days.first { $0.id == stageID }, entries: memories))
            }
        }
        return result
    }

    var body: some View {
        List {
            Section {
                Label("Alle deine Einträge", systemImage: "lock")
                Text("Nach Reise und Tagesetappe geordnet. Nur für dich sichtbar — auch Fotos bleiben persönlich.")
                    .font(.subheadline).foregroundStyle(.secondary)
            }
            if entries.isEmpty {
                ContentUnavailableView("Dein Reisetagebuch beginnt hier", systemImage: "book.closed",
                                       description: Text("Wähle mit «Eintrag schreiben» eine Reise und Tagesetappe aus."))
            }
            ForEach(groups) { group in
                Section {
                    ForEach(group.entries) { entry in
                        NavigationLink { EntryDetail(entry: entry, trip: group.trip, day: group.day) } label: {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(entry.text.isEmpty ? "Foto-Erinnerung" : entry.text).lineLimit(3)
                                Text("Notiert \(entry.createdAt.formatted(date: .abbreviated, time: .shortened))")
                                    .font(.caption).foregroundStyle(.secondary)
                                if let day = group.day, entry.originalTitle != day.title || entry.originalDate != day.date {
                                    Text("Ursprünglich: \(displayDate(entry.originalDate)) · \(entry.originalTitle)")
                                        .font(.caption).foregroundStyle(.secondary)
                                }
                            }.padding(.vertical, 4)
                        }.accessibilityIdentifier("journal-entry-\(entry.id)")
                    }
                    if let trip = group.trip, let day = group.day {
                        NavigationLink { DayView(trip: trip, day: day) } label: {
                            Label("Tagesroute ansehen", systemImage: "map").font(.subheadline)
                        }.accessibilityIdentifier("journal-route-\(day.id)")
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(group.trip?.name ?? "Frühere Reise").font(.subheadline.weight(.semibold))
                        Text(group.day.map { "Tag \($0.number) · \(displayDate($0.date))" }
                             ?? "Frühere Etappe · \(displayDate(group.entries[0].originalDate))")
                        Text(group.day?.title ?? group.entries[0].originalTitle).font(.headline)
                    }
                    .foregroundStyle(.primary).textCase(nil).padding(.vertical, 8)
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("journal-group-\(group.entries[0].tripID)-\(group.entries[0].stageID)")
                }
            }
        }
        .toolbar {
            Button { composing = true } label: { Label("Eintrag schreiben", systemImage: "square.and.pencil") }
                .accessibilityIdentifier("journal-compose")
                .disabled(plans.feed?.trips.isEmpty ?? true)
        }
        .sheet(isPresented: $composing) { JournalComposer(trips: plans.feed?.trips ?? []) }
    }
}

private struct JournalComposer: View {
    let trips: [TripPlan]
    @Environment(\.dismiss) private var dismiss
    @State private var selection: (trip: TripPlan, day: TripDay)?
    var body: some View {
        if let selection {
            EntryEditor(tripID: selection.trip.id, tripName: selection.trip.name, day: selection.day)
        } else {
            NavigationStack {
                List {
                    Section {
                        ForEach(trips) { trip in
                            NavigationLink {
                                List(trip.days.sorted { $0.number < $1.number }) { day in
                                    Button { selection = (trip, day) } label: {
                                        VStack(alignment: .leading, spacing: 6) {
                                            Text("Tag \(day.number) · \(displayDate(day.date))").font(.subheadline)
                                            Text(day.title).font(.headline)
                                            if day.rest { Text("Ruhetag").font(.caption).foregroundStyle(.secondary) }
                                        }.foregroundStyle(.primary).padding(.vertical, 4)
                                    }.accessibilityIdentifier("choose-stage-\(day.id)")
                                }
                                .navigationTitle("Tagesetappe wählen").navigationBarTitleDisplayMode(.inline)
                                .safeAreaInset(edge: .top) {
                                    Text(trip.name).font(.subheadline.weight(.semibold)).padding()
                                        .frame(maxWidth: .infinity, alignment: .leading).background(.bar)
                                }
                            } label: {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(trip.name).font(.headline)
                                    Text("\(displayDate(trip.startDate)) – \(displayDate(trip.endDate))").font(.caption)
                                }.padding(.vertical, 4)
                            }.accessibilityIdentifier("choose-trip-\(trip.id)")
                        }
                    } footer: { Text("Dein Eintrag gehört anschliessend eindeutig zu dieser Reise und Tagesetappe.") }
                }
                .navigationTitle("Reise wählen").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } } }
            }
        }
    }
}
