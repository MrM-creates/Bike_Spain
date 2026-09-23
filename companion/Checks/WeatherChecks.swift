import Foundation

@main struct WeatherChecks {
    static func main() throws {
        let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
        let feed = try JSONDecoder().decode(PlanFeed.self, from: data).validated()
        let trip = feed.trips.first { $0.id == "trip_adria_2026" }!
        let road = StageWeatherRequest(trip: trip, day: trip.days[0])
        precondition(road.points.count == 3)
        precondition(road.points.first!.longitude == trip.days[0].map!.lines[0].coordinates.first![0])
        precondition(road.points.last!.latitude == trip.days[0].map!.lines[0].coordinates.last![1])
        for _ in 0..<20 { precondition(road.id == StageWeatherRequest(trip: trip, day: trip.days[0]).id) }
        let unequal = [[0.0, 0.0], [0.01, 0], [2.0, 0]]
        precondition(abs(StageWeatherRequest.midpoint(unequal)![0] - 1) < 0.001)
        let rest = StageWeatherRequest(trip: trip, day: trip.days.first { $0.rest }!)
        precondition(rest.points.count == 1 && rest.points[0].label == "Vor Ort")
        let ferry = StageWeatherRequest(trip: trip, day: trip.days[20])
        precondition(ferry.ferry && ferry.points.count == 3)
        precondition(ferry.points[1].date == "2026-10-14")
        precondition(ferry.points[2].date == "2026-10-15")
        precondition(ferry.points[1].longitude > 19 && ferry.points[2].longitude < 14)
        let spain = feed.trips.first { $0.id == "trip_spanien_2026" }!
        precondition(StageWeatherRequest(trip: spain, day: spain.days[27]).points.count == 2)
        let iso = ISO8601DateFormatter()
        let now = iso.date(from: "2026-09-18T08:00:00Z")!
        let p = WeatherPoint(label: "Test", longitude: 11, latitude: 47, date: "2026-09-24", timeZone: "Europe/Rome")
        precondition(p.start == iso.date(from: "2026-09-24T07:00:00Z")!)
        precondition(p.canFetch(at: now))
        precondition(!p.canFetch(at: iso.date(from: "2026-09-14T08:00:00Z")!))
        precondition(!p.canFetch(at: p.end))
        let winter = WeatherPoint(label: "Winter", longitude: 11, latitude: 47, date: "2026-10-25", timeZone: "Europe/Rome")
        precondition(winter.start == iso.date(from: "2026-10-25T08:00:00Z")!)
        let broken = WeatherPoint(label: "Bad", longitude: 11, latitude: 47, date: "xx-yy-zzzz", timeZone: "Europe/Rome")
        precondition(broken.start == .distantPast && !broken.canFetch(at: now))

        let hours = [WeatherHour(date: p.start, temperature: 4, precipitationChance: 0.8, gust: nil, symbol: "cloud.rain", condition: "Regen"),
                     WeatherHour(date: p.start.addingTimeInterval(3600), temperature: 16, precipitationChance: 0.1, gust: 35, symbol: "sun.max", condition: "Sonnig")]
        let summary = WeatherSummary(hours: hours)!
        precondition(summary.low == 4 && summary.high == 16 && summary.rain == 0.8 && summary.gust == 35 && summary.condition == "Regen")
        precondition(WeatherSummary(hours: [hours[0]])!.gust == nil)
        precondition(WeatherSummary(hours: []) == nil)
        let snapshot = WeatherSnapshot(point: p, fetchedAt: now, expiresAt: now.addingTimeInterval(7200), hours: hours)
        precondition(snapshot.isFresh(at: now.addingTimeInterval(3599)))
        precondition(!snapshot.isFresh(at: now.addingTimeInterval(3600)))
        precondition(!snapshot.isFresh(at: now.addingTimeInterval(-1)))
        precondition(!snapshot.complete)
        let expired = WeatherSnapshot(point: p, fetchedAt: now, expiresAt: now.addingTimeInterval(10), hours: hours)
        precondition(!expired.isFresh(at: now.addingTimeInterval(11)))
        let restored = try JSONDecoder().decode(WeatherSnapshot.self, from: JSONEncoder().encode(snapshot))
        precondition(restored.summary!.text == snapshot.summary!.text && restored.fetchedAt == now)

        var changed = trip.days[0]
        var coords = changed.map!.lines[0].coordinates
        coords[1][0] += 0.01
        changed.map = StageMap(lines: [RouteLine(kind: "road", coordinates: coords)], stop: changed.map?.stop)
        precondition(StageWeatherRequest(trip: trip, day: changed).id != road.id)
        var json = try JSONSerialization.jsonObject(with: JSONEncoder().encode(trip.days[0])) as! [String: Any]
        json["date"] = "2026-09-25"
        let changedDate = try JSONDecoder().decode(TripDay.self, from: JSONSerialization.data(withJSONObject: json))
        precondition(StageWeatherRequest(trip: trip, day: changedDate).id != road.id)
        for trip in feed.trips { for day in trip.days {
            let request = StageWeatherRequest(trip: trip, day: day)
            precondition(!request.points.isEmpty)
            precondition(request.points.allSatisfy { $0.start < $0.end })
        } }
        print("Weather checks passed: 60 stages, route identity, distance midpoint, rest/ferry dates, forecast horizon, DST, missing gusts, cache expiry and disk round-trip.")
    }
}
