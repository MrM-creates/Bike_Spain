import Foundation

// Run together with SpeechTranscriptAccumulator.swift using swiftc.
// These are recognition callback fixtures, not a substitute for microphone tests.
@main
struct SpeechTranscriptChecks {
    static func main() {
        var checks = 0
        func expect(_ result: String, _ expected: String, _ scenario: String) {
            precondition(result == expected, "\(scenario): expected [\(expected)], got [\(result)]")
            checks += 1
        }

        var speech = SpeechTranscriptAccumulator()
        speech.update("Erinnere mich morgen um neun")
        speech.update("Erinnere mich morgen um 9:00 Uhr")
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr", "Partial revisions replace, not append")
        speech.update("Erinnere mich morgen um 9:00 Uhr", completedStart: 0.2, completedDuration: 2.8)
        speech.update("die Garage")
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage", "Prefix survives a pause and an untimed new phrase")
        speech.update("die Garage anzurufen", partialStart: 4.2)
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage anzurufen", "New phrase can be revised")
        speech.update("die Garage anzurufen.", completedStart: 4.2, completedDuration: 1.8)
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage anzurufen.", "Second phrase is committed")
        speech.update("die Garage anzurufen.", completedStart: 4.2, completedDuration: 1.8)
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage anzurufen.", "Repeated final callback is idempotent")
        speech.update("für das Projekt Motorradreise", partialStart: 7)
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage anzurufen. für das Projekt Motorradreise", "Several pauses retain every phrase")
        speech.update("für das Projekt Motorradreise.", completedStart: 7, completedDuration: 2)
        speech.update("")
        expect(speech.text, "Erinnere mich morgen um 9:00 Uhr die Garage anzurufen. für das Projekt Motorradreise.", "Empty callback does not erase text")

        speech = SpeechTranscriptAccumulator()
        speech.update("Morgen um neun", completedStart: 0, completedDuration: 1)
        speech.update("Entschuldigung um zehn Uhr", partialStart: 3)
        expect(speech.text, "Morgen um neun Entschuldigung um zehn Uhr", "Spoken correction survives a pause")
        speech.update("Entschuldigung um 10:00 Uhr Peter anrufen", completedStart: 3, completedDuration: 3)
        expect(speech.text, "Morgen um neun Entschuldigung um 10:00 Uhr Peter anrufen", "Correction phrase is preserved literally")

        speech = SpeechTranscriptAccumulator()
        speech.update("Nicht heute", completedStart: 0.1, completedDuration: 1)
        speech.update("sondern erst nächste Woche", partialStart: 2)
        expect(speech.text, "Nicht heute sondern erst nächste Woche", "Negation survives the pause")

        speech = SpeechTranscriptAccumulator()
        speech.update("Ja.", completedStart: 0.1, completedDuration: 0.5)
        speech.update("Ja.", partialStart: 2)
        expect(speech.text, "Ja. Ja.", "Identical words at a later audio time are real repetition")
        speech.update("Ja.", completedStart: 2, completedDuration: 0.5)
        expect(speech.text, "Ja. Ja.", "Final repetitions are not deduplicated by text")

        speech = SpeechTranscriptAccumulator()
        speech.update("Milch kaufen", completedStart: 0.1, completedDuration: 1)
        speech.update("Milch und Kaffee kaufen", partialStart: 0.1)
        expect(speech.text, "Milch und Kaffee kaufen", "Revision of same audio range")
        speech.update("Milch und Kaffee kaufen.", completedStart: 0.1, completedDuration: 1.5)
        expect(speech.text, "Milch und Kaffee kaufen.", "Corrected final replaces same phrase")

        speech = SpeechTranscriptAccumulator()
        speech.update("Milch kaufen.", completedStart: 0, completedDuration: 1)
        speech.update("Kaffee kaufen.", completedStart: 2, completedDuration: 1)
        speech.update("Milch kaufen. Kaffee kaufen.")
        expect(speech.text, "Milch kaufen. Kaffee kaufen.", "Untimed cumulative final is not duplicated")
        speech.update("Milch kaufen. Kaffee kaufen.", completedStart: 0, completedDuration: 3)
        expect(speech.text, "Milch kaufen. Kaffee kaufen.", "Timed cumulative final replaces covered phrases")

        speech = SpeechTranscriptAccumulator()
        speech.update("Die Garage", completedStart: 0, completedDuration: 1)
        speech.update("Die Garage anrufen.")
        expect(speech.text, "Die Garage anrufen.", "Late final words extend rather than duplicate")
        speech.update("   ")
        expect(speech.text, "Die Garage anrufen.", "Empty result retains pending tail too")

        speech = SpeechTranscriptAccumulator()
        expect(speech.text, "", "New recording clears previous session")
        speech.update("Eine neue Notiz")
        expect(speech.text, "Eine neue Notiz", "New recording is independent")

        print("Speech transcript checks passed: \(checks) assertions (pauses, corrections, repetitions, cumulative results and reset).")
    }
}
