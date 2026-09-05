import Foundation
import SwiftData
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

@main struct BackupChecks {
    @MainActor static func main() throws {
        func check(_ value: Bool) { precondition(value) }
        let root = FileManager.default.temporaryDirectory.appending(path: "roadbook-backup-check-\(UUID())")
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
        let schema = Schema([JournalEntry.self, JournalPhoto.self])
        func store(_ name: String) throws -> ModelContainer {
            try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, url: root.appending(path: name), cloudKitDatabase: .none)])
        }
        let old = try store("development.store")
        let fresh = try store("production.store")
        let context = ModelContext(old); context.autosaveEnabled = false
        let feed = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))).validated()
        let entry = JournalEntry(tripID: feed.trips[0].id, day: feed.trips[0].days[0], text: "Synthetische Erinnerung 🏍️")
        context.insert(entry)
        let canvas = CGContext(data: nil, width: 20, height: 20, bitsPerComponent: 8, bytesPerRow: 0,
                               space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        canvas.setFillColor(CGColor(red: 0.1, green: 0.4, blue: 0.2, alpha: 1)); canvas.fill(CGRect(x: 0, y: 0, width: 20, height: 20))
        let imageData = NSMutableData()
        let destination = CGImageDestinationCreateWithData(imageData, UTType.jpeg.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(destination, canvas.makeImage()!, nil)
        precondition(CGImageDestinationFinalize(destination))
        let photo = JournalPhoto(entryID: entry.id, jpeg: imageData as Data, caption: "Testfoto")
        context.insert(photo); try context.save()

        let snapshot = try JournalBackup.capture(from: old)
        let data = try snapshot.encoded()
        let decoded = try JournalBackup.decode(data)
        precondition(decoded.entries == snapshot.entries && decoded.photos == snapshot.photos)
        check(try decoded.restore(into: fresh) == 1)
        check(try decoded.restore(into: fresh) == 0)
        let restored = try JournalBackup.capture(from: fresh)
        precondition(restored.entries == snapshot.entries && restored.photos == snapshot.photos)
        check(try JournalBackup.capture(from: old).entries == snapshot.entries)

        func rejected(_ value: JournalBackup) {
            do { _ = try value.restore(into: fresh); fatalError("Invalid backup accepted") } catch {}
        }
        var bad = decoded; bad.version = 99; rejected(bad)
        bad = decoded; bad.entries.append(bad.entries[0]); rejected(bad)
        bad = decoded; bad.photos[0].entryID = UUID(); rejected(bad)
        bad = decoded; bad.photos[0].jpeg = Data("broken".utf8); rejected(bad)
        bad = decoded; bad.photos.append(bad.photos[0]); rejected(bad)
        bad = decoded; bad.entries[0].text = "Conflicting content"
        var additional = decoded.entries[0]; additional.id = UUID(); bad.entries.append(additional)
        rejected(bad) // Also proves the new entry is not partially inserted before the conflict.
        check(try JournalBackup.capture(from: fresh).entries == restored.entries)
        do { _ = try JournalBackup.decode(Data("broken".utf8)); fatalError("Malformed JSON accepted") } catch {}
        do { _ = try JournalBackup.decode(Data(count: JournalBackup.maximumFileBytes + 1)); fatalError("Oversize accepted") } catch {}
        photo.jpeg = nil; try context.save()
        do { _ = try JournalBackup.capture(from: old); fatalError("Missing photo silently dropped") } catch {}
        let legacy = JournalStorage.directory(root: root, owner: "same-account", production: false)
        let production = JournalStorage.directory(root: root, owner: "same-account", production: true)
        precondition(legacy != production && legacy.path.hasSuffix("PrivateJournal/same-account"))
        precondition(production.path.hasSuffix("PrivateJournalProduction/same-account"))
        precondition(JournalStorage.directory(root: root, owner: "other-account", production: true) != production)
        print("Backup checks passed: round-trip incl. photos, preserved IDs/dates, idempotence, no partial conflict writes, malformed/oversize/duplicate/orphan rejection, missing-photo refusal, distinct environments/accounts. No live CloudKit test.")
    }
}
