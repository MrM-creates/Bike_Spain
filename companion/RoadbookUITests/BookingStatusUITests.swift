import XCTest

final class BookingStatusUITests: XCTestCase {
    private func app(mode: String = "success") -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-bookings"]
        if ["remote-update", "description-update"].contains(mode) { app.launchArguments.append("-ui-test-live-refresh") }
        app.launchEnvironment["ROADBOOK_BOOKING_TEST_MODE"] = mode
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        return app
    }
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<10 {
            if element.exists && element.isHittable { return }
            app.swipeUp()
        }
        XCTAssertTrue(element.exists && element.isHittable, app.debugDescription)
    }
    func testTripDescriptionExpandsAndReceivesPublishedTextWhileOpen() {
        let app = app(mode: "description-update")
        app.buttons["trip_adria_2026"].tap()
        let toggle = app.buttons["trip-description"]
        reveal(toggle, in: app)
        let summary = app.staticTexts.matching(NSPredicate(format: "label ENDSWITH %@", "Reisebeschreibung aus dem gemeinsamen Plan.")).firstMatch
        XCTAssertFalse(summary.exists)
        toggle.tap()
        XCTAssertTrue(summary.waitForExistence(timeout: 5))
        XCTAssertEqual(summary.label, "Bisherige Reisebeschreibung aus dem gemeinsamen Plan.")
        expectation(for: NSPredicate(format: "label == %@", "Aktualisierte Reisebeschreibung aus dem gemeinsamen Plan."), evaluatedWith: summary)
        waitForExpectations(timeout: 40)
        XCTAssertTrue(app.staticTexts["Zwei Nächte Shkodër, danach von Durrës nach Ancona."].exists)
        app.swipeUp()
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "Reisebeschreibung aus dem gemeinsamen Plan"; shot.lifetime = .keepAlways; add(shot)
        for _ in 0..<5 {
            if toggle.exists && toggle.isHittable { break }
            app.swipeDown()
        }
        XCTAssertTrue(toggle.exists && toggle.isHittable)
        toggle.tap()
        XCTAssertFalse(summary.exists)
        XCTAssertTrue(app.buttons["day-1"].exists)
    }
    private func unlock(_ app: XCUIApplication, tryWrongPIN: Bool = false) {
        app.buttons["open-settings"].tap()
        let field = app.secureTextFields["booking-pin"]
        reveal(field, in: app)
        field.tap(); field.typeText(tryWrongPIN ? "wrong" : "test-only")
        reveal(app.buttons["booking-unlock"], in: app)
        app.buttons["booking-unlock"].tap()
        if tryWrongPIN {
            XCTAssertTrue(app.staticTexts["booking-access-error"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.buttons["booking-lock"].exists)
            field.tap(); field.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 5) + "test-only")
            reveal(app.buttons["booking-unlock"], in: app)
            app.buttons["booking-unlock"].tap()
        }
        XCTAssertTrue(app.buttons["booking-lock"].waitForExistence(timeout: 5))
        app.buttons["Fertig"].tap()
    }
    private func openStay(_ app: XCUIApplication, day: Int = 6) {
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-\(day)"], in: app)
        app.buttons["day-\(day)"].tap()
        reveal(app.descendants(matching: .any)["booking-status"].firstMatch, in: app)
    }
    private func saveBooked(_ app: XCUIApplication) {
        reveal(app.buttons["booking-edit"], in: app)
        app.buttons["booking-edit"].tap()
        XCTAssertTrue(app.buttons["booking-select-booked"].waitForExistence(timeout: 5))
        app.buttons["booking-select-booked"].tap()
        app.buttons["booking-save"].tap()
    }
    private func assertBooked(_ app: XCUIApplication) {
        let status = app.descendants(matching: .any)["booking-status"].firstMatch
        expectation(for: NSPredicate(format: "label == 'Gebucht'"), evaluatedWith: status)
        waitForExpectations(timeout: 10)
    }
    func testLienzAlternativeHasOwnStatusAndBecomesVisibleHotel() {
        let app = app()
        unlock(app)
        openStay(app, day: 2)
        XCTAssertTrue(app.staticTexts["booking-hotel"].label.contains("Holunderhof"))
        let details = app.buttons["stay-details-toggle"]
        reveal(details, in: app); details.tap()
        let alternative = app.buttons["booking-edit-alternative"]
        reveal(alternative, in: app); alternative.tap()
        XCTAssertTrue(app.buttons["booking-select-booked"].waitForExistence(timeout: 5))
        app.buttons["booking-select-booked"].tap()
        app.buttons["booking-save"].tap()
        let hotel = app.staticTexts["booking-hotel"].firstMatch
        // The alternative editor was below the current hotel; return upwards after saving.
        for _ in 0..<6 {
            if hotel.exists && hotel.isHittable { break }
            app.swipeDown()
        }
        XCTAssertTrue(hotel.exists && hotel.isHittable)
        expectation(for: NSPredicate(format: "label CONTAINS %@", "Schlossberghof"), evaluatedWith: hotel)
        waitForExpectations(timeout: 15)
        if !app.buttons["booking-edit-first"].exists {
            let toggle = app.buttons["stay-details-toggle"]
            reveal(toggle, in: app); toggle.tap()
        }
        XCTAssertTrue(app.buttons["booking-edit-first"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Lienz – gebuchte Alternative"; shot.lifetime = .keepAlways; add(shot)
    }
    func testReaderSeesStatusWithoutOpeningDetailsAndCannotEdit() {
        let app = app()
        openStay(app)
        XCTAssertEqual(app.descendants(matching: .any)["booking-status"].firstMatch.label, "Offen")
        XCTAssertFalse(app.buttons["booking-edit"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Unterkunft und Status für Mitreisende"; shot.lifetime = .keepAlways; add(shot)
    }
    func testOpenReaderAutomaticallyReceivesDayOneChangeAndKeepsItOnResume() {
        let app = app(mode: "remote-update")
        openStay(app, day: 1)
        let status = app.descendants(matching: .any)["booking-status"].firstMatch
        XCTAssertEqual(status.label, "Offen")
        XCTAssertFalse(app.buttons["booking-edit"].exists)
        expectation(for: NSPredicate(format: "label == 'Angefragt'"), evaluatedWith: status)
        waitForExpectations(timeout: 45)
        // Further conditional reads and a foreground restart must retain the new plan.
        Thread.sleep(forTimeInterval: 3)
        XCTAssertEqual(status.label, "Angefragt")
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertEqual(status.label, "Angefragt")
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Tag 1 automatisch aktualisiert"; shot.lifetime = .keepAlways; add(shot)
    }
    func testOwnerUnlockAndSharedStatusAcrossTwoNights() {
        let app = app()
        unlock(app, tryWrongPIN: true)
        openStay(app)
        saveBooked(app)
        assertBooked(app)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Gebuchtes Hotel mit Bearbeitung"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["next-day"].tap()
        reveal(app.descendants(matching: .any)["booking-status"].firstMatch, in: app)
        assertBooked(app)
    }
    func testDelayedPublicationShowsSavedStatusBeforeFeedConfirms() {
        let app = app(mode: "delayed")
        unlock(app); openStay(app); saveBooked(app)
        XCTAssertTrue(app.staticTexts["booking-pending"].waitForExistence(timeout: 10))
        assertBooked(app)
        XCTAssertEqual(app.staticTexts["booking-pending"].label, "Gespeichert · wird für Mitreisende aktualisiert.")
        XCTAssertFalse(app.staticTexts["Gewünschter Status: Gebucht"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Gespeicherter Status während Aktualisierung"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["next-day"].tap()
        reveal(app.descendants(matching: .any)["booking-status"].firstMatch, in: app)
        assertBooked(app)
        reveal(app.buttons["booking-check"], in: app)
        app.buttons["booking-check"].tap()
        assertBooked(app)
        XCTAssertFalse(app.staticTexts["booking-pending"].exists)
    }
    func testLostSaveReplyCanBeCheckedWithoutSendingAgain() {
        let app = app(mode: "lost-reply")
        unlock(app); openStay(app); saveBooked(app)
        XCTAssertTrue(app.staticTexts["booking-save-error"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["booking-save"].isEnabled)
        app.buttons["Schliessen"].tap()
        reveal(app.buttons["booking-check"], in: app)
        XCTAssertEqual(app.descendants(matching: .any)["booking-status"].firstMatch.label, "Offen")
        XCTAssertEqual(app.staticTexts["booking-pending"].label, "Speichern noch nicht bestätigt")
        app.buttons["booking-check"].tap()
        assertBooked(app)
    }
    func testChangedHotelRejectsStatusUpdate() {
        let app = app(mode: "conflict")
        unlock(app); openStay(app); saveBooked(app)
        XCTAssertTrue(app.staticTexts["booking-save-error"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["booking-save-error"].label.contains("inzwischen geändert"))
        app.buttons["Schliessen"].tap()
        XCTAssertEqual(app.descendants(matching: .any)["booking-status"].firstMatch.label, "Offen")
        XCTAssertFalse(app.staticTexts["booking-pending"].exists)
    }
}
