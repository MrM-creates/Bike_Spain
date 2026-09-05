import Foundation
import SwiftData
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

@main struct JournalChecks {
    @MainActor static func main() throws {
        let directory = FileManager.default.temporaryDirectory.appending(path: "roadbook-check-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let schema = Schema([JournalEntry.self, JournalPhoto.self])
        let storeURL = directory.appending(path: "first.store")
        let otherURL = directory.appending(path: "other.store")
        let feed = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))).validated()
        let day = feed.trips[0].days[0]
        let context = CGContext(data: nil, width: 4000, height: 2500, bitsPerComponent: 8, bytesPerRow: 0,
                                space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
        context.setFillColor(CGColor(red: 0.1, green: 0.5, blue: 0.3, alpha: 1)); context.fill(CGRect(x: 0, y: 0, width: 4000, height: 2500))
        let png = NSMutableData()
        let destination = CGImageDestinationCreateWithData(png, UTType.png.identifier as CFString, 1, nil)!
        CGImageDestinationAddImage(destination, context.makeImage()!, nil)
        precondition(CGImageDestinationFinalize(destination))
        let jpeg = try PhotoProcessor.jpeg(png as Data)
        let source = CGImageSourceCreateWithData(jpeg as CFData, nil)!
        let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil)! as NSDictionary
        precondition(properties[kCGImagePropertyPixelWidth] as? Int == 2400)
        precondition(properties[kCGImagePropertyPixelHeight] as? Int == 1500)
        precondition(properties[kCGImagePropertyGPSDictionary] == nil)
        do { _ = try PhotoProcessor.jpeg(Data("not an image".utf8)); fatalError("Invalid photo accepted") } catch {}
        try autoreleasepool {
            let container = try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, url: storeURL, cloudKitDatabase: .none)])
            let model = ModelContext(container)
            let entry = JournalEntry(tripID: feed.trips[0].id, day: day, text: "Private test")
            model.insert(entry); model.insert(JournalPhoto(entryID: entry.id, jpeg: jpeg, caption: "Test"))
            try model.save()
        }
        let reopened = try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, url: storeURL, cloudKitDatabase: .none)])
        let model = ModelContext(reopened)
        let entries = try model.fetch(FetchDescriptor<JournalEntry>())
        precondition(entries.count == 1 && entries[0].stageID == day.id && entries[0].originalTitle == day.title)
        let photos = try model.fetch(FetchDescriptor<JournalPhoto>())
        precondition(photos.count == 1 && photos[0].jpeg == jpeg && photos[0].entryID == entries[0].id)
        let other = try ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema, url: otherURL, cloudKitDatabase: .none)])
        let otherEntries = try ModelContext(other).fetch(FetchDescriptor<JournalEntry>())
        let otherPhotos = try ModelContext(other).fetch(FetchDescriptor<JournalPhoto>())
        precondition(otherEntries.isEmpty && otherPhotos.isEmpty)
        print("Journal checks passed: text/photo disk persistence, stable stage context, isolated stores, photo downsampling and invalid-image rejection. No CloudKit test.")
        print("Synthetic test store: \(directory.path)")
    }
}
