import Foundation
import SwiftData
import CloudKit
import CryptoKit
import Observation

@Model final class JournalEntry {
    var id: UUID = UUID()
    var tripID: String = ""
    var stageID: String = ""
    var originalDate: String = ""
    var originalTitle: String = ""
    var text: String = ""
    var createdAt: Date = Date()
    var updatedAt: Date = Date()
    init(tripID: String, day: TripDay, text: String) {
        self.tripID = tripID; stageID = day.id
        originalDate = day.date; originalTitle = day.title; self.text = text
    }
}

@Model final class JournalPhoto {
    var id: UUID = UUID()
    var entryID: UUID = UUID()
    var caption: String = ""
    @Attribute(.externalStorage) var jpeg: Data?
    init(entryID: UUID, jpeg: Data, caption: String = "") {
        self.entryID = entryID; self.jpeg = jpeg; self.caption = caption
    }
}

@MainActor @Observable
final class JournalSession {
    private(set) var container: ModelContainer?
    private(set) var status = "Persönlicher Speicher wird geöffnet …"
    private(set) var error: String?
    private(set) var identity = UUID()
    private var generation = UUID()
    private var observer: NSObjectProtocol?
    private var opening = false
    private var lastCheck: Date?

    private var cloudID: String {
        (Bundle.main.object(forInfoDictionaryKey: "RoadbookCloudContainer") as? String ?? "").trimmingCharacters(in: .whitespaces)
    }

    func recheckIfNeeded() async {
        guard !opening, container == nil, !cloudID.isEmpty,
              lastCheck == nil || Date().timeIntervalSince(lastCheck!) > 30 else { return }
        await open()
    }

    init() {
        observer = NotificationCenter.default.addObserver(forName: .CKAccountChanged, object: nil, queue: .main) { [weak self] _ in
            Task { @MainActor in await self?.open() }
        }
    }

    func open() async {
        let token = UUID(); generation = token
        opening = true
        defer { if generation == token { opening = false; lastCheck = Date() } }
        // Remove every previous-account view before resolving a new identity.
        container = nil; identity = UUID(); error = nil
        do {
            let schema = Schema([JournalEntry.self, JournalPhoto.self])
            var owner = "local-device"
            var cloud: ModelConfiguration.CloudKitDatabase = .none
            #if DEBUG
            let testing = ProcessInfo.processInfo.arguments.contains("-ui-testing")
            if testing && ProcessInfo.processInfo.arguments.contains("-ui-test-account-unavailable") {
                throw JournalError.accountUnavailable
            }
            #else
            let testing = false
            #endif
            if !cloudID.isEmpty && !testing {
                let account = CKContainer(identifier: cloudID)
                guard try await account.accountStatus() == .available else {
                    throw JournalError.accountUnavailable
                }
                let recordName = try await account.userRecordID().recordName
                owner = SHA256.hash(data: Data(recordName.utf8)).map { String(format: "%02x", $0) }.joined()
                cloud = .private(cloudID)
                status = "Nur du · private iCloud-Ablage eingerichtet. Abgleich erfolgt im Hintergrund."
            } else {
                status = "Nur auf diesem Gerät · iCloud noch nicht eingerichtet"
            }
            guard generation == token else { return }
            let directory = JournalStorage.directory(root: .applicationSupportDirectory, owner: owner,
                                                     production: JournalStorage.production)
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let configuration = ModelConfiguration(schema: schema, url: directory.appending(path: testing ? "uitest.store" : "journal.store"), cloudKitDatabase: cloud)
            container = try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            guard generation == token else { return }
            self.error = "Dein Tagebuch konnte nicht geöffnet werden. Es wurde nichts gelöscht. \(error.localizedDescription)"
        }
    }
}
enum JournalError: LocalizedError {
    case accountUnavailable
    var errorDescription: String? { "Bitte die iCloud-Anmeldung und Internetverbindung prüfen und erneut versuchen." }
}
