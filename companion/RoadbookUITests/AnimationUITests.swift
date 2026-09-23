import XCTest

final class AnimationUITests: XCTestCase {
    private func open(reset: Bool = true, offline: Bool = false, corrupt: Bool = false) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-animation-server", "http://127.0.0.1:\(corrupt ? 8770 : 8769)"]
        if reset { app.launchArguments.append("-ui-test-animation-reset") }
        if offline { app.launchArguments.append("-ui-test-animation-offline") }
        app.launch()
        XCTAssertTrue(app.buttons["Etappenanimationen"].firstMatch.waitForExistence(timeout: 20))
        app.buttons["Etappenanimationen"].firstMatch.tap()
        XCTAssertTrue(app.buttons["animation-stage-adria-1"].waitForExistence(timeout: 15), app.debugDescription)
        return app
    }
    func testDownloadPersistsOfflineAndCanBeSharedAndDeleted() {
        var app = open()
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 25), app.debugDescription)
        app.terminate()
        app = open(reset: false, offline: true)
        app.buttons["animation-stage-adria-1"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 10), app.debugDescription)
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Animation offline"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["animation-share"].tap()
        XCTAssertTrue(app.otherElements["ActivityListView"].waitForExistence(timeout: 5) || app.buttons["Kopieren"].exists || app.buttons["Copy"].exists, app.debugDescription)
        app.terminate()
        app = open(reset: false, offline: true)
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["Weitere Aktionen"].tap()
        app.buttons["Download löschen"].tap()
        app.buttons["Download löschen"].tap()
        XCTAssertTrue(app.buttons["animation-download"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["animation-share"].exists)
    }
    func testBatchDownloadsAndSelectionSharing() {
        let app = open()
        app.buttons["animation-select"].tap()
        app.buttons["animation-select-all"].tap()
        XCTAssertTrue(app.staticTexts["2 ausgewählt"].exists)
        XCTAssertEqual(app.buttons["animation-select-all"].label, "Auswahl aufheben")
        app.buttons["animation-select-all"].tap()
        XCTAssertTrue(app.staticTexts["0 ausgewählt"].exists)
        XCTAssertFalse(app.buttons["animation-download-selected"].exists)
        app.buttons["animation-select-stage-adria-1"].tap()
        app.buttons["animation-select-all"].tap()
        XCTAssertTrue(app.staticTexts["2 ausgewählt"].exists)
        app.buttons["animation-download-selected"].tap()
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "animation-offline-adria-1").firstMatch.waitForExistence(timeout: 25))
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "animation-offline-adria-2").firstMatch.waitForExistence(timeout: 25))
        XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "animation-offline-adria-1").firstMatch.label.hasPrefix("Geladen"))
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Animationen Mehrfachdownload"; screenshot.lifetime = .keepAlways; add(screenshot)
        app.buttons["animation-select"].tap()
        app.buttons["animation-select-all"].tap()
        XCTAssertFalse(app.buttons["animation-download-selected"].exists)
        XCTAssertTrue(app.buttons["animation-share-selected"].isEnabled)
        app.buttons["animation-share-selected"].tap()
        XCTAssertTrue(app.otherElements["ActivityListView"].waitForExistence(timeout: 5) || app.buttons["Kopieren"].exists || app.buttons["Copy"].exists, app.debugDescription)
    }
    func testJournalUsesExistingDownloadWithoutCopy() {
        let app = open()
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 25))
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        app.buttons["journal-compose"].tap()
        app.buttons["choose-entry-stage"].tap()
        app.buttons["choose-stage-adria-1"].tap()
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        editor.tap(); editor.typeText("Animationstest \(UUID().uuidString)")
        let note = editor.value as! String
        app.buttons["save-memory"].tap()
        XCTAssertTrue(app.staticTexts[note].waitForExistence(timeout: 10))
        app.staticTexts[note].tap()
        XCTAssertTrue(app.buttons["journal-animation"].waitForExistence(timeout: 5))
        app.buttons["journal-animation"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["animation-download"].exists)
        let screenshot = XCTAttachment(screenshot: app.screenshot()); screenshot.name = "Animation aus Tagebucheintrag"; screenshot.lifetime = .keepAlways; add(screenshot)
    }
    func testCorruptVideoIsNotInstalled() {
        let app = open(corrupt: true)
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.staticTexts["animation-error"].waitForExistence(timeout: 25), app.debugDescription)
        XCTAssertFalse(app.buttons["animation-share"].exists)
        XCTAssertTrue(app.buttons["animation-download"].exists)
    }
    func testCancelledDownloadCanBeRetried() {
        let app = open()
        app.buttons["animation-stage-adria-1"].tap()
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.buttons["animation-cancel"].waitForExistence(timeout: 5))
        app.buttons["animation-cancel"].tap()
        XCTAssertTrue(app.buttons["animation-download"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["animation-share"].exists)
        XCTAssertFalse(app.staticTexts["animation-error"].exists)
        app.buttons["animation-download"].tap()
        XCTAssertTrue(app.buttons["animation-share"].waitForExistence(timeout: 25))
    }
}
