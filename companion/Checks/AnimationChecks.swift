import Foundation

@main struct AnimationChecks {
    static func main() throws {
        let root = URL(fileURLWithPath: CommandLine.arguments[1])
        let feed = try JSONDecoder().decode(PlanFeed.self, from: Data(contentsOf: root.appending(path: "companion/Roadbook/Resources/plans.json")))
        let trip = feed.trips.first { $0.id == "trip_adria_2026" }!
        let published = try JSONDecoder().decode(AnimationCatalog.self, from: Data(contentsOf: root.appending(path: "animations/catalog.json"))).validated()
        precondition(published.assets.count == trip.days.filter { !$0.rest && !($0.map?.lines.isEmpty ?? true) }.count)
        for asset in published.assets {
            let day = trip.days.first { $0.id == asset.stageID }!
            precondition(StageAnimation.fingerprint(tripID: trip.id, day: day) == asset.routeFingerprint)
            let movie = try Data(contentsOf: root.appending(path: "animations/media/\(asset.url.lastPathComponent)"))
            precondition(Int64(movie.count) == asset.bytes && StageAnimation.digest(movie) == asset.sha256)
        }
        let fixture = try JSONDecoder().decode(AnimationCatalog.self, from: Data(contentsOf: root.appending(path: "companion/AnimationPreview/download-test/catalog.json")))
        for asset in fixture.assets {
            let day = trip.days.first { $0.id == asset.stageID }!
            precondition(StageAnimation.fingerprint(tripID: trip.id, day: day) == asset.routeFingerprint, "Python/Swift signatures differ")
        }
        let value = try JSONSerialization.jsonObject(with: JSONEncoder().encode(fixture.assets[0])) as! [String: Any]
        func candidate(_ modifications: [String: Any]) throws -> StageAnimation {
            var next = value; modifications.forEach { next[$0.key] = $0.value }
            next["url"] = modifications["url"] ?? "https://motorrad-roadbook-spanien-2026.vercel.app/animations/media/test.mp4"
            return try JSONDecoder().decode(StageAnimation.self, from: JSONSerialization.data(withJSONObject: next))
        }
        let valid = try candidate([:]); try valid.validate()
        for changes: [String: Any] in [
            ["bytes": -1], ["bytes": 50_000_001], ["sha256": "../bad"],
            ["routeFingerprint": "not-a-digest"], ["duration": 1000],
            ["url": "https://example.com/animations/media/test.mp4"],
            ["url": "http://motorrad-roadbook-spanien-2026.vercel.app/animations/media/test.mp4"],
            ["url": "https://motorrad-roadbook-spanien-2026.vercel.app/animations/media/test.mp4?token=other"]
        ] {
            do { try candidate(changes).validate(); fatalError("Invalid catalog accepted: \(changes)") }
            catch AnimationFailure.invalid { }
        }
        do { _ = try AnimationCatalog(schemaVersion: 1, assets: [valid, valid]).validated(); fatalError("Duplicate accepted") }
        catch AnimationFailure.invalid { }
        precondition(!StageAnimation.allowed(URL(string: "https://example.com/animations/media/test.mp4")!))
        let movie = try Data(contentsOf: root.appending(path: "companion/AnimationPreview/kotor-shkoder-roadbook-v5-hevc.mp4"))
        precondition(StageAnimation.digest(movie) == valid.sha256)
        var corrupt = movie; corrupt[0] ^= 255
        precondition(StageAnimation.digest(corrupt) != valid.sha256)
        print("Animation checks passed: route binding, cross-language fingerprints, metadata validation, host restrictions and corruption detection.")
    }
}
