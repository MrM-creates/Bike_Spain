#if DEBUG
import Foundation

// Runs only with -ui-test-bookings. All requests stay inside this process.
final class BookingTestProtocol: URLProtocol {
    private static var updatedFeed: Data?
    private static var receipt: [String: Any]?
    private static var delayed = false
    private static var feedReads = 0
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func stopLoading() {}
    override func startLoading() {
        do {
            var original = try Data(contentsOf: Bundle.main.url(forResource: "plans", withExtension: "json")!)
            // Synthetic test status, independent of the traveller's real bookings.
            var originalObject = try JSONSerialization.jsonObject(with: original) as! [String: Any]
            var originalTrips = originalObject["trips"] as! [[String: Any]]
            var originalDays = originalTrips[0]["days"] as! [[String: Any]]
            if var lienz = originalDays[1]["accommodation"] as? [String: Any], var options = lienz["options"] as? [[String: Any]] {
                for i in options.indices { options[i]["booking"] = "open" }
                lienz["options"] = options; lienz["booking"] = "open"; lienz["status"] = "Offen"
                originalDays[1]["accommodation"] = lienz
                originalTrips[0]["days"] = originalDays; originalObject["trips"] = originalTrips
                original = try JSONSerialization.data(withJSONObject: originalObject)
            }
            let mode = ProcessInfo.processInfo.environment["ROADBOOK_BOOKING_TEST_MODE"] ?? "success"
            if request.url?.path == "/api/companion-plan" {
                if mode == "description-update" {
                    Self.feedReads += 1
                    let changed = Self.feedReads >= 20
                    let etag = changed ? "\"description-new\"" : "\"description-old\""
                    if request.value(forHTTPHeaderField: "If-None-Match") == etag { respond(304, Data(), etag: etag); return }
                    var feed = try JSONSerialization.jsonObject(with: original) as! [String: Any]
                    var trips = feed["trips"] as! [[String: Any]]
                    trips[0]["description"] = changed ? "Aktualisierte Reisebeschreibung aus dem gemeinsamen Plan." : "Bisherige Reisebeschreibung aus dem gemeinsamen Plan."
                    trips[0]["narrativeSegments"] = [["title": "Albanien und die Adria", "text": changed ? "Zwei Nächte Shkodër, danach von Durrës nach Ancona." : "Der Reiseverlauf wird gemeinsam aktualisiert."]]
                    if changed { trips[0]["version"] = "2099-01-01T00:00:00.000Z" }
                    feed["trips"] = trips
                    respond(200, try JSONSerialization.data(withJSONObject: feed), etag: etag)
                    return
                }
                if mode == "remote-update" {
                    Self.feedReads += 1
                    // Simulate another device changing day 1 while this reader stays open.
                    let changed = Self.feedReads >= 30
                    let etag = changed ? "\"remote-asked\"" : "\"remote-open\""
                    let previous = request.value(forHTTPHeaderField: "If-None-Match")
                    guard Self.feedReads == 1 || previous != nil else { throw URLError(.badServerResponse) }
                    if previous == etag { respond(304, Data(), etag: etag); return }
                    var feed = try JSONSerialization.jsonObject(with: original) as! [String: Any]
                    var trips = feed["trips"] as! [[String: Any]]
                    var days = trips[0]["days"] as! [[String: Any]]
                    var stay = days[0]["accommodation"] as! [String: Any]
                    stay["booking"] = changed ? "asked" : "open"
                    stay["status"] = changed ? "Angefragt" : "Offen"
                    stay["bookingRevision"] = String(repeating: changed ? "c" : "a", count: 64)
                    if var options = stay["options"] as? [[String: Any]], !options.isEmpty {
                        options[0]["booking"] = changed ? "asked" : "open"
                        options[0]["bookingRevision"] = stay["bookingRevision"]
                        stay["options"] = options
                    }
                    days[0]["accommodation"] = stay
                    trips[0]["days"] = days
                    if changed { trips[0]["version"] = "2099-01-01T00:00:00.000Z" }
                    feed["trips"] = trips
                    respond(200, try JSONSerialization.data(withJSONObject: feed), etag: etag)
                    return
                }
                if mode == "delayed", Self.updatedFeed != nil, !Self.delayed {
                    Self.delayed = true
                    respond(200, original)
                } else { respond(200, Self.updatedFeed ?? original) }
                return
            }
            guard request.url?.path == "/api/update-booking-status" else { throw URLError(.unsupportedURL) }
            var body = request.httpBody ?? Data()
            if let stream = request.httpBodyStream {
                stream.open(); defer { stream.close() }
                var buffer = [UInt8](repeating: 0, count: 4096)
                while stream.hasBytesAvailable { let count = stream.read(&buffer, maxLength: buffer.count); if count <= 0 { break }; body.append(buffer, count: count) }
            }
            let payload = try JSONSerialization.jsonObject(with: body) as! [String: String]
            guard payload["secret"] == "test-only" else { respondJSON(401, ["error": "Die PIN ist nicht gültig."]); return }
            if payload["action"] == "authorize" { respondJSON(200, ["ok": true]); return }
            if payload["action"] == "check", let receipt = Self.receipt { respondJSON(200, receipt); return }
            if mode == "conflict" { respondJSON(409, ["error": "Unterkunft oder Buchungsstatus wurden inzwischen geändert. Bitte den Reiseplan aktualisieren."]); return }
            var feed = try JSONSerialization.jsonObject(with: Self.updatedFeed ?? original) as! [String: Any]
            var trips = feed["trips"] as! [[String: Any]]
            let tripIndex = trips.firstIndex { $0["id"] as? String == payload["tripId"] }!
            var days = trips[tripIndex]["days"] as! [[String: Any]]
            let firstStay = days.compactMap { $0["accommodation"] as? [String: Any] }.first { $0["id"] as? String == payload["stayId"] }!
            let version = "2099-01-01T00:00:00.000Z"
            let revision = String(repeating: "b", count: 64)
            for index in days.indices {
                if var stay = days[index]["accommodation"] as? [String: Any], stay["id"] as? String == payload["stayId"] {
                    stay["booking"] = payload["booking"]
                    stay["status"] = BookingStatus(rawValue: payload["booking"]!)!.label
                    stay["bookingRevision"] = revision
                    if var options = stay["options"] as? [[String: Any]], let optionIndex = options.firstIndex(where: { $0["id"] as? String == payload["optionId"] }) {
                        options[optionIndex]["booking"] = payload["booking"]
                        options[optionIndex]["bookingRevision"] = revision
                        let active = options.first { $0["booking"] as? String == "booked" } ?? options.first { $0["booking"] as? String != "unavailable" }
                        stay["options"] = options
                        stay["activeOptionId"] = active?["id"]
                        stay["first"] = active
                        stay["booking"] = active?["booking"]
                        stay["status"] = active.map { BookingStatus(rawValue: $0["booking"] as? String ?? "open")!.label } ?? "Neue Unterkunft nötig"
                    }
                    days[index]["accommodation"] = stay
                }
            }
            trips[tripIndex]["days"] = days; trips[tripIndex]["version"] = version; feed["trips"] = trips
            Self.updatedFeed = try JSONSerialization.data(withJSONObject: feed)
            let receipt: [String: Any] = ["ok": true, "booking": payload["booking"]!, "bookingRevision": revision,
                                          "bookingContext": (firstStay["options"] as? [[String: Any]])?.first(where: { $0["id"] as? String == payload["optionId"] })?["bookingContext"] ?? firstStay["bookingContext"]!, "version": version]
            Self.receipt = receipt
            if mode == "lost-reply" { throw URLError(.networkConnectionLost) }
            respondJSON(200, receipt)
        } catch { client?.urlProtocol(self, didFailWithError: error) }
    }
    private func respondJSON(_ code: Int, _ body: [String: Any]) { respond(code, try! JSONSerialization.data(withJSONObject: body)) }
    private func respond(_ code: Int, _ data: Data, etag: String? = nil) {
        var headers = ["Content-Type": "application/json"]
        if let etag { headers["ETag"] = etag }
        client?.urlProtocol(self, didReceive: HTTPURLResponse(url: request.url!, statusCode: code, httpVersion: nil, headerFields: headers)!, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }
}
#endif
