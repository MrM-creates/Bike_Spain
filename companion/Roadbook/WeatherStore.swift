import Foundation
import Observation
import WeatherKit
import CoreLocation
import Network
import OSLog

@MainActor @Observable final class WeatherStore {
    private(set) var snapshots: [String: WeatherSnapshot] = [:]
    private(set) var failures: Set<String> = []
    private(set) var loading: Set<String> = []
    private(set) var connected = true
    private(set) var connectionRevision = 0
    private(set) var legalURL = URL(string: "https://weatherkit.apple.com/legal-attribution.html")!
    var enabled: Bool {
        didSet { UserDefaults.standard.set(enabled, forKey: "weather-enabled") }
    }
    private var attempts: [String: Date] = [:]
    private let monitor = NWPathMonitor()
    private let service = WeatherService.shared
    private let file: URL
    private var testing = false
    private let log = Logger(subsystem: "com.mrm.roadbook", category: "Weather")

    private struct Cache: Codable {
        let snapshots: [String: WeatherSnapshot]
        let legalURL: URL
    }
    init() {
        enabled = UserDefaults.standard.object(forKey: "weather-enabled") as? Bool ?? true
        var folderName = "StageWeather"
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing") { folderName = "UITestStageWeather" }
        #endif
        let folder = URL.applicationSupportDirectory.appendingPathComponent(folderName, isDirectory: true)
        file = folder.appendingPathComponent("weather-v1.json")
        #if DEBUG
        let uiTesting = ProcessInfo.processInfo.arguments.contains("-ui-testing")
        testing = uiTesting && !ProcessInfo.processInfo.arguments.contains("-ui-test-weather-live")
        if uiTesting { enabled = true }
        if testing { return }
        #endif
        if let data = try? Data(contentsOf: file), let cache = try? JSONDecoder().decode(Cache.self, from: data) {
            snapshots = cache.snapshots.filter { $0.value.point.end > Date().addingTimeInterval(-86400) }
            legalURL = cache.legalURL
        }
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-test-weather-cache-only") { connected = false; return }
        #endif
        monitor.pathUpdateHandler = { [weak self] path in
            let online = path.status == .satisfied
            Task { @MainActor [weak self] in
                guard let self, self.connected != online else { return }
                self.connected = online
                self.connectionRevision += 1
                if online { self.attempts.removeAll() }
            }
        }
        monitor.start(queue: DispatchQueue(label: "Roadbook.weather.connection"))
    }
    deinit { monitor.cancel() }

    func key(_ request: StageWeatherRequest, _ point: WeatherPoint) -> String { request.id + "|" + point.id }
    func snapshot(_ request: StageWeatherRequest, _ point: WeatherPoint) -> WeatherSnapshot? { snapshots[key(request, point)] }

    func refreshWhileActive(plans: PlanStore) async {
        while !Task.isCancelled {
            if let feed = plans.feed { await refresh(feed: feed) }
            do { try await Task.sleep(for: .seconds(60)) } catch { return }
        }
    }
    func refresh(feed: PlanFeed) async {
        guard enabled, connected, !testing else { return }
        let now = Date()
        // Chronological prefetch makes the next riding days available before opening them offline.
        let requests = feed.trips.flatMap { trip in trip.days.map { StageWeatherRequest(trip: trip, day: $0) } }
        let valid = Set(requests.flatMap { request in request.points.map { key(request, $0) } })
        snapshots = snapshots.filter { valid.contains($0.key) && $0.value.point.end > now.addingTimeInterval(-86400) }
        let sorted = requests.sorted { ($0.points.first?.start ?? .distantFuture) < ($1.points.first?.start ?? .distantFuture) }
        for request in sorted {
            guard !Task.isCancelled, enabled, connected else { return }
            await refresh(request)
        }
    }
    func refresh(_ request: StageWeatherRequest, force: Bool = false) async {
        guard enabled else { return }
        #if DEBUG
        if testing { makeFixture(request); return }
        #endif
        guard connected else { return }
        for point in request.points where point.canFetch(at: Date()) {
            guard !Task.isCancelled, enabled else { return }
            let key = key(request, point), now = Date()
            guard !loading.contains(key), force || snapshots[key]?.isFresh(at: now) != true else { continue }
            guard force || attempts[key].map({ now.timeIntervalSince($0) >= 300 }) != false else { continue }
            attempts[key] = now
            loading.insert(key)
            defer { loading.remove(key) }
            do {
                let forecast = try await service.weather(for: CLLocation(latitude: point.latitude, longitude: point.longitude),
                    including: .hourly(startDate: point.start, endDate: point.end))
                try Task.checkCancellation()
                let hours = forecast.filter { $0.date >= point.start && $0.date < point.end }.map {
                    WeatherHour(date: $0.date, temperature: $0.temperature.converted(to: .celsius).value,
                        precipitationChance: $0.precipitationChance,
                        gust: $0.wind.gust?.converted(to: .kilometersPerHour).value,
                        symbol: $0.symbolName, condition: $0.condition.description)
                }
                // An empty response near the horizon must not erase a usable cached forecast.
                guard !hours.isEmpty else { failures.insert(key); continue }
                snapshots[key] = WeatherSnapshot(point: point, fetchedAt: Date(), expiresAt: forecast.metadata.expirationDate, hours: hours)
                failures.remove(key)
                log.info("WeatherKit forecast received: \(hours.count) hours")
                if let attribution = try? await service.attribution { legalURL = attribution.legalPageURL }
                save()
            } catch is CancellationError {
                attempts.removeValue(forKey: key)
                return
            } catch {
                if Task.isCancelled { attempts.removeValue(forKey: key); return }
                failures.insert(key)
                let failure = error as NSError
                log.error("WeatherKit request failed: \(failure.domain, privacy: .public) \(failure.code)")
            }
        }
    }
    private func save() {
        do {
            try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
            let data = try JSONEncoder().encode(Cache(snapshots: snapshots, legalURL: legalURL))
            try data.write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        } catch { log.error("Weather cache could not be saved") }
    }

    #if DEBUG
    private func makeFixture(_ request: StageWeatherRequest) {
        let args = ProcessInfo.processInfo.arguments
        guard args.contains("-ui-test-weather") else { return }
        let offline = args.contains("-ui-test-weather-offline")
        connected = !offline
        guard !args.contains("-ui-test-weather-empty") else { return }
        for point in request.points {
            let hours = (0..<9).map { offset in
                WeatherHour(date: point.start.addingTimeInterval(Double(offset) * 3600), temperature: 12 + Double(offset),
                            precipitationChance: 0.35, gust: 28, symbol: "cloud.sun.fill", condition: "Teilweise bewölkt")
            }
            snapshots[key(request, point)] = WeatherSnapshot(point: point,
                fetchedAt: Date().addingTimeInterval(offline ? -7200 : 0), expiresAt: Date().addingTimeInterval(offline ? -3600 : 3600), hours: hours)
        }
    }
    #endif
}
