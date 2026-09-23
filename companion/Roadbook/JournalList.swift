import SwiftUI
import SwiftData
import ImageIO

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
            if entries.isEmpty {
                VStack(spacing: 12) {
                    Text("Noch keine Einträge").font(.headline)
                    Button { composing = true } label: { Label("Eintrag hinzufügen", systemImage: "plus") }
                        .frame(minHeight: 44)
                        .accessibilityIdentifier("journal-compose")
                        .disabled(!hasStages)
                    if !hasStages { Text("Sobald eine Reise geladen ist, kannst du einen Eintrag hinzufügen.").font(.subheadline).foregroundStyle(.secondary) }
                }
                .frame(maxWidth: .infinity).padding(.vertical, 28)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }
            ForEach(groups) { group in
                Section {
                    ForEach(group.entries) { entry in
                        NavigationLink { EntryDetail(entry: entry, trip: group.trip, day: group.day) } label: {
                            JournalPreview(entry: entry, day: group.day)
                        }.accessibilityIdentifier("journal-entry-\(entry.id)")
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 3) {
                        if groups.first(where: { $0.entries[0].tripID == group.entries[0].tripID })?.id == group.id {
                            Text(group.trip?.name ?? "Frühere Reise").font(.caption).foregroundStyle(.secondary)
                        }
                        Text(group.day.map { "Tag \($0.number) · \(displayDate($0.date))" }
                             ?? "Frühere Etappe · \(displayDate(group.entries[0].originalDate))")
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(.primary).textCase(nil)
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("journal-group-\(group.entries[0].tripID)-\(group.entries[0].stageID)")
                }
            }
        }
        .toolbar {
            if !entries.isEmpty {
                Button { composing = true } label: { Label("Eintrag hinzufügen", systemImage: "plus") }
                    .accessibilityIdentifier("journal-compose")
                    .disabled(!hasStages)
            }
        }
        .sheet(isPresented: $composing) { EntryEditor(trips: plans.feed?.trips ?? []) }
    }

    private var hasStages: Bool { plans.feed?.trips.contains { !$0.days.isEmpty } ?? false }
}

private struct JournalPreview: View {
    let entry: JournalEntry
    let day: TripDay?
    @Query private var photos: [JournalPhoto]
    @State private var thumbnail: UIImage?

    init(entry: JournalEntry, day: TripDay?) {
        self.entry = entry
        self.day = day
        let id = entry.id
        _photos = Query(filter: #Predicate<JournalPhoto> { $0.entryID == id }, sort: \JournalPhoto.id)
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if let thumbnail {
                Image(uiImage: thumbnail).resizable().scaledToFill()
                    .frame(width: 64, height: 64).clipped()
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .accessibilityLabel("Foto zum Eintrag")
                    .accessibilityIdentifier("journal-photo-preview")
            }
            VStack(alignment: .leading, spacing: 6) {
                Text(entry.text.isEmpty ? "Fotoeintrag" : entry.text).lineLimit(3)
                Text(entry.createdAt.formatted(date: .omitted, time: .shortened))
                    .font(.caption).foregroundStyle(.secondary)
                if let day, entry.originalTitle != day.title || entry.originalDate != day.date {
                    Text("Ursprünglich: \(displayDate(entry.originalDate)) · \(entry.originalTitle)")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
        .task(id: photos.first?.jpeg) {
            // Downsample the preview rather than rendering a full-size photo in every row.
            guard let data = photos.first?.jpeg else { thumbnail = nil; return }
            thumbnail = await Task.detached(priority: .utility) {
                guard let source = CGImageSourceCreateWithData(data as CFData, nil),
                      let image = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                        kCGImageSourceCreateThumbnailFromImageAlways: true,
                        kCGImageSourceCreateThumbnailWithTransform: true,
                        kCGImageSourceThumbnailMaxPixelSize: 192
                      ] as CFDictionary) else { return nil as UIImage? }
                return UIImage(cgImage: image)
            }.value
        }
    }
}

struct EntryStagePicker: View {
    let trips: [TripPlan]
    let onSelect: (EntryDestination) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var tripID: String

    init(trips: [TripPlan], selection: EntryDestination?, onSelect: @escaping (EntryDestination) -> Void) {
        self.trips = trips
        self.onSelect = onSelect
        _tripID = State(initialValue: selection?.tripID ?? trips.first(where: { !$0.days.isEmpty })?.id ?? "")
    }

    var body: some View {
        NavigationStack {
            List {
                if trips.count > 1 {
                    Picker("Reise", selection: $tripID) {
                        ForEach(trips) { trip in Text(trip.name).tag(trip.id) }
                    }.accessibilityIdentifier("entry-trip-picker")
                }
                if let trip = trips.first(where: { $0.id == tripID }) {
                    Section {
                        ForEach(trip.days.sorted { $0.number < $1.number }) { day in
                            Button {
                                onSelect(EntryDestination(tripID: trip.id, tripName: trip.name, day: day))
                                dismiss()
                            } label: {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text("Tag \(day.number) · \(displayDate(day.date))").font(.subheadline.weight(.semibold))
                                    Text(day.title).font(.subheadline).foregroundStyle(.secondary)
                                }.foregroundStyle(.primary).padding(.vertical, 4)
                            }.accessibilityIdentifier("choose-stage-\(day.id)")
                        }
                    }
                }
            }
            .navigationTitle("Etappe wählen").navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { dismiss() } } }
        }
    }
}
