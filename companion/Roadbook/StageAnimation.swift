import Foundation
import CryptoKit

struct AnimationCatalog: Codable {
    let schemaVersion: Int
    let assets: [StageAnimation]

    func validated() throws -> Self {
        guard schemaVersion == 1, assets.count <= 500,
              Set(assets.map(\.id)).count == assets.count else { throw AnimationFailure.invalid }
        for asset in assets { try asset.validate() }
        return self
    }
}

struct StageAnimation: Codable, Identifiable, Equatable, Sendable {
    let tripID: String
    let stageID: String
    let tripName: String
    let number: Int
    let date: String
    let title: String
    let routeFingerprint: String
    let sha256: String
    let url: URL
    let bytes: Int64
    let duration: Double
    let width: Int
    let height: Int
    var id: String { "\(tripID)/\(stageID)/\(sha256)" }
    var stageKey: String { "\(tripID)/\(stageID)" }
    var filename: String { "Tag-\(number)-\(sha256).mp4" }
    var sizeText: String { ByteCountFormatter.string(fromByteCount: bytes, countStyle: .file) }

    func validate() throws {
        func digest(_ value: String) -> Bool {
            value.count == 64 && value.allSatisfy { "0123456789abcdef".contains($0) }
        }
        guard !tripID.isEmpty, !stageID.isEmpty, !title.isEmpty, number > 0,
              date.count == 10, digest(sha256), digest(routeFingerprint),
              bytes > 0, bytes <= 50_000_000, duration.isFinite, (1...180).contains(duration),
              width > 0, width <= 1920, height > 0, height <= 2560,
              Self.allowed(url) else { throw AnimationFailure.invalid }
    }

    static func allowed(_ url: URL) -> Bool {
        guard url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.path.hasPrefix("/animations/media/"), url.path.hasSuffix(".mp4"),
              !url.pathComponents.contains("..") else { return false }
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing"),
           url.scheme == "http", url.host == "127.0.0.1" { return true }
        #endif
        return url.scheme == "https" && url.host == "motorrad-roadbook-spanien-2026.vercel.app" && (url.port == nil || url.port == 443)
    }

    static func fingerprint(tripID: String, day: TripDay) -> String {
        var fields = [tripID, day.id, String(day.number), day.date, day.title, day.distance,
                      day.overnight, day.roads, day.mapsURL]
        for line in day.map?.lines ?? [] {
            fields.append(line.kind)
            for pair in line.coordinates {
                fields.append(pair.map { String(Int64(floor($0 * 1_000_000 + 0.5))) }.joined(separator: ","))
            }
        }
        return digest(Data(fields.joined(separator: "\n").utf8))
    }

    static func digest(_ data: Data) -> String {
        SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}

enum AnimationFailure: LocalizedError {
    case invalid, download, storage
    var errorDescription: String? {
        switch self {
        case .invalid: "Das Video konnte nicht geprüft werden. Bitte später erneut herunterladen."
        case .download: "Download nicht möglich. Prüfe die Verbindung und versuche es erneut."
        case .storage: "Das Video konnte nicht gespeichert werden. Prüfe den freien Speicher auf deinem Gerät."
        }
    }
}
