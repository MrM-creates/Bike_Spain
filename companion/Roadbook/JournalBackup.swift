import Foundation
import SwiftData
import ImageIO

/// A portable snapshot, never a live CloudKit store or an implicit migration.
struct JournalBackup: Codable, Sendable {
    static let maximumFileBytes = 64 * 1024 * 1024
    var format = "com.mrm.roadbook.journal-backup"
    var version = 1
    var createdAt = Date()
    var entries: [Entry]
    var photos: [Photo]

    struct Entry: Codable, Equatable, Sendable {
        var id: UUID
        var tripID: String
        var stageID: String
        var originalDate: String
        var originalTitle: String
        var text: String
        var createdAt: Date
        var updatedAt: Date

        init(_ entry: JournalEntry) {
            id = entry.id; tripID = entry.tripID; stageID = entry.stageID
            originalDate = entry.originalDate; originalTitle = entry.originalTitle
            text = entry.text; createdAt = entry.createdAt; updatedAt = entry.updatedAt
        }
    }

    struct Photo: Codable, Equatable, Sendable {
        var id: UUID
        var entryID: UUID
        var caption: String
        var jpeg: Data
    }

    func validated() throws -> Self {
        guard format == "com.mrm.roadbook.journal-backup", version == 1,
              createdAt.timeIntervalSince1970.isFinite,
              entries.count <= 5_000, photos.count <= 2_500,
              Set(entries.map(\.id)).count == entries.count,
              Set(photos.map(\.id)).count == photos.count else { throw BackupError.invalid }
        let entryIDs = Set(entries.map(\.id))
        for entry in entries {
            guard !entry.tripID.isEmpty, !entry.stageID.isEmpty,
                  entry.tripID.count <= 256, entry.stageID.count <= 256,
                  entry.originalDate.count <= 32, entry.originalTitle.count <= 10_000,
                  entry.text.utf8.count <= 1_000_000,
                  entry.createdAt.timeIntervalSince1970.isFinite,
                  entry.updatedAt.timeIntervalSince1970.isFinite else { throw BackupError.invalid }
        }
        var bytes = 0
        for photo in photos {
            bytes += photo.jpeg.count
            guard entryIDs.contains(photo.entryID), photo.caption.count <= 10_000,
                  !photo.jpeg.isEmpty, photo.jpeg.count <= 10 * 1024 * 1024,
                  bytes <= 40 * 1024 * 1024,
                  let source = CGImageSourceCreateWithData(photo.jpeg as CFData, nil),
                  CGImageSourceGetCount(source) == 1,
                  let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
                  let width = properties[kCGImagePropertyPixelWidth] as? Int,
                  let height = properties[kCGImagePropertyPixelHeight] as? Int,
                  width > 0, height > 0, width <= 2_400, height <= 2_400,
                  CGImageSourceCreateImageAtIndex(source, 0, nil) != nil else { throw BackupError.invalid }
        }
        return self
    }

    func encoded() throws -> Data {
        let data = try JSONEncoder().encode(validated())
        guard data.count <= Self.maximumFileBytes else { throw BackupError.tooLarge }
        return data
    }

    static func decode(_ data: Data) throws -> Self {
        guard data.count <= maximumFileBytes else { throw BackupError.tooLarge }
        do { return try JSONDecoder().decode(Self.self, from: data).validated() }
        catch { throw BackupError.invalid }
    }

    static func read(from url: URL) throws -> Self {
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        let handle = try FileHandle(forReadingFrom: url)
        defer { try? handle.close() }
        // Bound reads even when a file provider does not expose file-size metadata.
        let data = try handle.read(upToCount: maximumFileBytes + 1) ?? Data()
        return try decode(data)
    }

    @MainActor static func capture(from container: ModelContainer) throws -> Self {
        let context = ModelContext(container)
        context.autosaveEnabled = false
        let entries = try context.fetch(FetchDescriptor<JournalEntry>()).map(Entry.init)
        let photos = try context.fetch(FetchDescriptor<JournalPhoto>()).map { photo in
            guard let data = photo.jpeg, !data.isEmpty else { throw BackupError.missingPhoto }
            return Photo(id: photo.id, entryID: photo.entryID, caption: photo.caption, jpeg: data)
        }
        return try Self(entries: entries, photos: photos).validated()
    }

    /// All conflicts are checked before insertion. This context never owns an editor's changes.
    @MainActor func restore(into container: ModelContainer) throws -> Int {
        _ = try validated()
        let context = ModelContext(container)
        context.autosaveEnabled = false
        let storedEntries = try context.fetch(FetchDescriptor<JournalEntry>())
        let storedPhotos = try context.fetch(FetchDescriptor<JournalPhoto>())
        guard Set(storedEntries.map(\.id)).count == storedEntries.count,
              Set(storedPhotos.map(\.id)).count == storedPhotos.count else { throw BackupError.conflict }
        let byEntry = Dictionary(uniqueKeysWithValues: storedEntries.map { ($0.id, Entry($0)) })
        let byPhoto = Dictionary(uniqueKeysWithValues: storedPhotos.map { ($0.id, $0) })
        for entry in entries {
            if let existing = byEntry[entry.id], existing != entry { throw BackupError.conflict }
        }
        for photo in photos {
            if let existing = byPhoto[photo.id],
               existing.entryID != photo.entryID || existing.caption != photo.caption || existing.jpeg != photo.jpeg {
                throw BackupError.conflict
            }
        }
        do {
            var count = 0
            for item in entries where byEntry[item.id] == nil {
                let day = TripDay(id: item.stageID, number: 1, date: item.originalDate, title: item.originalTitle,
                                  rest: true, distance: "", duration: "", overnight: "", roads: "", notes: "", mapsURL: "", accommodation: nil)
                let entry = JournalEntry(tripID: item.tripID, day: day, text: item.text)
                entry.id = item.id; entry.createdAt = item.createdAt; entry.updatedAt = item.updatedAt
                context.insert(entry); count += 1
            }
            for item in photos where byPhoto[item.id] == nil {
                let photo = JournalPhoto(entryID: item.entryID, jpeg: item.jpeg, caption: item.caption)
                photo.id = item.id; context.insert(photo)
            }
            try context.save()
            return count
        } catch {
            context.rollback()
            throw BackupError.saveFailed
        }
    }
}

enum BackupError: LocalizedError {
    case invalid, tooLarge, missingPhoto, conflict, saveFailed
    var errorDescription: String? {
        switch self {
        case .invalid: "Diese Sicherung ist unvollständig, beschädigt oder nicht unterstützt. Es wurde nichts übernommen. Bitte eine andere Sicherung wählen."
        case .tooLarge: "Diese Sicherung ist grösser als 64 MB und kann noch nicht verarbeitet werden. Deine Einträge bleiben unverändert."
        case .missingPhoto: "Mindestens ein Foto ist noch nicht auf diesem Gerät verfügbar. Bitte den iCloud-Abgleich abwarten und erneut sichern."
        case .conflict: "Ein vorhandener Eintrag oder ein Foto weicht von der Sicherung ab. Es wurde nichts übernommen oder überschrieben. Bitte zuerst den aktuellen Stand sichern."
        case .saveFailed: "Die Sicherung konnte nicht übernommen werden. Die Änderungen wurden zurückgenommen. Bitte Speicherplatz und iCloud prüfen und erneut versuchen."
        }
    }
}

enum JournalStorage {
    static func directory(root: URL, owner: String, production: Bool) -> URL {
        // Preserve the legacy development store in place. Never open it with Production sync.
        root.appending(path: production ? "PrivateJournalProduction/\(owner)" : "PrivateJournal/\(owner)")
    }
    static var production: Bool {
        #if DEBUG
        false
        #else
        true
        #endif
    }
}
