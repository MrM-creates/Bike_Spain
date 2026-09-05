import Foundation
import Observation
import OSLog

@MainActor @Observable
final class PlanStore {
    private(set) var feed: PlanFeed?
    private(set) var message = "Mitgelieferter Reiseplan · offline verfügbar"
    private(set) var busy = false
    private(set) var error: String?
    private let file: URL
    private let bundled: PlanFeed?
    private let logger = Logger(subsystem: "com.mrm.roadbook", category: "ReadOnlyPlans")
    static let endpoint = URL(string: "https://motorrad-roadbook-spanien-2026.vercel.app/api/companion-plan")!

    init() {
        bundled = Bundle.main.url(forResource: "plans", withExtension: "json")
            .flatMap { try? Data(contentsOf: $0) }
            .flatMap { try? JSONDecoder().decode(PlanFeed.self, from: $0).validated() }
        #if DEBUG
        let testing = ProcessInfo.processInfo.arguments.contains("-ui-testing")
        #else
        let testing = false
        #endif
        let directory = URL.applicationSupportDirectory.appending(path: testing ? "UITestReadOnlyPlans" : "ReadOnlyPlans")
        file = directory.appending(path: "plans.json")
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            if testing {
                // UI tests must inspect this build's fixture, not an old simulator cache.
                feed = bundled
            } else if FileManager.default.fileExists(atPath: file.path) {
                feed = enrich(try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: file)).validated())
                message = "Heruntergeladener Reiseplan · offline verfügbar"
            } else if let bundled = Bundle.main.url(forResource: "plans", withExtension: "json") {
                feed = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: bundled)).validated()
            } else { throw PlanError.invalid }
            // Persist the upgraded cache immediately, including when the device is offline.
            if let feed { try persist(feed) }
        } catch {
            if feed == nil { feed = bundled }
            self.error = "Der gespeicherte Plan konnte nicht geladen oder gesichert werden. Der mitgelieferte Plan bleibt verfügbar."
        }
        logger.info("Loaded read-only plan: \(self.feed?.routeLineCount ?? 0) route lines")
    }

    func refresh() async {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        do {
            var request = URLRequest(url: Self.endpoint, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 25)
            request.httpMethod = "GET"
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200, data.count <= 10_000_000 else { throw PlanError.invalid }
            let next = enrich(try JSONDecoder().decode(PlanFeed.self, from: data).validated())
            // A stale deployment/cache must not silently roll back a downloaded plan.
            for trip in next.trips {
                if let current = feed?.trips.first(where: { $0.id == trip.id }), trip.version < current.version {
                    throw PlanError.invalid
                }
            }
            try persist(next)
            feed = next
            logger.info("Refreshed read-only plan: \(next.routeLineCount) route lines")
            message = "Plan aktualisiert · \(Date().formatted(date: .abbreviated, time: .shortened))"
            error = nil
        } catch {
            logger.error("Read-only plan refresh failed: \(String(describing: error), privacy: .public)")
            self.error = "Aktualisieren nicht möglich. Dein gespeicherter Plan bleibt verfügbar. Bitte später erneut versuchen."
        }
    }

    private func persist(_ plan: PlanFeed) throws {
        try JSONEncoder().encode(plan).write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    }

    // Upgrade an older cached/remote feed without attaching old lines to changed routes.
    private func enrich(_ incoming: PlanFeed) -> PlanFeed {
        incoming.enriched(from: bundled)
    }
}
