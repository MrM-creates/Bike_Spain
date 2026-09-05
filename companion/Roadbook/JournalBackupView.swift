import SwiftUI
import SwiftData
import UniformTypeIdentifiers

private struct BackupDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else { throw BackupError.invalid }
        self.data = data
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

struct JournalBackupView: View {
    let journal: JournalSession
    @Environment(\.colorScheme) private var colorScheme
    @State private var document: BackupDocument?
    @State private var exporting = false
    @State private var importing = false
    @State private var pending: JournalBackup?
    @State private var confirmImport = false
    @State private var ownBackup = false
    @State private var busy = false
    @State private var message: String?
    @State private var error: String?
    @State private var exportSucceeded = false

    var body: some View {
        List {
            Section {
                Label("Deine Erinnerungen behalten", systemImage: "externaldrive")
                    .font(.headline)
                Text("Sichere die auf diesem Gerät verfügbaren Einträge und Fotos aus beiden Reisen. Warte vorher den Abgleich mit deinem anderen Gerät ab.")
                Text("Die Datei enthält private Texte und Fotos unverschlüsselt. Speichere sie nur an einem eigenen, geschützten Ort – nicht in einem geteilten Ordner.")
                    .font(.subheadline).foregroundStyle(.secondary)
                Button { export() } label: {
                    Label("Sicherung speichern", systemImage: "square.and.arrow.up")
                        .frame(minHeight: 44)
                }.accessibilityIdentifier("export-journal")
                    .disabled(busy || journal.container == nil)
                    .fileExporter(isPresented: $exporting, document: document, contentType: .json,
                                  defaultFilename: "Roadbook-Tagebuch-\(Date().formatted(.iso8601.year().month().day()))") { result in
                        if case .success = result {
                            message = "Sicherung erstellt. Bewahre die Datei bis nach dem geprüften Gerätewechsel auf."
                            exportSucceeded = true
                        }
                        if case .failure = result { error = "Die Datei konnte nicht gespeichert werden. Bitte erneut versuchen und einen eigenen Speicherort wählen." }
                        document = nil
                    }
            }
            Section {
                Button { pending = nil; ownBackup = false; error = nil; importing = true } label: {
                    Label("Sicherung einlesen", systemImage: "square.and.arrow.down")
                        .frame(minHeight: 44)
                }.accessibilityIdentifier("import-journal")
                    .disabled(busy || journal.container == nil)
                    .fileImporter(isPresented: $importing, allowedContentTypes: [.json]) { result in
                        switch result {
                        case .success(let url): read(url)
                        case .failure: error = "Die Datei konnte nicht geöffnet werden. Bitte erneut auswählen."
                        }
                    }
                Text("Erst die Datei prüfen, dann bestätigen. Vorhandene Erinnerungen werden nicht überschrieben.")
                    .font(.caption).foregroundStyle(.secondary)
                Text("Zum Umziehen nur auf einem Gerät einlesen. Auf dem zweiten Gerät den iCloud-Abgleich abwarten, nicht dieselbe Sicherung gleichzeitig einlesen.")
                    .font(.caption).foregroundStyle(.secondary)
            }
            if let pending {
                Section("Ausgewählte Sicherung") {
                    Text("\(pending.entries.count) Einträge · \(pending.photos.count) Fotos")
                    Text("Erstellt: \(pending.createdAt.formatted(date: .abbreviated, time: .shortened))")
                    Toggle("Das ist meine eigene Sicherung", isOn: $ownBackup)
                    Text("Die Inhalte werden in das Tagebuch des aktuell angemeldeten iCloud-Accounts übernommen und privat mit dessen Geräten abgeglichen.")
                        .font(.caption).foregroundStyle(.secondary)
                    Button("In mein Tagebuch übernehmen") { confirmImport = true }
                        .disabled(!ownBackup || busy || journal.container == nil)
                        .accessibilityIdentifier("restore-journal")
                    Button("Auswahl verwerfen", role: .cancel) { self.pending = nil; ownBackup = false }
                }
            }
            if busy { ProgressView("Sicherung wird geprüft …") }
            if let error { Section { Label(error, systemImage: "exclamationmark.triangle").foregroundStyle(.primary) } }
            if let message { Section { Label(message, systemImage: "checkmark.circle").accessibilityIdentifier("backup-result") } }
            Section {
                Text("Eine Sicherung ist eine Momentaufnahme, keine Bestätigung eines vollständigen iCloud-Abgleichs. Die gespeicherte Datei wird bei späteren Änderungen nicht automatisch aktualisiert.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Tagebuch sichern").navigationBarTitleDisplayMode(.inline)
        .tint(colorScheme == .dark ? RoadbookStyle.lightAccent : RoadbookStyle.accent)
        .alert("Sicherung erstellt", isPresented: $exportSucceeded) {
            Button("OK", role: .cancel) {}
        } message: {
            Text("Deine Tagebucheinträge und Fotos wurden in der gewählten Datei gespeichert. Bewahre sie an einem privaten, geschützten Ort auf.")
        }
        .confirmationDialog("Eigene Sicherung in dieses Tagebuch übernehmen?", isPresented: $confirmImport, titleVisibility: .visible) {
            Button("Übernehmen") { restore() }
            Button("Abbrechen", role: .cancel) {}
        } message: {
            Text("Neue Einträge werden im aktuellen privaten iCloud-Account gespeichert. Bestehende Einträge bleiben erhalten.")
        }
    }

    private func export() {
        guard let container = journal.container else { return }
        error = nil; message = nil
        do {
            document = BackupDocument(data: try JournalBackup.capture(from: container).encoded())
            exporting = true
        } catch { self.error = error.localizedDescription }
    }

    private func read(_ url: URL) {
        let identity = journal.identity
        busy = true; message = nil; error = nil
        Task {
            let result = await Task.detached { Result { try JournalBackup.read(from: url) } }.value
            guard journal.identity == identity else { busy = false; return }
            busy = false
            switch result {
            case .success(let backup): pending = backup
            case .failure(let failure): error = failure.localizedDescription
            }
        }
    }

    private func restore() {
        guard ownBackup, let pending, let container = journal.container else { return }
        error = nil; message = nil
        do {
            let count = try pending.restore(into: container)
            self.pending = nil; ownBackup = false
            message = "\(count) neue Einträge übernommen. Bereits identische Inhalte wurden nicht verdoppelt. Der iCloud-Abgleich erfolgt im Hintergrund."
        } catch { self.error = error.localizedDescription }
    }
}
