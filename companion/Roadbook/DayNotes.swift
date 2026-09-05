import Foundation

struct ReviewedDayNote: Decodable {
    let tripID: String
    let stageID: String
    let notes: String
    let important: [String]
}

enum DayNotes {
    private static let reviewed: [ReviewedDayNote] = {
        guard let url = Bundle.main.url(forResource: "reviewed-day-notes", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let values = try? JSONDecoder().decode([ReviewedDayNote].self, from: data) else { return [] }
        return values
    }()

    static func important(tripID: String, day: TripDay) -> [String] {
        important(tripID: tripID, day: day, reviewed: reviewed)
    }

    static func important(tripID: String, day: TripDay, reviewed: [ReviewedDayNote]) -> [String] {
        guard !day.notes.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return [] }
        // Never infer severity from keywords, nor reuse a review after a plan edit.
        guard let match = reviewed.first(where: { $0.tripID == tripID && $0.stageID == day.id && $0.notes == day.notes }),
              match.important.allSatisfy({ !$0.isEmpty && day.notes.contains($0) }) else { return [day.notes] }
        return match.important
    }
}
