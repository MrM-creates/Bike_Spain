import Foundation

@main struct DayNotesChecks {
    static func main() throws {
        let feed = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))).validated()
        let reviewed = try JSONDecoder().decode([ReviewedDayNote].self, from: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2])))
        precondition(reviewed.count == 60)
        precondition(Set(reviewed.map { $0.tripID + "/" + $0.stageID }).count == 60)
        for trip in feed.trips {
            for day in trip.days {
                let match = reviewed.first { $0.tripID == trip.id && $0.stageID == day.id }!
                precondition(match.notes == day.notes)
                precondition(match.important.allSatisfy { !$0.isEmpty && day.notes.contains($0) })
                precondition(DayNotes.important(tripID: trip.id, day: day, reviewed: []).contains(day.notes))
                let changed = TripDay(id: day.id, number: day.number, date: day.date, title: day.title, rest: day.rest,
                                      distance: day.distance, duration: day.duration, overnight: day.overnight,
                                      roads: day.roads, notes: day.notes + " Neuer Hinweis.", mapsURL: day.mapsURL, accommodation: day.accommodation)
                precondition(DayNotes.important(tripID: trip.id, day: changed, reviewed: reviewed) == [changed.notes])
            }
        }
        let balkan = feed.trips.first { $0.id == "trip_adria_2026" }!
        let spain = feed.trips.first { $0.id == "trip_spanien_2026" }!
        let ferry = DayNotes.important(tripID: balkan.id, day: balkan.days[20], reviewed: reviewed).joined()
        precondition(ferry.contains("Check-in spätestens 18:00") && ferry.contains("Nicht gebucht"))
        precondition(DayNotes.important(tripID: balkan.id, day: balkan.days[18], reviewed: reviewed).joined().contains("Lovćen nur trocken"))
        precondition(DayNotes.important(tripID: spain.id, day: spain.days[16], reviewed: reviewed).joined().contains("Sperrungen"))
        precondition(DayNotes.important(tripID: balkan.id, day: balkan.days[7], reviewed: reviewed).isEmpty)
        precondition(DayNotes.important(tripID: "different-trip", day: balkan.days[7], reviewed: reviewed) == [balkan.days[7].notes])
        print("60 note reviews checked: unchanged original excerpts, ferry/weather/closure notices visible, unknown or changed notes fail open.")
    }
}
