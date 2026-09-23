import SwiftUI
import SwiftData
import PhotosUI

struct DraftPhoto: Identifiable {
    let id: UUID
    let jpeg: Data
    var caption: String
}

struct EntryDestination {
    let tripID: String
    let tripName: String
    let day: TripDay
}

struct EntryEditor: View {
    private let fixedDestination: EntryDestination?
    private let trips: [TripPlan]
    let existing: JournalEntry?
    let previousStage: Bool
    @State private var chosenDestination: EntryDestination?
    @State private var choosingStage = false

    init(tripID: String, tripName: String, day: TripDay, existing: JournalEntry? = nil, previousStage: Bool = false) {
        fixedDestination = EntryDestination(tripID: tripID, tripName: tripName, day: day)
        trips = []
        self.existing = existing
        self.previousStage = previousStage
    }

    init(trips: [TripPlan]) {
        fixedDestination = nil
        self.trips = trips
        existing = nil
        previousStage = false
    }

    private var destination: EntryDestination? { fixedDestination ?? chosenDestination }
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var recorder = SpeechNoteRecorder()
    @State private var typing = false
    @State private var dictationPrefix = ""
    @State private var acceptingTranscript = false
    @State private var startTask: Task<Void, Never>?
    @FocusState private var textFocused: Bool
    @State private var text = ""
    @State private var photos: [DraftPhoto] = []
    @State private var selected: [PhotosPickerItem] = []
    @State private var busy = false
    @State private var changed = false
    @State private var discard = false
    @State private var error: String?
    @State private var loaded = false

    private var speechBusy: Bool { recorder.isStarting || recorder.isRecording || recorder.isFinishing }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    noteInput
                    photoInput
                    if let error { Text(error).foregroundStyle(.red) }
                }
                .frame(maxWidth: 640)
                .padding(20)
                .frame(maxWidth: .infinity)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .top) { stageContext }
            .sheet(isPresented: $choosingStage) {
                EntryStagePicker(trips: trips, selection: chosenDestination) { chosenDestination = $0 }
            }
            .navigationTitle("Eintrag")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen", action: requestDismiss).disabled(busy) }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Speichern", action: save).disabled(destination == nil || !loaded || busy || speechBusy || (text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && photos.isEmpty))
                        .accessibilityIdentifier("save-memory")
                }
            }
            .interactiveDismissDisabled(changed || busy || speechBusy)
            .alert("Änderungen verwerfen?", isPresented: $discard) {
                Button("Verwerfen", role: .destructive) { endDictation(); dismiss() }
                Button("Weiter bearbeiten", role: .cancel) {}
            } message: {
                Text("Dein Eintrag wurde noch nicht gespeichert.")
            }
            .task { load() }
            .onChange(of: selected) { _, items in Task { await importPhotos(items) } }
            .onChange(of: text) { _, value in if loaded && value != (existing?.text ?? "") { changed = true } }
            .onChange(of: recorder.transcript) { _, transcript in applyTranscript(transcript) }
            .onChange(of: speechBusy) { wasBusy, isBusy in
                if wasBusy && !isBusy {
                    applyTranscript(recorder.transcript)
                    acceptingTranscript = false
                    if !text.isEmpty { typing = true }
                }
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .background { endDictation() }
            }
            .onDisappear { endDictation() }
        }
    }

    private var stageContext: some View {
        Group {
            if fixedDestination != nil {
                destinationLabel
            } else {
                Button {
                    textFocused = false
                    choosingStage = true
                } label: {
                    HStack(spacing: 12) {
                        destinationLabel
                        Image(systemName: "chevron.up.chevron.down").font(.caption.weight(.semibold))
                    }.contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(speechBusy || busy)
                .accessibilityIdentifier("choose-entry-stage")
                .accessibilityHint("Etappe für diesen Eintrag auswählen")
            }
        }
        .frame(maxWidth: 640, alignment: .leading)
        .padding(.horizontal, 20).padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .background(.bar)
    }

    private var destinationLabel: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let destination {
                Text("\(previousStage ? "Frühere Etappe" : "Tag \(destination.day.number)") · \(displayDate(destination.day.date)) · \(destination.tripName)")
                    .font(.caption).foregroundStyle(.secondary)
                Text(destination.day.title).font(.subheadline.weight(.semibold))
            } else {
                Label("Etappe wählen", systemImage: "map").font(.subheadline.weight(.semibold))
            }
        }
        .frame(maxWidth: .infinity, minHeight: 32, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("editor-stage-context")
    }

    @ViewBuilder private var noteInput: some View {
        if existing != nil {
            VStack(alignment: .leading, spacing: 10) {
                editVoiceButton
                noteTextEditor
                    .disabled(speechBusy)
            }
        } else if !typing || speechBusy {
            VStack(spacing: 20) {
                Button {
                    if recorder.isRecording { recorder.stop() }
                    else { startDictation() }
                } label: {
                    VStack(spacing: 12) {
                        Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                            .font(.system(size: 32, weight: .medium))
                            .foregroundStyle(.white)
                            .frame(width: 96, height: 96)
                            .background(RoadbookStyle.voiceAccent, in: Circle())
                        Text(recorder.isStarting ? "Wird vorbereitet …" : recorder.isRecording ? "Stoppen" : recorder.isFinishing ? "Wird abgeschlossen …" : text.isEmpty ? "Aufnahme starten" : "Weiter diktieren")
                            .font(.headline).foregroundStyle(.primary)
                    }.contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(!loaded || busy || recorder.isStarting || recorder.isFinishing)
                .accessibilityIdentifier("memory-record")
                .accessibilityValue(recorder.isRecording ? "Aufnahme läuft" : "Bereit")

                if recorder.isFinishing {
                    ProgressView("Die letzten Worte werden ergänzt …")
                } else if recorder.isRecording {
                    Text("Roadbook schreibt mit …").font(.subheadline).foregroundStyle(.secondary)
                }
                if !text.isEmpty {
                    Text(text)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(16)
                        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16))
                        .accessibilityIdentifier("memory-transcript")
                }
                Button("Lieber tippen") { endDictation(); typing = true; textFocused = true }
                    .font(.subheadline).foregroundStyle(.primary)
                    .frame(minHeight: 44)
                    .accessibilityIdentifier("memory-type")
            }
            .frame(maxWidth: .infinity)
            .padding(.top, 12)
        } else {
            VStack(alignment: .leading, spacing: 8) {
                noteTextEditor
                Button { typing = false; startDictation() } label: {
                    Label(text.isEmpty ? "Sprechen" : "Weiter diktieren", systemImage: "mic.fill")
                        .font(.subheadline).frame(minHeight: 44)
                }
                .foregroundStyle(.primary)
                .accessibilityIdentifier("memory-resume")
            }
        }
        if let message = recorder.errorMessage {
            Text(message + " Du kannst deinen Text auch tippen.")
                .font(.subheadline)
                .accessibilityIdentifier("memory-voice-error")
        }
    }

    // Match Spur's edit dialog: speech stays above the editable note rather
    // than changing to the separate voice-first layout used for new entries.
    private var editVoiceButton: some View {
        Button {
            if recorder.isRecording { recorder.stop() }
            else { startDictation() }
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill((recorder.isRecording ? Color.red : RoadbookStyle.voiceAccent).opacity(0.12))
                        .frame(width: 38, height: 38)
                    Image(systemName: recorder.isRecording ? "stop.fill" : "mic.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(recorder.isRecording ? Color.red : RoadbookStyle.voiceAccent)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(recorder.isStarting ? "Wird vorbereitet …" : recorder.isFinishing ? "Wird abgeschlossen …" : recorder.isRecording ? "Aufnahme stoppen" : "Notiz sprechen")
                        .font(.subheadline.weight(.semibold))
                    Text(recorder.isFinishing ? "Die letzten Worte werden ergänzt …" : recorder.isRecording ? "Roadbook schreibt live mit" : "Die Aufnahme wird in Text umgewandelt")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                if recorder.isStarting || recorder.isFinishing {
                    ProgressView().accessibilityHidden(true)
                } else if recorder.isRecording {
                    Circle().fill(Color.red).frame(width: 8, height: 8).accessibilityHidden(true)
                }
            }
            .foregroundStyle(.primary)
            .padding(.horizontal, 12).padding(.vertical, 10)
            .frame(minHeight: 58)
            .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 15))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!loaded || busy || recorder.isStarting || recorder.isFinishing)
        .accessibilityIdentifier("memory-edit-record")
        .accessibilityValue(recorder.isStarting ? "Wird vorbereitet" : recorder.isFinishing ? "Wird abgeschlossen" : recorder.isRecording ? "Aufnahme läuft" : "Bereit")
    }

    private var noteTextEditor: some View {
        ZStack(alignment: .topLeading) {
            if text.isEmpty {
                Text("Was möchtest du festhalten?").foregroundStyle(.secondary)
                    .padding(.horizontal, 5).padding(.vertical, 8).accessibilityHidden(true)
            }
            TextEditor(text: $text).frame(minHeight: 160)
                .scrollContentBackground(.hidden)
                .focused($textFocused)
                .accessibilityLabel("Dein Eintrag").accessibilityIdentifier("memory-text")
        }
        .padding(12)
        .background(Color(uiColor: .secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16))
    }

    private var photoInput: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach($photos) { $photo in
                VStack(alignment: .leading, spacing: 8) {
                    if let image = UIImage(data: photo.jpeg) {
                        Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 260)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .accessibilityLabel(photo.caption.isEmpty ? "Dein Foto" : photo.caption)
                    }
                    TextField("Bildbeschreibung", text: $photo.caption).onChange(of: photo.caption) { _, _ in changed = true }
                    Button("Foto entfernen", role: .destructive) { photos.removeAll { $0.id == photo.id }; changed = true }
                        .font(.subheadline).frame(minHeight: 44)
                }
            }
            PhotosPicker(selection: $selected, maxSelectionCount: max(1, 8 - photos.count), matching: .images) {
                Label(busy ? "Fotos werden geladen …" : "Fotos hinzufügen", systemImage: "photo.badge.plus")
                    .frame(minHeight: 44)
            }
            .disabled(busy || speechBusy || photos.count >= 8)
            .accessibilityIdentifier("memory-add-photos")
            if !photos.isEmpty { Text("\(photos.count) von 8 Fotos").font(.caption).foregroundStyle(.secondary) }
        }
    }

    private func startDictation() {
        guard loaded, !busy, !speechBusy else { return }
        textFocused = false
        // Keep manual edits verbatim, including intentional leading/trailing whitespace.
        dictationPrefix = text
        acceptingTranscript = true
        startTask?.cancel()
        startTask = Task { await recorder.start() }
    }

    private func applyTranscript(_ transcript: String) {
        guard acceptingTranscript, !transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        text = dictationPrefix.isEmpty ? transcript : dictationPrefix + "\n" + transcript
        changed = true
    }

    private func endDictation() {
        applyTranscript(recorder.transcript)
        acceptingTranscript = false
        startTask?.cancel()
        startTask = nil
        recorder.cancel()
    }

    private func requestDismiss() {
        endDictation()
        textFocused = false
        if changed { discard = true } else { dismiss() }
    }

    private func load() {
        guard !loaded else { return }
        if let existing {
            text = existing.text
            typing = true
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
        guard loaded, !busy, !speechBusy, let destination else { return }
        let entry = existing ?? JournalEntry(tripID: destination.tripID, day: destination.day, text: text)
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
                VStack(alignment: .leading, spacing: 4) {
                    Text(entry.originalTitle).font(.subheadline.weight(.semibold))
                    Text(displayDate(entry.originalDate)).font(.caption).foregroundStyle(.secondary)
                }.listRowSeparator(.hidden)
                if !entry.text.isEmpty { Text(entry.text).textSelection(.enabled).accessibilityIdentifier("journal-entry-text") }
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
                Section {
                    NavigationLink {
                        DayView(trip: trip, day: day)
                    } label: {
                        Label {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Tagesroute ansehen").font(.subheadline.weight(.semibold))
                                Text("\(trip.name) · Tag \(day.number)").font(.caption).foregroundStyle(.secondary)
                                    .accessibilityIdentifier("journal-stage-context")
                            }
                        } icon: { Image(systemName: "map") }
                    }.accessibilityIdentifier("journal-open-stage")
                    JournalAnimationLink(trip: trip, day: day)
                    if day.title != entry.originalTitle || day.date != entry.originalDate {
                        Text("Titel oder Datum dieser Etappe wurden im Reiseplan angepasst. Dein Eintrag behält die ursprünglichen Angaben.")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                }
            } else {
                Section("Zugehörige Tagesetappe") {
                    Label("Diese Etappe ist im aktuellen Reiseplan nicht mehr verfügbar.", systemImage: "map")
                    Text("Dein Eintrag und die Fotos bleiben erhalten.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            if let error { Text(error).foregroundStyle(.red) }
        }
        .navigationTitle("Eintrag").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button("Bearbeiten") { editing = true }
            Menu {
                Button("Eintrag löschen", role: .destructive) { deleting = true }
            } label: { Image(systemName: "ellipsis") }
                .accessibilityLabel("Weitere Aktionen").accessibilityIdentifier("entry-more")
        }
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
