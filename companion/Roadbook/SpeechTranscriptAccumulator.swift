import Foundation

/// Keeps completed speech phrases while allowing the current hypothesis to change.
/// A recognition result can describe only the latest phrase after a pause, even
/// when the recognition task itself is not final yet.
struct SpeechTranscriptAccumulator {
    struct Phrase {
        let start: TimeInterval
        let end: TimeInterval
        let text: String
    }

    private var phrases: [Phrase] = []
    private var pending = ""
    private var pendingStart: TimeInterval?

    var text: String {
        let completed = phrases.map(\.text).joined(separator: " ")
        guard !pending.isEmpty else { return completed }
        guard let last = phrases.last else { return pending }

        // Timing distinguishes a newly spoken repetition from another callback
        // for the same words. Partial timing may be absent/zero on some systems.
        if let pendingStart {
            if pendingStart >= last.end - 0.01 {
                return joined(completed, pending)
            }
            if let index = phrases.firstIndex(where: {
                pendingStart >= $0.start - 0.01 && pendingStart < $0.end
            }) {
                return joined(phrases.prefix(index).map(\.text).joined(separator: " "), pending)
            }
        }

        // Some recognizers still return cumulative text. Do not duplicate the
        // completed prefix in that case. This fallback is only for untimed text.
        if beginsWithWords(pending, from: completed) { return pending }
        if beginsWithWords(pending, from: last.text) {
            return joined(phrases.dropLast().map(\.text).joined(separator: " "), pending)
        }
        return joined(completed, pending)
    }

    mutating func update(
        _ text: String,
        completedStart: TimeInterval? = nil,
        completedDuration: TimeInterval? = nil,
        partialStart: TimeInterval? = nil
    ) {
        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        // Empty terminal/error callbacks must never erase what was recognized.
        guard !value.isEmpty else { return }

        if let start = completedStart, let duration = completedDuration,
           start.isFinite, start >= 0, duration.isFinite, duration > 0 {
            let end = start + duration
            // Revisions of the same phrase replace it. A cumulative final result
            // replaces the phrases whose audio range it covers, rather than
            // appending the same speech a second time.
            phrases.removeAll { abs($0.start - start) < 0.01 || ($0.start < end && $0.end > start) }
            phrases.append(Phrase(start: start, end: end, text: value))
            phrases.sort { $0.start < $1.start }
            pending = ""
            pendingStart = nil
        } else {
            pending = value
            pendingStart = partialStart.flatMap { $0.isFinite && $0 > 0 ? $0 : nil }
        }
    }

    private func joined(_ first: String, _ second: String) -> String {
        first.isEmpty ? second : first + " " + second
    }

    private func beginsWithWords(_ value: String, from prefix: String) -> Bool {
        let words = value.lowercased().split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        let prefixWords = prefix.lowercased().split(whereSeparator: { !$0.isLetter && !$0.isNumber })
        return !prefixWords.isEmpty && words.starts(with: prefixWords)
    }
}
