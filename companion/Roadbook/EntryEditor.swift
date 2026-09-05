import SwiftUI
import SwiftData
import PhotosUI

struct DraftPhoto: Identifiable {
    let id: UUID
    let jpeg: Data
    var caption: String
}

struct EntryEditor: View {
    let tripID: String
    let tripName: String
    let day: TripDay
    var existing: JournalEntry?
    var previousStage = false
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var text = ""
    @State private var photos: [DraftPhoto] = []
    @State private var selected: [PhotosPickerItem] = []
    @State private var busy = false
    @State private var changed = false
    @State private var discard = false
    @State private var error: String?
    @State private var loaded = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Gedanken und Eindrücke") {
                    TextEditor(text: $text).frame(minHeight: 160)
                        .accessibilityLabel("Deine Notiz").accessibilityIdentifier("memory-text")
                        .onChange(of: text) { _, value in if loaded && value != (existing?.text ?? "") { changed = true } }
                }
                Section {
                    ForEach($photos) { $photo in
                        VStack(alignment: .leading, spacing: 8) {
                            if let image = UIImage(data: photo.jpeg) {
                                Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 260)
                                    .accessibilityLabel(photo.caption.isEmpty ? "Dein Foto" : photo.caption)
                            }
                            TextField("Bildbeschreibung", text: $photo.caption).onChange(of: photo.caption) { _, _ in changed = true }
                            Button("Foto entfernen", role: .destructive) { photos.removeAll { $0.id == photo.id }; changed = true }
                        }
                    }
                    PhotosPicker(selection: $selected, maxSelectionCount: max(1, 8 - photos.count), matching: .images) {
                        Label(busy ? "Fotos werden geladen …" : "Fotos hinzufügen", systemImage: "photo.badge.plus")
                    }.disabled(busy || photos.count >= 8)
                    Text("Bis zu 8 Fotos pro Eintrag. Das Tagebuch speichert verkleinerte Kopien; die Originale bleiben in deiner Mediathek.").font(.caption)
                } header: { Text("Fotos") }
                if let error { Section { Text(error).foregroundStyle(.red) } }
            }
            .safeAreaInset(edge: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(tripName).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                    Text("\(previousStage ? "Frühere Etappe" : "Tag \(day.number)") · \(displayDate(day.date))")
                        .font(.subheadline.weight(.semibold))
                    Text(day.title).font(.headline)
                    Label("Nur für dich", systemImage: "lock").font(.caption).foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading).padding()
                .background(.bar)
                .accessibilityElement(children: .combine)
                .accessibilityIdentifier("editor-stage-context")
            }
            .navigationTitle(existing == nil ? "Erinnerung festhalten" : "Erinnerung bearbeiten")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { if changed { discard = true } else { dismiss() } } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern", action: save).disabled(!loaded || busy || (text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && photos.isEmpty))
                        .accessibilityIdentifier("save-memory")
                }
            }
            .interactiveDismissDisabled(changed || busy)
            .confirmationDialog("Änderungen verwerfen?", isPresented: $discard, titleVisibility: .visible) {
                Button("Verwerfen", role: .destructive) { dismiss() }
                Button("Weiter bearbeiten", role: .cancel) {}
            }
            .task { load() }
            .onChange(of: selected) { _, items in Task { await importPhotos(items) } }
        }
    }

    private func load() {
        guard !loaded else { return }
        if let existing {
            text = existing.text
            do {
                let id = existing.id
                photos = try context.fetch(FetchDescriptor<JournalPhoto>(predicate: #Predicate { $0.entryID == id }))
                    .compactMap { photo in photo.jpeg.map { DraftPhoto(id: photo.id, jpeg: $0, caption: photo.caption) } }
            } catch { self.error = "Fotos konnten nicht geladen werden. Bitte den Eintrag erneut öffnen."; return }
        }
        loaded = true; changed = false
    }

    private func importPhotos(_ items: [PhotosPickerItem]) async {
        guard !items.isEmpty else { return }
        busy = true; error = nil
        defer { busy = false; selected = [] }
        for item in items.prefix(max(0, 8 - photos.count)) {
            do {
                guard let data = try await item.loadTransferable(type: Data.self), data.count <= 60_000_000 else { throw PlanError.invalid }
                let jpeg = try await Task.detached(priority: .userInitiated) { try PhotoProcessor.jpeg(data) }.value
                photos.append(DraftPhoto(id: UUID(), jpeg: jpeg, caption: "")); changed = true
            } catch { self.error = "Ein Foto konnte nicht geladen werden. Bitte Verbindung und Format prüfen oder ein anderes Foto wählen." }
        }
    }

    private func save() {
        guard loaded, !busy else { return }
        let entry = existing ?? JournalEntry(tripID: tripID, day: day, text: text)
        do {
            if existing == nil { context.insert(entry) }
            entry.text = text; entry.updatedAt = Date()
            let id = entry.id
            let previous = try context.fetch(FetchDescriptor<JournalPhoto>(predicate: #Predicate { $0.entryID == id }))
            for photo in previous where !photos.contains(where: { $0.id == photo.id }) { context.delete(photo) }
            for photo in photos {
                if let old = previous.first(where: { $0.id == photo.id }) { old.caption = photo.caption }
                else {
                    let new = JournalPhoto(entryID: id, jpeg: photo.jpeg, caption: photo.caption)
                    new.id = photo.id; context.insert(new)
                }
            }
            try context.save(); dismiss()
        } catch {
            context.rollback()
            self.error = "Speichern nicht möglich. Deine Eingabe bleibt hier erhalten. Bitte Speicherplatz prüfen und erneut versuchen."
        }
    }
}

struct EntryDetail: View {
    let entry: JournalEntry
    let trip: TripPlan?
    let day: TripDay?
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Query private var photos: [JournalPhoto]
    @State private var editing = false
    @State private var deleting = false
    @State private var error: String?
    private var rememberedDay: TripDay {
        TripDay(id: entry.stageID, number: day?.number ?? 1, date: entry.originalDate, title: entry.originalTitle,
                rest: true, distance: "", duration: "", overnight: "", roads: "", notes: "", mapsURL: "", accommodation: nil)
    }
    var body: some View {
        List {
            Section {
                Label("Nur für dich", systemImage: "lock")
                Text(entry.originalTitle).font(.headline)
                Text(displayDate(entry.originalDate)).foregroundStyle(.secondary)
                Text(entry.text).textSelection(.enabled).accessibilityIdentifier("journal-entry-text")
            }
            ForEach(photos.filter { $0.entryID == entry.id }) { photo in
                if let data = photo.jpeg, let image = UIImage(data: data) {
                    VStack(alignment: .leading) {
                        Image(uiImage: image).resizable().scaledToFit().accessibilityLabel(photo.caption.isEmpty ? "Dein Foto" : photo.caption)
                        if !photo.caption.isEmpty { Text(photo.caption) }
                    }
                }
            }
            if let trip, let day, trip.id == entry.tripID, day.id == entry.stageID {
                Section("Zugehörige Tagesetappe") {
                    Text(trip.name).font(.caption).foregroundStyle(.secondary)
                    Label("Tag \(day.number) · \(day.rest ? "Ruhetag" : "Tagesroute")", systemImage: day.rest ? "sun.horizon" : "map")
                        .font(.headline).accessibilityIdentifier("journal-stage-context")
                    Text(day.title)
                    if !day.rest { Text("\(day.distance) · \(day.duration)").foregroundStyle(.secondary) }
                    if day.title != entry.originalTitle || day.date != entry.originalDate {
                        Label("Titel oder Reisedatum dieser Etappe wurden im Plan angepasst.", systemImage: "info.circle")
                            .font(.caption)
                    }
                    Text("Der verlinkte Reiseplan zeigt die aktuelle Tagesroute. Titel und Datum deiner Erinnerung bleiben unverändert.")
                        .font(.caption).foregroundStyle(.secondary)
                    NavigationLink {
                        DayView(trip: trip, day: day)
                    } label: {
                        Label("Tages-Roadbook öffnen", systemImage: "book")
                    }.accessibilityIdentifier("journal-open-stage")
                }
            } else {
                Section("Zugehörige Tagesetappe") {
                    Label("Diese Etappe ist im aktuellen Reiseplan nicht mehr verfügbar.", systemImage: "map")
                    Text("Deine Erinnerung und Fotos bleiben erhalten. Der damalige Streckenverlauf wurde nicht mitgespeichert.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            if let error { Text(error).foregroundStyle(.red) }
            Section { Button("Eintrag löschen", role: .destructive) { deleting = true } }
        }
        .navigationTitle("Erinnerung").navigationBarTitleDisplayMode(.inline)
        .toolbar { Button("Bearbeiten") { editing = true } }
        .sheet(isPresented: $editing) {
            EntryEditor(tripID: entry.tripID, tripName: trip?.name ?? "Frühere Reise", day: rememberedDay,
                        existing: entry, previousStage: day == nil)
        }
        .confirmationDialog("Eintrag und zugehörige Fotos löschen?", isPresented: $deleting, titleVisibility: .visible) {
            Button("Löschen", role: .destructive) {
                do {
                    for photo in photos where photo.entryID == entry.id { context.delete(photo) }
                    context.delete(entry); try context.save(); dismiss()
                } catch { context.rollback(); self.error = "Löschen nicht möglich. Bitte erneut versuchen." }
            }
        }
    }
}
