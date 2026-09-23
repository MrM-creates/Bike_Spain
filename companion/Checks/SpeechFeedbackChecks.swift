import Foundation

@main
struct SpeechFeedbackChecks {
    static func main() {
        let disabled = NSError(domain: "kLSRErrorDomain", code: 201)
        let mac = SpeechRecognitionFeedback.message(for: disabled, hasText: false, isMac: true)
        precondition(mac.contains("Diktierfunktion ist ausgeschaltet"))
        precondition(mac.contains("Systemeinstellungen → Tastatur"))
        precondition(!mac.contains("Text bleibt erhalten"))
        let wrapped = NSError(domain: "Wrapper", code: 1, userInfo: [NSUnderlyingErrorKey: disabled])
        let retained = SpeechRecognitionFeedback.message(for: wrapped, hasText: true, isMac: true)
        precondition(retained.contains("Diktierfunktion ist ausgeschaltet"))
        precondition(retained.contains("Text bleibt erhalten"))
        let phone = SpeechRecognitionFeedback.message(for: disabled, hasText: false, isMac: false)
        precondition(phone.contains("Einstellungen → Allgemein → Tastatur"))
        let unrelated = NSError(domain: "Other", code: 201)
        precondition(!SpeechRecognitionFeedback.message(for: unrelated, hasText: false, isMac: true).contains("ist ausgeschaltet"))
        precondition(SpeechRecognitionFeedback.message(for: nil, hasText: false, isMac: true).contains("keinen Text"))
        precondition(SpeechRecognitionFeedback.message(for: unrelated, hasText: true, isMac: false).contains("Text bleibt erhalten"))
        print("Speech feedback checks passed: 9 assertions (disabled dictation, wrapped errors, platform guidance, empty result and preserved text).")
    }
}
