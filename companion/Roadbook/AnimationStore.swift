import Foundation
import Observation
import AVFoundation

private final class AnimationTransfer: NSObject, URLSessionDownloadDelegate, @unchecked Sendable {
    let expected: StageAnimation
    let progress: @Sendable (Double) -> Void
    init(expected: StageAnimation, progress: @escaping @Sendable (Double) -> Void) {
        self.expected = expected; self.progress = progress
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask,
                    didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        if totalBytesWritten > expected.bytes { downloadTask.cancel(); return }
        progress(min(1, Double(totalBytesWritten) / Double(expected.bytes)))
    }
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {}
    func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(request.url.map(StageAnimation.allowed) == true ? request : nil)
    }
}

@MainActor @Observable
final class AnimationStore {
    private(set) var catalog: [StageAnimation] = []
    private(set) var downloads: [StageAnimation] = []
    private(set) var progress: [String: Double] = [:]
    private(set) var queue: [StageAnimation] = []
    private(set) var failures: [String: String] = [:]
    private(set) var refreshing = false
    private(set) var catalogError: String?
    private(set) var storageError: String?
    private var transferTask: Task<Void, Never>?
    private var active: StageAnimation?
    @ObservationIgnored private var fingerprints: [String: String] = [:]
    private let directory: URL
    private let session: URLSession
    private let endpoint: URL
    private var registry: URL { directory.appending(path: "downloads.json") }
    private var catalogFile: URL { directory.appending(path: "catalog.json") }

    init() {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        let testing = args.contains("-ui-testing")
        if let index = args.firstIndex(of: "-animation-server"), args.indices.contains(index + 1),
           let url = URL(string: args[index + 1]), url.host == "127.0.0.1", testing {
            endpoint = url.appending(path: "animations/catalog.json")
        } else { endpoint = Self.endpoint }
        directory = URL.applicationSupportDirectory.appending(path: testing ? "UITestAnimations" : "StageAnimations")
        #else
        endpoint = Self.endpoint
        directory = URL.applicationSupportDirectory.appending(path: "StageAnimations")
        #endif
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 40
        config.timeoutIntervalForResource = 180
        config.urlCache = nil
        #if DEBUG
        if testing && args.contains("-ui-test-animation-offline") { config.protocolClasses = [AnimationOfflineProtocol.self] }
        if testing && args.contains("-ui-test-animation-reset") { try? FileManager.default.removeItem(at: directory) }
        #endif
        session = URLSession(configuration: config)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            var location = directory
            var values = URLResourceValues(); values.isExcludedFromBackup = true
            try location.setResourceValues(values)
            for partial in (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
                where partial.lastPathComponent.hasPrefix(".download-") {
                try? FileManager.default.removeItem(at: partial)
            }
            if let data = try? Data(contentsOf: registry),
               let saved = try? JSONDecoder().decode(AnimationCatalog.self, from: data).validated() { downloads = saved.assets }
            let cached = (try? Data(contentsOf: catalogFile)) ?? Bundle.main.url(forResource: "animations", withExtension: "json").flatMap { try? Data(contentsOf: $0) }
            if let cached, let saved = try? JSONDecoder().decode(AnimationCatalog.self, from: cached).validated() { catalog = saved.assets }
        } catch { storageError = AnimationFailure.storage.localizedDescription }
    }
    static let endpoint = URL(string: "https://motorrad-roadbook-spanien-2026.vercel.app/animations/catalog.json")!

    func available(trip: TripPlan, day: TripDay) -> StageAnimation? {
        let candidates = catalog.filter { $0.tripID == trip.id && $0.stageID == day.id }
        guard !candidates.isEmpty else { return nil }
        let fingerprint = fingerprint(trip: trip, day: day)
        return candidates.first { $0.routeFingerprint == fingerprint }
    }
    func fingerprint(trip: TripPlan, day: TripDay) -> String {
        let key = "\(trip.id)/\(trip.version)/\(day.id)"
        if let value = fingerprints[key] { return value }
        let value = StageAnimation.fingerprint(tripID: trip.id, day: day)
        fingerprints[key] = value
        return value
    }
    func saved(tripID: String, stageID: String) -> StageAnimation? {
        downloads.last { $0.tripID == tripID && $0.stageID == stageID && localURL($0) != nil }
    }
    func localURL(_ asset: StageAnimation) -> URL? {
        guard downloads.contains(where: { $0.id == asset.id }) else { return nil }
        let url = directory.appending(path: asset.filename)
        guard let values = try? url.resourceValues(forKeys: [.fileSizeKey]), values.fileSize == Int(asset.bytes) else { return nil }
        return url
    }
    func queued(_ asset: StageAnimation) -> Bool { queue.contains { $0.id == asset.id } }
    var usedBytes: Int64 { downloads.filter { localURL($0) != nil }.reduce(0) { $0 + $1.bytes } }

    func refresh() async {
        guard !refreshing else { return }
        refreshing = true; defer { refreshing = false }
        do {
            let (data, response) = try await session.data(for: URLRequest(url: endpoint, cachePolicy: .reloadIgnoringLocalCacheData))
            try Task.checkCancellation()
            guard let http = response as? HTTPURLResponse, http.statusCode == 200, data.count <= 1_000_000,
                  http.url?.host == endpoint.host else { throw AnimationFailure.invalid }
            let next = try JSONDecoder().decode(AnimationCatalog.self, from: data).validated()
            try data.write(to: catalogFile, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
            catalog = next.assets; catalogError = nil
        } catch {
            if !Task.isCancelled { catalogError = "Die Videoliste konnte nicht aktualisiert werden. Gespeicherte Videos bleiben verfügbar." }
        }
    }
    func enqueue(_ assets: [StageAnimation]) {
        for asset in assets where localURL(asset) == nil && !queued(asset) && active?.id != asset.id {
            guard (try? asset.validate()) != nil else { continue }
            failures[asset.id] = nil
            queue.append(asset)
        }
        startNext()
    }
    func cancel(_ asset: StageAnimation) {
        queue.removeAll { $0.id == asset.id }
        if active?.id == asset.id { transferTask?.cancel() }
    }
    private func startNext() {
        guard active == nil, !queue.isEmpty else { return }
        let asset = queue.removeFirst(); active = asset; progress[asset.id] = 0
        transferTask = Task { [self] in
            defer {
                progress[asset.id] = nil; active = nil; transferTask = nil; startNext()
            }
            do {
                let delegate = AnimationTransfer(expected: asset) { [weak self] value in
                    Task { @MainActor [weak self] in if self?.active?.id == asset.id { self?.progress[asset.id] = value } }
                }
                let request = URLRequest(url: asset.url, cachePolicy: .reloadIgnoringLocalCacheData)
                let (temporary, response) = try await session.download(for: request, delegate: delegate)
                defer { try? FileManager.default.removeItem(at: temporary) }
                try Task.checkCancellation()
                guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                      http.url.map(StageAnimation.allowed) == true else { throw AnimationFailure.download }
                let data = try Data(contentsOf: temporary, options: .mappedIfSafe)
                guard data.count == Int(asset.bytes), StageAnimation.digest(data) == asset.sha256 else { throw AnimationFailure.invalid }
                // AVFoundation uses the extension when recognizing a local asset.
                // URLSession's temporary filename has no reliable media extension.
                let staging = directory.appending(path: ".download-\(UUID().uuidString).mp4")
                try FileManager.default.moveItem(at: temporary, to: staging)
                defer { try? FileManager.default.removeItem(at: staging) }
                let media = AVURLAsset(url: staging)
                guard try await media.load(.isPlayable) else { throw AnimationFailure.invalid }
                let tracks = try await media.loadTracks(withMediaType: .video)
                guard !tracks.isEmpty else { throw AnimationFailure.invalid }
                try Task.checkCancellation()
                let target = directory.appending(path: asset.filename)
                // All verification happens before a completed file becomes visible.
                if FileManager.default.fileExists(atPath: target.path) { try FileManager.default.removeItem(at: target) }
                try FileManager.default.moveItem(at: staging, to: target)
                var next = downloads.filter { $0.id != asset.id }; next.append(asset)
                do { try persist(next); downloads = next; failures[asset.id] = nil }
                catch { try? FileManager.default.removeItem(at: target); throw AnimationFailure.storage }
            } catch {
                if !Task.isCancelled {
                    failures[asset.id] = (error as? AnimationFailure)?.localizedDescription ?? AnimationFailure.download.localizedDescription
                }
            }
        }
    }
    func remove(_ asset: StageAnimation) {
        cancel(asset)
        do {
            let target = directory.appending(path: asset.filename)
            if FileManager.default.fileExists(atPath: target.path) { try FileManager.default.removeItem(at: target) }
            let next = downloads.filter { $0.id != asset.id }
            try persist(next); downloads = next; storageError = nil
        } catch { storageError = AnimationFailure.storage.localizedDescription }
    }
    private func persist(_ assets: [StageAnimation]) throws {
        try JSONEncoder().encode(AnimationCatalog(schemaVersion: 1, assets: assets))
            .write(to: registry, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }
}

#if DEBUG
private final class AnimationOfflineProtocol: URLProtocol {
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() { client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet)) }
    override func stopLoading() {}
}
#endif
