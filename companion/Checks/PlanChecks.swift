import Foundation

@main struct PlanChecks {
    static func main() throws {
        let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let feed = try JSONDecoder().decode(PlanFeed.self, from: data).validated()
        precondition(feed.trips.count == 2)
        // Navigation sections must be a lossless, ordered partition of one route.
        var navigationJSON = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        var navigationTrips = navigationJSON["trips"] as! [[String: Any]]
        var navigationDays = navigationTrips[0]["days"] as! [[String: Any]]
        let base = "https://www.google.com/maps/dir/?api=1&travelmode=driving&"
        navigationDays[0]["mapsURL"] = base + "origin=HotelA&destination=HotelB&waypoints=A%7CB%7CParking%7CC%7CD"
        let validParts: [[String: Any]] = [
            ["id":"part-1", "title":"Bis Parkplatz", "mapsURL":base + "origin=HotelA&destination=Parking&waypoints=A%7CB"],
            ["id":"part-2", "title":"Bis Hotel", "mapsURL":base + "origin=Parking&destination=HotelB&waypoints=C%7CD"]
        ]
        navigationDays[0]["navigationParts"] = validParts
        navigationTrips[0]["days"] = navigationDays
        navigationJSON["trips"] = navigationTrips
        _ = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: navigationJSON)).validated()
        var missingPoint = validParts
        missingPoint[1]["mapsURL"] = base + "origin=Parking&destination=HotelB&waypoints=D"
        navigationDays[0]["navigationParts"] = missingPoint
        navigationTrips[0]["days"] = navigationDays
        navigationJSON["trips"] = navigationTrips
        do {
            _ = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: navigationJSON)).validated()
            fatalError("Navigation lost a waypoint")
        } catch {}
        // A split must preserve motorway/toll/ferry avoidance, not only points.
        navigationDays[0]["mapsURL"] = (navigationDays[0]["mapsURL"] as! String) + "&avoid=highways"
        navigationDays[0]["navigationParts"] = validParts
        navigationTrips[0]["days"] = navigationDays
        navigationJSON["trips"] = navigationTrips
        do {
            _ = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: navigationJSON)).validated()
            fatalError("Navigation lost motorway avoidance")
        } catch {}
        let avoidingParts = validParts.map { part -> [String: Any] in
            var result = part
            result["mapsURL"] = (part["mapsURL"] as! String) + "&avoid=highways"
            return result
        }
        navigationDays[0]["navigationParts"] = avoidingParts
        navigationTrips[0]["days"] = navigationDays
        navigationJSON["trips"] = navigationTrips
        _ = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: navigationJSON)).validated()
        precondition(feed.trips[0].id == "trip_adria_2026")
        precondition(feed.trips.allSatisfy { $0.days.count == 30 })
        for trip in feed.trips {
            let ordered = trip.days.sorted { $0.number < $1.number }
            precondition(trip.adjacentDay(to: ordered[0].id, offset: -1) == nil)
            precondition(trip.adjacentDay(to: ordered.last!.id, offset: 1) == nil)
            precondition(trip.adjacentDay(to: "missing", offset: 1) == nil)
            for i in 0..<ordered.count - 1 {
                precondition(trip.adjacentDay(to: ordered[i].id, offset: 1)?.id == ordered[i + 1].id)
                precondition(trip.adjacentDay(to: ordered[i + 1].id, offset: -1)?.id == ordered[i].id)
            }
            var reversed = trip; reversed.days.reverse()
            precondition(reversed.adjacentDay(to: ordered[0].id, offset: 1)?.id == ordered[1].id)
        }
        precondition(feed.trips.allSatisfy { $0.days.allSatisfy { $0.map?.stop != nil } })
        precondition(feed.trips[0].days[20].map?.lines.map(\.kind) == ["road", "ferry"])
        precondition(feed.trips[0].days[6].map?.lines.isEmpty == true)
        precondition(feed.trips[0].days[0].map!.lines[0].coordinates[0][0] < 10) // lon, not lat
        var malformed = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        var badTrips = malformed["trips"] as! [[String: Any]]
        var badDays = badTrips[0]["days"] as! [[String: Any]]
        badDays[0]["map"] = ["lines": [["kind": "road", "coordinates": [[181, 45], [12, 46]]]]]
        badTrips[0]["days"] = badDays; malformed["trips"] = badTrips
        do {
            _ = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: malformed)).validated()
            fatalError("Invalid coordinate accepted")
        } catch {}
        precondition(feed.trips[0].days[20].mapsURL.contains("Split"))
        precondition(feed.trips[0].days[20].mapsURL.contains("Ancona") == false)
        precondition(feed.trips[0].days.filter { $0.accommodation != nil }.count == 29)
        precondition(feed.trips[1].days.filter { $0.accommodation != nil }.count == 29)
        precondition(displayDate("2026-10-09") == "9. Oktober 2026")
        let encoded = try JSONEncoder().encode(feed)
        let restored = try JSONDecoder().decode(PlanFeed.self, from: encoded).validated()
        precondition(restored.routeLineCount == 42)
        var legacy = feed
        let legacyTrips = feed.trips.map { trip in
            var old = trip
            old.days = trip.days.map { day in var oldDay = day; oldDay.map = nil; return oldDay }
            return old
        }
        legacy = PlanFeed(schemaVersion: 1, trips: legacyTrips)
        precondition(legacy.routeLineCount == 0)
        let upgraded = legacy.enriched(from: feed)
        precondition(upgraded.routeLineCount == 42)
        let upgradedDisk = try JSONDecoder().decode(PlanFeed.self, from: JSONEncoder().encode(upgraded)).validated()
        precondition(upgradedDisk.routeLineCount == 42)
        if CommandLine.arguments.count > 2 {
            let deviceCache = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))).validated()
            precondition(deviceCache.enriched(from: feed).routeLineCount == 42)
        }
        var changedJSON = try JSONSerialization.jsonObject(with: JSONEncoder().encode(legacy)) as! [String: Any]
        var changedTrips = changedJSON["trips"] as! [[String: Any]]
        var changedDays = changedTrips[0]["days"] as! [[String: Any]]
        changedDays[0]["roads"] = "Changed route"
        changedTrips[0]["days"] = changedDays; changedJSON["trips"] = changedTrips
        let changedFeed = try JSONDecoder().decode(PlanFeed.self, from: JSONSerialization.data(withJSONObject: changedJSON))
        precondition(changedFeed.enriched(from: feed).trips[0].days[0].map == nil)
        precondition(restored.trips[0].days.map(\.id) == feed.trips[0].days.map(\.id))
        for invalid in [String(data: data, encoding: .utf8)!.replacingOccurrences(of: "\"schemaVersion\": 1", with: "\"schemaVersion\": 2"),
                        String(data: data, encoding: .utf8)!.replacingOccurrences(of: "https://www.google.com/maps/", with: "javascript:alert/")] {
            do {
                _ = try JSONDecoder().decode(PlanFeed.self, from: Data(invalid.utf8)).validated()
                fatalError("Invalid feed was accepted")
            } catch { /* Expected: previous cache must stay intact. */ }
        }
        print("Swift plan checks passed: both roadbooks, 60 stages, dates, URLs, round-trip and invalid-feed rejection.")
    }
}
