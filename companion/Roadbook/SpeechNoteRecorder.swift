import AVFoundation
import Foundation
import Speech

@MainActor
final class SpeechNoteRecorder: ObservableObject {
    @Published private(set) var transcript = ""
    @Published private(set) var isRecording = false
    @Published private(set) var isStarting = false
    @Published private(set) var isFinishing = false
    @Published private(set) var errorMessage: String?

    private let audioEngine = AVAudioEngine()
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "de-CH"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var hasInstalledTap = false
    private var audioSessionActive = false
    private var sessionID = UUID()
    private var finishTimeout: Task<Void, Never>?
    private var transcriptAccumulator = SpeechTranscriptAccumulator()
    #if DEBUG
    private var simulatedSessions = 0
    private var simulatesSpeech: Bool {
        ProcessInfo.processInfo.arguments.contains("-ui-testing") &&
        ProcessInfo.processInfo.arguments.contains("-ui-test-speech")
    }
    #endif

    func start() async {
        guard !Task.isCancelled, !isRecording && !isStarting && !isFinishing else { return }
        cancel()
        let session = sessionID
        isStarting = true
        defer { if sessionID == session { isStarting = false } }
        errorMessage = nil
        transcript = ""
        transcriptAccumulator = SpeechTranscriptAccumulator()

        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-ui-testing") {
            if ProcessInfo.processInfo.arguments.contains("-ui-test-speech-denied") {
                errorMessage = "Das Mikrofon ist nicht erlaubt. Du kannst es in den Einstellungen für Roadbook aktivieren."
                return
            }
            if simulatesSpeech {
                simulatedSessions += 1
                isRecording = true
                let environment = ProcessInfo.processInfo.environment
                // Separate simulated recognizer sessions exercise the real
                // Continue dictating path, including successive corrections.
                transcript = environment["ROADBOOK_TEST_TRANSCRIPT_\(simulatedSessions)"] ?? environment["ROADBOOK_TEST_TRANSCRIPT"] ?? (simulatedSessions == 1 ? "Heute über den Pass" : "Abends am Hafen gegessen.")
                return
            }
            errorMessage = "Die Spracherkennung ist im automatischen Test nicht verfügbar."
            return
        }
        #endif

        let speechGranted = await speechPermissionGranted()
        guard sessionID == session, !Task.isCancelled else { return }
        guard speechGranted else {
            errorMessage = "Spracherkennung ist nicht erlaubt. Du kannst sie in den Einstellungen für Roadbook aktivieren."
            return
        }

        let microphoneGranted = await microphonePermissionGranted()
        guard sessionID == session, !Task.isCancelled else { return }
        guard microphoneGranted else {
            errorMessage = "Das Mikrofon ist nicht erlaubt. Du kannst es in den Einstellungen für Roadbook aktivieren."
            return
        }

        guard let speechRecognizer, speechRecognizer.isAvailable else {
            errorMessage = "Die Spracherkennung ist gerade nicht verfügbar. Bitte versuche es später nochmals."
            return
        }

        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
            audioSessionActive = true

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            request.addsPunctuation = true
            if speechRecognizer.supportsOnDeviceRecognition {
                request.requiresOnDeviceRecognition = true
            }
            recognitionRequest = request

            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)
            guard recordingFormat.sampleRate > 0, recordingFormat.channelCount > 0 else {
                errorMessage = "Kein Mikrofon verfügbar. Bitte prüfe den Audioeingang."
                cancel()
                return
            }
            inputNode.installTap(onBus: 0, bufferSize: 1_024, format: recordingFormat) { [weak request] buffer, _ in
                request?.append(buffer)
            }
            hasInstalledTap = true

            audioEngine.prepare()
            try audioEngine.start()
            isRecording = true

            recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
                Task { @MainActor in
                    guard let self, self.sessionID == session else { return }
                    if let result {
                        let metadata = result.speechRecognitionMetadata
                        self.transcriptAccumulator.update(
                            result.bestTranscription.formattedString,
                            completedStart: metadata?.speechStartTimestamp,
                            completedDuration: metadata?.speechDuration,
                            partialStart: result.bestTranscription.segments.first?.timestamp
                        )
                        self.transcript = self.transcriptAccumulator.text
                    }
                    // A terminal result can arrive together with an error. Report
                    // the failure before handling isFinal, otherwise it is silent.
                    if let error {
                        if !self.isFinishing || self.transcript.isEmpty {
                            self.errorMessage = SpeechRecognitionFeedback.message(
                                for: error,
                                hasText: !self.transcript.isEmpty,
                                isMac: ProcessInfo.processInfo.isiOSAppOnMac
                            )
                        }
                        self.cancel()
                    } else if result?.isFinal == true {
                        if self.transcript.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            self.errorMessage = SpeechRecognitionFeedback.message(
                                for: nil, hasText: false,
                                isMac: ProcessInfo.processInfo.isiOSAppOnMac
                            )
                        }
                        self.cancel()
                    }
                }
            }
        } catch {
            errorMessage = "Die Aufnahme konnte nicht gestartet werden. Bitte versuche es nochmals."
            cancel()
        }
    }

    func stop() {
        guard isRecording else { if isStarting { cancel() }; return }
        // Keep recognition alive briefly so the last words can arrive after the tap stops.
        isFinishing = true
        isRecording = false
        stopAudio()
        let session = sessionID
        finishTimeout = Task { [weak self] in
            try? await Task.sleep(for: .seconds(2))
            guard !Task.isCancelled, let self, self.sessionID == session else { return }
            #if DEBUG
            if self.simulatesSpeech && self.simulatedSessions == 1 && ProcessInfo.processInfo.environment["ROADBOOK_TEST_TRANSCRIPT"] == nil && ProcessInfo.processInfo.environment["ROADBOOK_TEST_TRANSCRIPT_1"] == nil {
                self.transcript = "Heute über den Pass bis ans Meer gefahren."
            }
            #endif
            self.cancel()
        }
    }

    func cancel() {
        sessionID = UUID()
        finishTimeout?.cancel()
        finishTimeout = nil
        stopAudio()
        recognitionTask?.cancel()
        recognitionTask = nil
        isStarting = false
        isFinishing = false
        isRecording = false
    }

    private func stopAudio() {
        if audioEngine.isRunning {
            audioEngine.stop()
        }
        if hasInstalledTap {
            audioEngine.inputNode.removeTap(onBus: 0)
            hasInstalledTap = false
        }

        recognitionRequest?.endAudio()
        recognitionRequest = nil
        if audioSessionActive {
            try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            audioSessionActive = false
        }
    }

    private func speechPermissionGranted() async -> Bool {
        switch SFSpeechRecognizer.authorizationStatus() {
        case .authorized:
            return true
        case .notDetermined:
            return await withCheckedContinuation { continuation in
                SFSpeechRecognizer.requestAuthorization { status in
                    continuation.resume(returning: status == .authorized)
                }
            }
        case .denied, .restricted:
            return false
        @unknown default:
            return false
        }
    }

    private func microphonePermissionGranted() async -> Bool {
        switch AVAudioApplication.shared.recordPermission {
        case .granted:
            return true
        case .undetermined:
            return await withCheckedContinuation { continuation in
                AVAudioApplication.requestRecordPermission { granted in
                    continuation.resume(returning: granted)
                }
            }
        case .denied:
            return false
        @unknown default:
            return false
        }
    }
}
