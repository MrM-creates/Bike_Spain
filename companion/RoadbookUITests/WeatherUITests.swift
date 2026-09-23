import XCTest

final class WeatherUITests: XCTestCase {
    func testWeatherCanBeDisabledInSettings() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-weather", "-ui-testing-dark"]
        app.launch()
        XCTAssertTrue(app.buttons["open-settings"].waitForExistence(timeout: 15))
        app.buttons["open-settings"].tap()
        let toggle = app.switches["weather-enabled"]
        reveal(toggle, app)
        XCTAssertEqual(toggle.value as? String, "1")
        // SwiftUI exposes the whole labelled row as a switch; tap its trailing control.
        toggle.coordinate(withNormalizedOffset: CGVector(dx: 0.93, dy: 0.5)).tap()
        expectation(for: NSPredicate(format: "value == '0'"), evaluatedWith: toggle)
        waitForExpectations(timeout: 5)
        app.buttons["Fertig"].tap()
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-1"], app)
        app.buttons["day-1"].tap()
        app.swipeUp()
        XCTAssertFalse(app.buttons["weather-details-toggle"].exists)
    }
    private func openDay(offline: Bool = false, empty: Bool = false, day: Int = 1) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-weather"]
        if offline { app.launchArguments.append("-ui-test-weather-offline") }
        if empty { app.launchArguments.append("-ui-test-weather-empty") }
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-\(day)"], app)
        app.buttons["day-\(day)"].tap()
        reveal(app.buttons["weather-details-toggle"], app)
        return app
    }
    private func reveal(_ element: XCUIElement, _ app: XCUIApplication) {
        for _ in 0..<18 {
            if element.exists && element.isHittable { return }
            app.swipeUp()
        }
        XCTAssertTrue(element.exists && element.isHittable, app.debugDescription)
    }
    func testSummaryExpandsAndDayNavigationUsesNewStage() {
        let app = openDay()
        XCTAssertTrue(app.staticTexts["weather-summary"].label.contains("12–20 °C"))
        XCTAssertFalse(app.staticTexts["Unterwegs · Streckenmitte"].exists)
        app.buttons["weather-details-toggle"].tap()
        reveal(app.staticTexts["Unterwegs · Streckenmitte"], app)
        XCTAssertTrue(app.staticTexts["Unterwegs · Streckenmitte"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Etappenwetter aufgeklappt"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["next-day"].tap()
        reveal(app.buttons["weather-details-toggle"], app)
        XCTAssertTrue(app.staticTexts["weather-summary"].exists)
        XCTAssertFalse(app.staticTexts["Unterwegs · Streckenmitte"].exists)
    }
    func testOfflineCacheIsExplicitlyMarkedStale() {
        let app = openDay(offline: true)
        XCTAssertTrue(app.staticTexts["weather-status"].label.contains("Offline · veraltet"))
        XCTAssertTrue(app.staticTexts["weather-summary"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Wetter offline mit Zeitstempel"; shot.lifetime = .keepAlways; add(shot)
    }
    func testDistantFerryDayShowsNoInventedForecast() {
        let app = openDay(empty: true, day: 21)
        XCTAssertEqual(app.staticTexts["weather-empty"].label, "Vorhersage noch nicht verfügbar")
        XCTAssertFalse(app.staticTexts["weather-summary"].exists)
        app.buttons["weather-details-toggle"].tap()
        reveal(app.staticTexts["Fährhafen · Ankunft"], app)
        XCTAssertTrue(app.staticTexts["15. Oktober 2026"].exists)
    }
}
