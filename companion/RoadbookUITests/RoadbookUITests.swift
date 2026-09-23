import XCTest

final class RoadbookUITests: XCTestCase {
    private func openVoiceEditor(_ app: XCUIApplication) {
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        app.buttons["journal-compose"].tap()
        app.buttons["choose-entry-stage"].tap()
        app.buttons["choose-stage-adria-1"].tap()
        XCTAssertTrue(app.buttons["memory-record"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["save-memory"].isEnabled)
    }

    private func openExistingNoteEditor(_ app: XCUIApplication, text: String) {
        openVoiceEditor(app)
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        editor.tap(); editor.typeText(text)
        app.buttons["save-memory"].tap()
        let note = app.staticTexts[text]
        XCTAssertTrue(note.waitForExistence(timeout: 5))
        note.tap()
        app.buttons["Bearbeiten"].tap()
        XCTAssertTrue(app.buttons["memory-edit-record"].waitForExistence(timeout: 5))
        XCTAssertEqual(editor.value as? String, text)
    }

    private func finishEditRecording(_ app: XCUIApplication) {
        app.buttons["memory-edit-record"].tap()
        let ready = NSPredicate(format: "enabled == true")
        expectation(for: ready, evaluatedWith: app.buttons["save-memory"])
        waitForExpectations(timeout: 8)
    }

    private func deleteOpenTestNote(_ app: XCUIApplication) {
        app.buttons["entry-more"].tap()
        app.buttons["Eintrag löschen"].tap(); app.buttons["Löschen"].tap()
    }

    func testEditingNoteDictationPreservesTextAndPersists() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech", "-ui-testing-light"]
        app.launchEnvironment["ROADBOOK_TEST_TRANSCRIPT_1"] = "Gesprochene Ergänzung."
        app.launchEnvironment["ROADBOOK_TEST_TRANSCRIPT_2"] = "Zweite Ergänzung."
        let original = "Bestehender Eintrag \(UUID().uuidString.prefix(6))"
        openExistingNoteEditor(app, text: original)
        let editor = app.textViews["memory-text"]
        let record = app.buttons["memory-edit-record"]
        XCTAssertTrue(record.isHittable)
        XCTAssertLessThanOrEqual(record.frame.maxY, editor.frame.minY)
        XCTAssertFalse(app.buttons["choose-entry-stage"].exists)
        let idle = XCTAttachment(screenshot: app.screenshot())
        idle.name = "Edit existing note with speech button"; idle.lifetime = .keepAlways; add(idle)
        record.tap()
        XCTAssertTrue(editor.exists)
        XCTAssertEqual(editor.value as? String, original + "\nGesprochene Ergänzung.")
        XCTAssertFalse(app.buttons["save-memory"].isEnabled)
        let live = XCTAttachment(screenshot: app.screenshot())
        live.name = "Existing text retained during dictation"; live.lifetime = .keepAlways; add(live)
        finishEditRecording(app)
        editor.tap(); editor.typeText(" Von Hand ergänzt.")
        let corrected = editor.value as! String
        record.tap()
        finishEditRecording(app)
        let expected = corrected + "\nZweite Ergänzung."
        XCTAssertEqual(editor.value as? String, expected)
        app.buttons["save-memory"].tap()
        XCTAssertEqual(app.staticTexts["journal-entry-text"].label, expected)
        app.terminate(); app.launch()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        let note = app.staticTexts[expected]
        XCTAssertTrue(note.waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts.matching(NSPredicate(format: "label == %@", expected)).count, 1)
        note.tap()
        XCTAssertTrue(app.descendants(matching: .any)["journal-stage-context"].firstMatch.label.contains("Tag 1"))
        deleteOpenTestNote(app)
    }

    func testEditingNoteDiscardKeepsOriginalText() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech", "-ui-testing-dark"]
        app.launchEnvironment["ROADBOOK_TEST_TRANSCRIPT_1"] = "Nicht speichern."
        let original = "Original bleibt \(UUID().uuidString.prefix(6))"
        openExistingNoteEditor(app, text: original)
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "Edit speech button dark appearance"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["memory-edit-record"].tap()
        finishEditRecording(app)
        XCTAssertEqual(app.textViews["memory-text"].value as? String, original + "\nNicht speichern.")
        app.buttons["Abbrechen"].tap(); app.buttons["Verwerfen"].tap()
        XCTAssertEqual(app.staticTexts["journal-entry-text"].label, original)
        app.buttons["Bearbeiten"].tap()
        XCTAssertEqual(app.textViews["memory-text"].value as? String, original)
        app.buttons["Abbrechen"].tap()
        deleteOpenTestNote(app)
    }

    func testEditingNoteDeniedSpeechKeepsTextEditable() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech-denied"]
        let original = "Ohne Mikrofon \(UUID().uuidString.prefix(6))"
        openExistingNoteEditor(app, text: original)
        app.buttons["memory-edit-record"].tap()
        XCTAssertTrue(app.staticTexts["memory-voice-error"].waitForExistence(timeout: 5))
        let editor = app.textViews["memory-text"]
        XCTAssertEqual(editor.value as? String, original)
        XCTAssertTrue(editor.isEnabled)
        editor.tap(); editor.typeText(" Weiter tippen.")
        let expected = editor.value as! String
        app.buttons["save-memory"].tap()
        XCTAssertEqual(app.staticTexts["journal-entry-text"].label, expected)
        deleteOpenTestNote(app)
    }

    func testVoiceNoteReviewResumeAndPersistence() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech"]
        openVoiceEditor(app)
        let initial = XCTAttachment(screenshot: app.screenshot())
        initial.name = "Voice first with stage context"; initial.lifetime = .keepAlways; add(initial)
        app.buttons["memory-record"].tap()
        XCTAssertTrue(app.staticTexts["memory-transcript"].label.contains("Heute über den Pass"))
        XCTAssertFalse(app.buttons["save-memory"].isEnabled)
        app.buttons["memory-record"].tap()
        let editor = app.textViews["memory-text"]
        XCTAssertTrue(editor.waitForExistence(timeout: 6))
        XCTAssertEqual(editor.value as? String, "Heute über den Pass bis ans Meer gefahren.")
        // A manual correction must survive switching back to speech.
        editor.tap(); editor.typeText(" Herrliche Aussicht. \(UUID().uuidString.prefix(6)) ")
        let corrected = editor.value as! String
        app.buttons["memory-resume"].tap()
        app.buttons["memory-record"].tap()
        XCTAssertTrue(editor.waitForExistence(timeout: 6))
        let expected = corrected + "\nAbends am Hafen gegessen."
        XCTAssertEqual(editor.value as? String, expected)
        let reviewed = XCTAttachment(screenshot: app.screenshot())
        reviewed.name = "Dictated note ready to review"; reviewed.lifetime = .keepAlways; add(reviewed)
        app.buttons["save-memory"].tap()
        app.terminate(); app.launch()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        let note = app.staticTexts[expected]
        XCTAssertTrue(note.waitForExistence(timeout: 10))
        let listShot = XCTAttachment(screenshot: app.screenshot())
        listShot.name = "Slim journal list"; listShot.lifetime = .keepAlways; add(listShot)
        note.tap()
        XCTAssertEqual(app.staticTexts["journal-entry-text"].label, expected)
        XCTAssertTrue(app.descendants(matching: .any)["journal-stage-context"].firstMatch.label.contains("Tag 1"))
        app.buttons["Bearbeiten"].tap()
        XCTAssertEqual(editor.value as? String, expected)
        app.buttons["Abbrechen"].tap()
        app.buttons["entry-more"].tap()
        app.buttons["Eintrag löschen"].tap(); app.buttons["Löschen"].tap()
    }

    func testVoicePermissionDeniedAllowsTyping() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech-denied"]
        openVoiceEditor(app)
        app.buttons["memory-record"].tap()
        XCTAssertTrue(app.staticTexts["memory-voice-error"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["memory-voice-error"].label.contains("Mikrofon"))
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        editor.tap(); editor.typeText("Auch ohne Mikrofon möglich.")
        XCTAssertTrue(app.buttons["save-memory"].isEnabled)
        app.buttons["Abbrechen"].tap()
        app.buttons["Weiter bearbeiten"].tap()
        XCTAssertEqual(editor.value as? String, "Auch ohne Mikrofon möglich.")
        app.buttons["Abbrechen"].tap(); app.buttons["Verwerfen"].tap()
    }

    func testVoiceSwitchToTypingAndBackgroundRetainsText() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-speech"]
        openVoiceEditor(app)
        app.buttons["memory-record"].tap()
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        XCTAssertEqual(editor.value as? String, "Heute über den Pass")
        editor.tap(); editor.typeText(" mit einer Pause.")
        let corrected = editor.value as! String
        app.buttons["memory-resume"].tap()
        XCUIDevice.shared.press(.home)
        app.activate()
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        XCTAssertEqual(editor.value as? String, corrected + "\nAbends am Hafen gegessen.")
        XCTAssertTrue(app.buttons["save-memory"].isEnabled)
        app.buttons["Abbrechen"].tap(); app.buttons["Weiter bearbeiten"].tap()
        XCTAssertEqual(editor.value as? String, corrected + "\nAbends am Hafen gegessen.")
        app.buttons["Abbrechen"].tap(); app.buttons["Verwerfen"].tap()
    }

    func testDirectDraftSurvivesStageSelectionAndChange() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-dark"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        XCTAssertFalse(app.staticTexts["Alle deine Einträge"].exists)
        let empty = XCTAttachment(screenshot: app.screenshot())
        empty.name = "Journal entry point"; empty.lifetime = .keepAlways; add(empty)
        app.buttons["journal-compose"].tap()
        XCTAssertTrue(app.buttons["memory-record"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["choose-entry-stage"].exists)
        XCTAssertTrue(app.navigationBars["Eintrag"].exists)
        XCTAssertFalse(app.staticTexts["Über die Spracherkennung"].exists)
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        let note = "Direkter Eintrag \(UUID().uuidString.prefix(6))"
        editor.tap(); editor.typeText(note)
        XCTAssertFalse(app.buttons["save-memory"].isEnabled)
        app.buttons["choose-entry-stage"].tap()
        app.buttons["choose-stage-adria-1"].tap()
        XCTAssertEqual(editor.value as? String, note)
        XCTAssertTrue(app.buttons["save-memory"].isEnabled)
        app.buttons["choose-entry-stage"].tap()
        app.buttons["Abbrechen"].firstMatch.tap()
        XCTAssertEqual(editor.value as? String, note)
        app.buttons["choose-entry-stage"].tap()
        app.buttons["choose-stage-adria-2"].tap()
        XCTAssertEqual(editor.value as? String, note)
        XCTAssertTrue(app.descendants(matching: .any)["editor-stage-context"].firstMatch.label.contains("Tag 2"))
        let draft = XCTAttachment(screenshot: app.screenshot())
        draft.name = "Draft after changing stage dark"; draft.lifetime = .keepAlways; add(draft)
        app.buttons["save-memory"].tap()
        app.staticTexts[note].tap()
        XCTAssertTrue(app.descendants(matching: .any)["journal-stage-context"].firstMatch.label.contains("Tag 2"))
        app.buttons["Bearbeiten"].tap()
        XCTAssertFalse(app.buttons["choose-entry-stage"].exists)
        XCTAssertEqual(editor.value as? String, note)
        app.buttons["Abbrechen"].tap()
        app.buttons["entry-more"].tap()
        app.buttons["Eintrag löschen"].tap(); app.buttons["Löschen"].tap()
        app.buttons["journal-settings"].tap()
        app.buttons["journal-privacy"].tap()
        XCTAssertTrue(app.navigationBars["Datenschutz"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Spracherkennung"].exists)
    }

    func testPhotoEntryShowsPreviewAndSurvivesStageChange() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-light"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        app.buttons["journal-compose"].tap()
        app.buttons["memory-add-photos"].tap()
        let gridPhoto = app.images.matching(identifier: "PXGGridLayout-Info").firstMatch
        guard gridPhoto.waitForExistence(timeout: 8) else { XCTFail(app.debugDescription); return }
        gridPhoto.tap()
        let addPhoto = app.buttons["Fertig"].firstMatch
        XCTAssertTrue(addPhoto.waitForExistence(timeout: 3))
        XCTAssertTrue(addPhoto.isEnabled)
        addPhoto.tap()
        XCTAssertTrue(app.textFields["Bildbeschreibung"].waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertFalse(app.buttons["save-memory"].isEnabled)
        app.buttons["choose-entry-stage"].tap()
        app.buttons["choose-stage-adria-1"].tap()
        app.buttons["choose-entry-stage"].tap()
        app.buttons["entry-trip-picker"].tap()
        app.buttons["Spanien 2026"].tap()
        app.buttons["choose-stage-day-1"].tap()
        XCTAssertTrue(app.textFields["Bildbeschreibung"].exists)
        app.buttons["save-memory"].tap()
        let preview = app.images["journal-photo-preview"].firstMatch
        XCTAssertTrue(preview.waitForExistence(timeout: 8))
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "Journal with photo preview"; shot.lifetime = .keepAlways; add(shot)
        app.staticTexts["Fotoeintrag"].firstMatch.tap()
        reveal(app.buttons["journal-open-stage"], in: app)
        XCTAssertTrue(app.descendants(matching: .any)["journal-stage-context"].firstMatch.label.contains("Spanien 2026 · Tag 1"))
        app.buttons["Bearbeiten"].tap()
        XCTAssertTrue(app.textFields["Bildbeschreibung"].waitForExistence(timeout: 5))
        app.buttons["Abbrechen"].tap()
        app.buttons["entry-more"].tap()
        app.buttons["Eintrag löschen"].tap(); app.buttons["Löschen"].tap()
    }

    func testBackupControlsAndPrivacyWarning() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-dark"]
        app.launch()
        XCTAssertTrue(app.buttons["open-settings"].waitForExistence(timeout: 15))
        app.buttons["open-settings"].tap()
        let backup = app.buttons["journal-backup"]
        reveal(backup, in: app); backup.tap()
        XCTAssertTrue(app.navigationBars["Tagebuch sichern"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "unverschlüsselt")).firstMatch.exists)
        XCTAssertTrue(app.buttons["export-journal"].isEnabled)
        XCTAssertTrue(app.buttons["import-journal"].exists)
        XCTAssertFalse(app.buttons["restore-journal"].exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Private journal backup controls"; shot.lifetime = .keepAlways; add(shot)
        app.buttons["export-journal"].tap()
        // Export must open the system save dialog; it must not silently share or report success.
        let save = app.buttons["DOCPicker.actionButton"]
        guard save.waitForExistence(timeout: 15) else {
            XCTFail("Save dialog missing: \(app.debugDescription)"); return
        }
        let dialog = XCTAttachment(screenshot: app.screenshot()); dialog.name = "System backup save dialog"; dialog.lifetime = .keepAlways; add(dialog)
        XCTAssertFalse(app.staticTexts["backup-result"].exists)
        let filename = app.textFields["DOCPicker.filenameTextField"]
        let suffix = "Test-\(UUID().uuidString.prefix(8))"
        filename.tap()
        // Avoid overwriting any previous synthetic backup.
        // Type individual characters: the beta simulator's filename editor can
        // drop characters when a whole string is injected during selection.
        for character in "-\(suffix)" { filename.typeText(String(character)) }
        guard let savedName = filename.value as? String, savedName.contains(suffix) else {
            XCTFail("System filename editor did not retain the unique test filename"); return
        }
        save.tap()
        let savedAlert = app.alerts["Sicherung erstellt"]
        XCTAssertTrue(savedAlert.waitForExistence(timeout: 10))
        savedAlert.buttons["OK"].tap()
        let result = app.descendants(matching: .any)["backup-result"].firstMatch
        XCTAssertTrue(result.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertTrue(result.label.contains("Sicherung erstellt"))
        app.buttons["import-journal"].tap()
        // The importer opens Recents, whereas exports were saved in On My Device.
        if app.buttons["Durchsuchen"].waitForExistence(timeout: 10) { app.buttons["Durchsuchen"].tap() }
        let localPhone = app.staticTexts["Auf meinem iPhone"].firstMatch
        let localPad = app.staticTexts["Auf meinem iPad"].firstMatch
        if localPhone.waitForExistence(timeout: 3) { localPhone.tap() }
        else if localPad.exists { localPad.tap() }
        let savedFile = app.cells.containing(NSPredicate(format: "label CONTAINS %@", suffix)).firstMatch
        guard savedFile.waitForExistence(timeout: 15) else {
            XCTFail("Saved test file not visible in importer: \(app.debugDescription)"); return
        }
        savedFile.tap()
        let restore = app.buttons["restore-journal"]
        reveal(restore, in: app)
        XCTAssertTrue(restore.waitForExistence(timeout: 10), app.debugDescription)
        XCTAssertFalse(restore.isEnabled)
        let ownBackup = app.switches["Das ist meine eigene Sicherung"]
        reveal(ownBackup, in: app)
        ownBackup.coordinate(withNormalizedOffset: CGVector(dx: 0.92, dy: 0.5)).tap()
        XCTAssertTrue(restore.isEnabled, app.debugDescription)
        reveal(restore, in: app); restore.tap()
        let confirm = app.buttons["Übernehmen"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), app.debugDescription)
        confirm.tap()
        reveal(result, in: app)
        XCTAssertTrue(result.waitForExistence(timeout: 10))
        XCTAssertTrue(result.label.contains("nicht verdoppelt"))
    }
    func testBrowseDaysWithoutNavigationStacking() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-dark"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-1"], in: app); app.buttons["day-1"].tap()
        XCTAssertFalse(app.buttons["previous-day"].isEnabled)
        XCTAssertTrue(app.buttons["next-day"].isEnabled)
        app.buttons["next-day"].tap()
        XCTAssertTrue(app.navigationBars["Tag 2"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Innsbruck – Pustertal – Lienz"].exists)
        let map = app.descendants(matching: .any)["day-map-preview"].firstMatch
        XCTAssertTrue(map.exists)
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = "Next and previous day controls"; shot.lifetime = .keepAlways; add(shot)
        reveal(app.buttons["new-memory"], in: app); app.buttons["new-memory"].tap()
        XCTAssertTrue(app.buttons["memory-record"].waitForExistence(timeout: 5))
        let context = app.descendants(matching: .any)["editor-stage-context"].firstMatch
        XCTAssertTrue(context.label.contains("Tag 2"))
        XCTAssertTrue(context.label.contains("Innsbruck – Pustertal – Lienz"))
        app.buttons["Abbrechen"].tap()
        // Toolbar stays available even at the bottom; changing day resets the scroll.
        app.buttons["previous-day"].tap()
        XCTAssertTrue(app.navigationBars["Tag 1"].waitForExistence(timeout: 5))
        XCTAssertLessThan(map.frame.minY, app.frame.height * 0.65)
        XCTAssertFalse(app.buttons["previous-day"].isEnabled)
        for number in 2...30 {
            app.buttons["next-day"].tap()
            XCTAssertTrue(app.navigationBars["Tag \(number)"].waitForExistence(timeout: 5))
        }
        XCTAssertFalse(app.buttons["next-day"].isEnabled)
        XCTAssertTrue(app.buttons["previous-day"].isEnabled)
        app.buttons["previous-day"].tap()
        XCTAssertTrue(app.navigationBars["Tag 29"].waitForExistence(timeout: 5))
        // One Back returns to the trip, not to the 28 previously visited days.
        app.navigationBars.buttons.element(boundBy: 0).tap()
        // The trip keeps its previous scroll position near day 1; its map may be offscreen.
        XCTAssertTrue(app.buttons["day-1"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["next-day"].exists)
    }

    func testMapFirstDayDetails() {
        checkMapFirstDayDetails(landscape: false)
    }

    func testMapFirstDayDetailsInLandscape() {
        checkMapFirstDayDetails(landscape: true)
    }

    private func checkMapFirstDayDetails(landscape: Bool) {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-dark"]
        app.launch()
        XCUIDevice.shared.orientation = landscape ? .landscapeLeft : .portrait
        defer { XCUIDevice.shared.orientation = .portrait }
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-1"], in: app); app.buttons["day-1"].tap()
        let map = app.descendants(matching: .any)["day-map-preview"].firstMatch
        XCTAssertTrue(map.waitForExistence(timeout: 5))
        XCTAssertGreaterThanOrEqual(map.frame.height, 220)
        XCTAssertLessThan(map.frame.minY, app.frame.height * 0.6)
        let initial = XCTAttachment(screenshot: app.screenshot()); initial.name = "Map-first stage dark"; initial.lifetime = .keepAlways; add(initial)
        let route = app.buttons["route-details-toggle"].firstMatch
        reveal(route, in: app)
        // Safety guidance is outside the closed disclosure, verbatim from the plan.
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Bei einer Sperre nicht automatisch")).firstMatch.exists)
        route.tap()
        XCTAssertTrue(app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "A3 · A13")).firstMatch.exists)
        route.tap()
        let stay = app.buttons["stay-details-toggle"].firstMatch
        reveal(stay, in: app)
        XCTAssertTrue(stay.label.contains("Hotel dasMEI"))
        stay.tap()
        XCTAssertTrue(app.staticTexts["Alternative"].exists)
        stay.tap()
        let memories = app.buttons["day-memories-toggle"].firstMatch
        reveal(memories, in: app)
        XCTAssertTrue(app.buttons["new-memory"].exists)
        memories.tap()
        let details = XCTAttachment(screenshot: app.screenshot()); details.name = "Collapsible day details"; details.lifetime = .keepAlways; add(details)
        memories.tap()
        app.buttons["new-memory"].tap()
        XCTAssertTrue(app.buttons["memory-record"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["editor-stage-context"].firstMatch.label.contains("Tag 1"))
        app.buttons["Abbrechen"].tap()
    }

    func testRestDayAndFerryNotices() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-testing-light"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-7"], in: app); app.buttons["day-7"].tap()
        XCTAssertTrue(app.staticTexts["Ruhetag"].exists)
        XCTAssertTrue(app.descendants(matching: .any)["day-map-preview"].firstMatch.exists)
        let rest = XCTAttachment(screenshot: app.screenshot()); rest.name = "Rest day location map"; rest.lifetime = .keepAlways; add(rest)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        reveal(app.buttons["day-21"], in: app); app.buttons["day-21"].tap()
        let checkin = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "Check-in spätestens 18:00")).firstMatch
        reveal(checkin, in: app)
        XCTAssertTrue(checkin.exists)
        XCTAssertTrue(checkin.label.contains("Nicht gebucht"))
        XCTAssertTrue(app.buttons["route-details-toggle"].exists)
        let ferry = XCTAttachment(screenshot: app.screenshot()); ferry.name = "Ferry guidance outside collapsed details"; ferry.lifetime = .keepAlways; add(ferry)
    }

    func testPlanStatusAndRefreshInSettings() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["trip_adria_2026"].label.contains("Planstand: 7. September 2026"))
        XCTAssertTrue(app.buttons["trip_spanien_2026"].label.contains("Planstand: 16. August 2026"))
        XCTAssertFalse(app.buttons["refresh-plans"].exists)
        XCTAssertFalse(app.staticTexts["Heruntergeladener Reiseplan · offline verfügbar"].exists)
        let overview = XCTAttachment(screenshot: app.screenshot()); overview.name = "Trip selection with plan dates"; overview.lifetime = .keepAlways; add(overview)
        app.buttons["open-settings"].tap()
        XCTAssertTrue(app.navigationBars["Einstellungen"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.buttons["refresh-plans"].isHittable)
        XCTAssertTrue(app.buttons["refresh-plans"].isEnabled)
        let settings = XCTAttachment(screenshot: app.screenshot()); settings.name = "Manual refresh in settings"; settings.lifetime = .keepAlways; add(settings)
        app.buttons["Fertig"].tap()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["refresh-plans"].exists)
    }

    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<12 {
            if element.exists {
                let frame = element.frame
                let visible = app.frame.insetBy(dx: 10, dy: 110)
                if frame.width > 0 && frame.height > 0 && visible.contains(frame) { return }
            }
            app.swipeUp(velocity: .slow)
        }
    }
    func testUnavailableAccountStillAllowsBothRoadbooks() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", "-ui-test-account-unavailable"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["trip_spanien_2026"].exists)
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-1"], in: app)
        app.buttons["day-1"].tap()
        XCTAssertTrue(app.links["Route in Google Maps öffnen"].exists || app.buttons["Route in Google Maps öffnen"].exists)
        XCTAssertFalse(app.buttons["new-memory"].exists)
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        XCTAssertTrue(app.buttons["retry-journal"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["save-memory"].exists)
    }
    func testBothTripsAndPrivateJournalPersists() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        XCTAssertTrue(app.buttons["trip_spanien_2026"].exists)
        app.buttons["trip_adria_2026"].tap()
        reveal(app.buttons["day-1"], in: app)
        app.buttons["day-1"].tap()
        XCTAssertTrue(app.links["Route in Google Maps öffnen"].exists || app.buttons["Route in Google Maps öffnen"].exists)
        let capture = app.buttons["new-memory"]
        reveal(capture, in: app)
        capture.tap()
        app.buttons["memory-type"].tap()
        let editor = app.textViews["memory-text"]
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        let context = app.descendants(matching: .any)["editor-stage-context"].firstMatch
        XCTAssertTrue(context.exists)
        XCTAssertTrue(context.label.contains("Tag 1"))
        let writeContext = XCTAttachment(screenshot: app.screenshot()); writeContext.name = "Writing with persistent route context"; writeContext.lifetime = .keepAlways; add(writeContext)
        let note = "Test-Erinnerung \(UUID().uuidString.prefix(6))"
        editor.tap(); editor.typeText(note)
        app.buttons["save-memory"].tap()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts[note].waitForExistence(timeout: 5))
        XCTAssertTrue(app.descendants(matching: .any)["journal-group-trip_adria_2026-adria-1"].firstMatch.exists)
        app.terminate(); app.launch()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts[note].waitForExistence(timeout: 10))
        app.staticTexts[note].tap()
        XCTAssertTrue(app.navigationBars["Eintrag"].waitForExistence(timeout: 5))
        let entryText = app.staticTexts["journal-entry-text"]
        XCTAssertEqual(entryText.label, note)
        XCTAssertTrue(entryText.isHittable)
        XCTAssertLessThan(entryText.frame.minY, app.frame.height * 0.5)
        XCTAssertFalse(app.buttons["open-day-map"].exists)
        XCTAssertFalse(app.staticTexts["Nur für dich"].exists)
        XCTAssertTrue(app.staticTexts["journal-stage-context"].exists || app.otherElements["journal-stage-context"].exists)
        reveal(app.buttons["journal-open-stage"], in: app)
        let journalContext = XCTAttachment(screenshot: app.screenshot()); journalContext.name = "Journal with day context"; journalContext.lifetime = .keepAlways; add(journalContext)
        app.buttons["journal-open-stage"].tap()
        XCTAssertTrue(app.links["Route in Google Maps öffnen"].waitForExistence(timeout: 5) || app.buttons["Route in Google Maps öffnen"].exists)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["Bearbeiten"].tap()
        XCTAssertTrue(app.textViews["memory-text"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.textViews["memory-text"].value as? String, note)
        app.buttons["Abbrechen"].tap()
        app.buttons["entry-more"].tap()
        app.buttons["Eintrag löschen"].tap()
        app.buttons["Löschen"].tap()
        let removed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.staticTexts[note])
        XCTAssertEqual(XCTWaiter.wait(for: [removed], timeout: 8), .completed)
        app.terminate(); app.launch()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        XCTAssertFalse(app.staticTexts[note].exists)
    }

    func testTripAndDayMaps() {
        checkTripAndDayMaps(dark: false)
    }

    func testTripAndDayMapsInDarkMode() {
        checkTripAndDayMaps(dark: true)
    }

    private func checkTripAndDayMaps(dark: Bool) {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing", dark ? "-ui-testing-dark" : "-ui-testing-light"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["trip_adria_2026"].tap()
        XCTAssertTrue(app.buttons["open-trip-map"].waitForExistence(timeout: 10))
        app.buttons["open-trip-map"].tap()
        XCTAssertTrue(app.buttons["reset-route-map"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["map-route-count"].label, "18 Fahretappen mit Streckenverlauf")
        app.buttons["reset-route-map"].tap()
        let overview = XCTAttachment(screenshot: app.screenshot()); overview.name = "Balkan overview map"; overview.lifetime = .keepAlways; add(overview)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        reveal(app.buttons["day-1"], in: app)
        app.buttons["day-1"].tap()
        reveal(app.buttons["open-day-map"], in: app)
        app.buttons["open-day-map"].tap()
        XCTAssertTrue(app.buttons["reset-route-map"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["map-route-count"].label, "1 Fahretappe mit Streckenverlauf")
        let detail = XCTAttachment(screenshot: app.screenshot()); detail.name = "Balkan stage map"; detail.lifetime = .keepAlways; add(detail)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.navigationBars.buttons.element(boundBy: 0).tap()
        app.buttons["trip_spanien_2026"].tap()
        app.buttons["open-trip-map"].tap()
        XCTAssertTrue(app.buttons["reset-route-map"].waitForExistence(timeout: 10))
        XCTAssertEqual(app.staticTexts["map-route-count"].label, "23 Fahretappen mit Streckenverlauf")
        let spain = XCTAttachment(screenshot: app.screenshot()); spain.name = "Spain overview map"; spain.lifetime = .keepAlways; add(spain)
    }

    func testComposeFromJournalGroupsByRoute() {
        let app = XCUIApplication()
        app.launchArguments = ["-ui-testing"]
        app.launch()
        XCTAssertTrue(app.buttons["trip_adria_2026"].waitForExistence(timeout: 15))
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        let suffix = UUID().uuidString.prefix(6)
        for dayNumber in [2, 1] {
            app.buttons["journal-compose"].tap()
            app.buttons["choose-entry-stage"].tap()
            app.buttons["choose-stage-adria-\(dayNumber)"].tap()
            app.buttons["memory-type"].tap()
            let editor = app.textViews["memory-text"]
            XCTAssertTrue(editor.waitForExistence(timeout: 5))
            let context = app.descendants(matching: .any)["editor-stage-context"].firstMatch
            XCTAssertTrue(context.label.contains("Tag \(dayNumber)"))
            editor.tap(); editor.typeText("Gruppentest Tag \(dayNumber) \(suffix)")
            app.buttons["save-memory"].tap()
            XCTAssertTrue(app.buttons["journal-compose"].waitForExistence(timeout: 5))
        }
        app.terminate(); app.launch()
        app.buttons["Mein Tagebuch"].firstMatch.tap()
        let first = app.descendants(matching: .any)["journal-group-trip_adria_2026-adria-1"].firstMatch
        let second = app.descendants(matching: .any)["journal-group-trip_adria_2026-adria-2"].firstMatch
        XCTAssertTrue(first.waitForExistence(timeout: 5))
        reveal(second, in: app)
        XCTAssertTrue(second.exists)
        XCTAssertLessThan(first.frame.minY, second.frame.minY)
        let grouped = XCTAttachment(screenshot: app.screenshot()); grouped.name = "All memories grouped by stage"; grouped.lifetime = .keepAlways; add(grouped)
        for dayNumber in [2, 1] {
            let note = app.staticTexts["Gruppentest Tag \(dayNumber) \(suffix)"]
            // Return to the top before locating the next section.
            app.swipeDown(); app.swipeDown()
            reveal(note, in: app); note.tap()
            app.buttons["entry-more"].tap()
            app.buttons["Eintrag löschen"].tap(); app.buttons["Löschen"].tap()
        }
    }
}
