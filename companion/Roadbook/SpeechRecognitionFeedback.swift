import Foundation

enum SpeechRecognitionFeedback {
    static func message(for error: Error?, hasText: Bool, isMac: Bool) -> String {
        var current = error as NSError?
        // Apple can wrap the recognizer's error. Bound traversal in case an
        // underlying-error chain contains a cycle; never expose private text.
        for _ in 0..<8 {
            guard let value = current else { break }
            if ["kLSRErrorDomain", "kAFAssistantErrorDomain"].contains(value.domain), value.code == 201 {
                let action = isMac
                    ? "Aktiviere sie unter Systemeinstellungen → Tastatur → Diktierfunktion und starte die Aufnahme erneut."
                    : "Aktiviere sie unter Einstellungen → Allgemein → Tastatur → Diktierfunktion aktivieren und starte die Aufnahme erneut."
                return "Die Diktierfunktion ist ausgeschaltet. " + action
                    + (hasText ? " Der bisher erkannte Text bleibt erhalten." : "")
            }
            current = value.userInfo[NSUnderlyingErrorKey] as? NSError
        }

        if hasText {
            return "Die Aufnahme wurde unterbrochen. Der bisher erkannte Text bleibt erhalten. Du kannst weiter diktieren."
        }
        return isMac
            ? "Die Spracherkennung hat keinen Text geliefert. Prüfe unter Systemeinstellungen → Tastatur, ob die Diktierfunktion eingeschaltet ist, und versuche es erneut."
            : "Die Spracherkennung hat keinen Text geliefert. Bitte starte die Aufnahme erneut."
    }
}
