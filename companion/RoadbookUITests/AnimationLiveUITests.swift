import XCTest

// Explicit opt-in: downloads a published route film; never shares it with a recipient.
final class AnimationLiveUITests: XCTestCase {
    func testPublishedFilmPersistsOffline() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["ROADBOOK_LIVE_ANIMATIONS"] == "1")
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-animation-reset"]
        app.launch()
        XCTAssertTrue(app.buttons["Etappenanimationen"].firstMatch.waitForExistence(timeout: 20))
        app.buttons["Etappenanimationen"].firstMatch.tap()
        XCTAssertTrue(app.buttons["animation-stage-adria-1"].waitForExistence(timeout: 20))
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 60), app.debugDescription)
        app.terminate()
        app.launchArguments = ["-ui-testing", "-ui-test-animation-offline"]
        app.launch()
        app.buttons["Etappenanimationen"].firstMatch.tap()
        app.buttons["animation-stage-adria-1"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 10))
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "Veröffentlichte Animation offline"; shot.lifetime = .keepAlways; add(shot)
    }
}
