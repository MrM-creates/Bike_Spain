import XCTest

// Explicit opt-in: contacts Apple. Fixture tests stay deterministic and run without a service account.
final class WeatherLiveUITests: XCTestCase {
    func testAppleForecastAndOfflineRelaunch() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["ROADBOOK_LIVE_WEATHER"] == "1")
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-weather-live"]
        app.launch()
        openFirstDay(app)
        let summary = app.staticTexts["weather-summary"]
        XCTAssertTrue(summary.waitForExistence(timeout: 60), app.debugDescription)
        XCTAssertTrue(summary.label.contains("°C"))
        XCTAssertTrue(app.staticTexts["weather-status"].label.contains("Aktualisiert"))
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Echter Apple-Wetterabruf"; shot.lifetime = .keepAlways; add(shot)
        app.terminate()
        app.launchArguments.append("-ui-test-weather-cache-only")
        app.launch()
        openFirstDay(app)
        XCTAssertTrue(app.staticTexts["weather-summary"].exists)
        XCTAssertTrue(app.staticTexts["weather-status"].label.contains("Offline"))
    }
    private func openFirstDay(_ app: XCUIApplication) {
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        for _ in 0..<5 {
            if app.buttons["day-1"].isHittable { break }
            app.swipeUp()
        }
        app.buttons["day-1"].tap()
        for _ in 0..<5 {
            if app.buttons["weather-details-toggle"].isHittable { break }
            app.swipeUp()
        }
    }
}
