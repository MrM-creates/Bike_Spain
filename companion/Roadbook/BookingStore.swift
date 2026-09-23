import Foundation
import Observation
import Security

enum BookingStatus: String, CaseIterable, Identifiable {
    case open, asked, booked, unavailable
    var id: String { rawValue }
    var label: String { switch self { case .open: "Offen"; case .asked: "Angefragt"; case .booked: "Gebucht"; case .unavailable: "Nicht verfügbar" } }
    var icon: String { switch self { case .open: "circle.dashed"; case .asked: "clock"; case .booked: "checkmark.circle.fill"; case .unavailable: "xmark.circle" } }
}

struct PendingBooking: Codable, Identifiable {
    var id: String { tripID + "/" + stayID }
    let tripID: String
    let stayID: String
    var optionID: String? = nil
    let context: String
    let previousRevision: String
    let booking: String
    var version: String?
    var revision: String?
}

private struct BookingReply: Decodable {
    let ok: Bool?
    let error: String?
    let booking: String?
    let bookingRevision: String?
    let bookingContext: String?
    let version: String?
}

private struct BookingRequestError: LocalizedError {
    let code: Int
    let message: String
    var errorDescription: String? { message }
}

enum BookingNetworking {
    static let endpoint = URL(string: "https://motorrad-roadbook-spanien-2026.vercel.app/api/update-booking-status")!
    static let session: URLSession = {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-test-bookings") {
            let config = URLSessionConfiguration.ephemeral
            config.protocolClasses = [BookingTestProtocol.self]
            return URLSession(configuration: config)
        }
        #endif
        return .shared
    }()
}

// No journal/container access. Credentials are device-only and never part of the feed or backup.
@MainActor @Observable
final class BookingStore {
    private(set) var unlocked = false
    private(set) var busy = false
    private(set) var pending: [PendingBooking] = []
    private(set) var notice: String?
    private let file: URL
    private var credential: String?
    private let testing: Bool
    private var keychainQuery: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: "com.mrm.roadbook.booking-editor",
         kSecAttrAccount as String: "publish-pin",
         kSecAttrSynchronizable as String: false]
    }

    init() {
        #if DEBUG
        testing = ProcessInfo.processInfo.arguments.contains("-ui-testing")
        #else
        testing = false
        #endif
        file = URL.applicationSupportDirectory.appending(path: testing ? "UITestBookingStatus/pending.json" : "BookingStatus/pending.json")
        if !testing {
            if let data = try? Data(contentsOf: file), let saved = try? JSONDecoder().decode([PendingBooking].self, from: data) { pending = saved }
            var query = keychainQuery
            query[kSecReturnData as String] = true
            query[kSecMatchLimit as String] = kSecMatchLimitOne
            var result: CFTypeRef?
            if SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data {
                credential = String(data: data, encoding: .utf8)
                unlocked = credential != nil
            }
        }
    }

    func pendingChange(tripID: String, stayID: String?) -> PendingBooking? {
        pending.first { $0.tripID == tripID && $0.stayID == stayID }
    }

    func unlock(pin: String) async throws {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        let value = pin.trimmingCharacters(in: .whitespacesAndNewlines)
        _ = try await request(["action": "authorize", "secret": value])
        if !testing {
            let data = Data(value.utf8)
            let update = SecItemUpdate(keychainQuery as CFDictionary, [kSecValueData as String: data] as CFDictionary)
            if update == errSecItemNotFound {
                var query = keychainQuery
                query[kSecValueData as String] = data
                query[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
                guard SecItemAdd(query as CFDictionary, nil) == errSecSuccess else { throw BookingRequestError(code: 0, message: "Die Freischaltung konnte nicht sicher gespeichert werden. Bitte erneut versuchen.") }
            } else if update != errSecSuccess { throw BookingRequestError(code: 0, message: "Die Freischaltung konnte nicht gespeichert werden. Bitte erneut versuchen.") }
        }
        credential = value
        unlocked = true
    }

    func lock() {
        if !testing {
            let result = SecItemDelete(keychainQuery as CFDictionary)
            if result != errSecSuccess && result != errSecItemNotFound {
                notice = "Die Freischaltung konnte nicht vom Gerät entfernt werden. Bitte erneut sperren."
                return
            }
        }
        credential = nil
        unlocked = false
    }

    func save(tripID: String, stay: StayPlan, option: StayOption? = nil, status: BookingStatus, plans: PlanStore, retryRoute: Bool = false) async throws {
        guard !busy, let secret = credential, (option?.bookingEditable ?? stay.bookingEditable) == true,
              let id = stay.id, let revision = option?.bookingRevision ?? stay.bookingRevision, let context = option?.bookingContext ?? stay.bookingContext,
              pendingChange(tripID: tripID, stayID: id) == nil else {
            throw BookingRequestError(code: 0, message: "Bitte zuerst die Bearbeitung freischalten und offene Übertragungen prüfen.")
        }
        busy = true
        defer { busy = false }
        let change = PendingBooking(tripID: tripID, stayID: id, optionID: option?.id, context: context, previousRevision: revision, booking: status.rawValue)
        // Save the intent before sending: a terminated app can still check an uncertain write.
        try replacePending(pending + [change])
        do {
            var payload = ["secret": secret, "tripId": tripID, "stayId": id, "expectedRevision": revision, "booking": status.rawValue]
            if let optionID = option?.id { payload["optionId"] = optionID }
            if retryRoute { payload["action"] = "retry-route" }
            let reply = try await request(payload)
            guard let version = reply.version, let newRevision = reply.bookingRevision, reply.booking == status.rawValue, reply.bookingContext == context else { throw PlanError.invalid }
            var submitted = change
            submitted.version = version
            submitted.revision = newRevision
            try replacePending(pending.map { $0.id == change.id ? submitted : $0 })
            notice = "Gespeichert · wird für Mitreisende aktualisiert."
            await plans.refresh()
        } catch {
            if let response = error as? BookingRequestError, [400, 401, 409, 413, 503].contains(response.code) {
                try replacePending(pending.filter { $0.id != change.id })
                if response.code == 401 { lock() }
                if response.code == 409 { await plans.refresh() }
                throw response
            }
            notice = "Übertragung noch nicht bestätigt. Bitte den Status prüfen, sobald du Empfang hast."
            throw BookingRequestError(code: 0, message: notice!)
        }
    }

    func check(_ change: PendingBooking, plans: PlanStore) async {
        guard !busy else { return }
        busy = true
        defer { busy = false }
        do {
            if let secret = credential, change.version == nil {
                var payload = ["action": "check", "secret": secret, "tripId": change.tripID, "stayId": change.stayID]
                if let optionID = change.optionID { payload["optionId"] = optionID }
                let reply = try await request(payload)
                if reply.bookingContext == change.context && reply.booking == change.booking, let version = reply.version, let revision = reply.bookingRevision {
                    var confirmed = change
                    confirmed.version = version; confirmed.revision = revision
                    try replacePending(pending.map { $0.id == change.id ? confirmed : $0 })
                } else {
                    try replacePending(pending.filter { $0.id != change.id })
                    notice = "Die gewünschte Änderung ist nicht bestätigt. Bitte den aktuellen Reiseplan prüfen und bei Bedarf erneut speichern."
                }
            }
            await plans.refresh()
        } catch {
            if let response = error as? BookingRequestError, response.code == 401 { lock() }
            if let response = error as? BookingRequestError, response.code == 409 {
                try? replacePending(pending.filter { $0.id != change.id })
                await plans.refresh()
                notice = "Die Unterkunft wurde inzwischen geändert. Bitte den aktuellen Reiseplan prüfen."
                return
            }
            notice = "Prüfen ist gerade nicht möglich. Bitte später erneut versuchen."
        }
    }

    func reconcile(_ feed: PlanFeed) {
        var remaining = pending
        for change in pending {
            guard let trip = feed.trips.first(where: { $0.id == change.tripID }) else { continue }
            let stay = trip.days.compactMap(\.accommodation).first { $0.id == change.stayID }
            let option = stay?.options?.first { $0.id == change.optionID }
            let context = option?.bookingContext ?? stay?.bookingContext
            let booking = option?.booking ?? stay?.booking
            let revision = option?.bookingRevision ?? stay?.bookingRevision
            if let version = change.version, trip.version >= version {
                remaining.removeAll { $0.id == change.id }
                notice = context == change.context && booking == change.booking ? "Gespeichert · im gemeinsamen Reiseplan sichtbar." : "Der Buchungsstatus wurde inzwischen erneut geändert. Angezeigt wird der aktuelle Reiseplan."
            } else if change.version == nil, stay != nil, revision != change.previousRevision {
                remaining.removeAll { $0.id == change.id }
                notice = context == change.context && booking == change.booking ? "Gespeichert · im gemeinsamen Reiseplan sichtbar." : "Die Unterkunft wurde inzwischen geändert. Bitte den aktuellen Stand prüfen."
            }
        }
        if remaining.count != pending.count {
            do { try replacePending(remaining) }
            catch { notice = "Der Abgleich konnte auf diesem Gerät nicht gesichert werden. Bitte erneut aktualisieren." }
        }
    }

    private func replacePending(_ next: [PendingBooking]) throws {
        try FileManager.default.createDirectory(at: file.deletingLastPathComponent(), withIntermediateDirectories: true)
        try JSONEncoder().encode(next).write(to: file, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
        pending = next
    }

    private func request(_ payload: [String: String]) async throws -> BookingReply {
        var request = URLRequest(url: BookingNetworking.endpoint, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 150)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)
        let (data, response) = try await BookingNetworking.session.data(for: request)
        guard data.count < 32768, let http = response as? HTTPURLResponse else { throw PlanError.invalid }
        let reply = try? JSONDecoder().decode(BookingReply.self, from: data)
        guard http.statusCode == 200, let reply, reply.ok == true else {
            throw BookingRequestError(code: http.statusCode, message: reply?.error ?? "Die Übertragung konnte nicht bestätigt werden. Bitte den Reiseplan aktualisieren und den Status prüfen.")
        }
        return reply
    }
}
