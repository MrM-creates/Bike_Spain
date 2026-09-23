import SwiftUI

struct BookingAccessView: View {
    let bookings: BookingStore
    @State private var pin = ""
    @State private var error: String?
    var body: some View {
        Section("Buchungsstatus bearbeiten") {
            if bookings.unlocked {
                Label("Auf diesem Gerät freigeschaltet", systemImage: "lock.open")
                Button("Bearbeitung sperren") { bookings.lock() }
                    .disabled(bookings.busy).accessibilityIdentifier("booking-lock")
            } else {
                Text("Mitreisende sehen den gemeinsamen Buchungsstatus. Mit deiner Admin-PIN kannst du ihn auf diesem Gerät ändern.")
                    .font(.subheadline)
                SecureField("Admin-PIN", text: $pin)
                    .textContentType(.password).autocorrectionDisabled()
                    .accessibilityIdentifier("booking-pin")
                Button(bookings.busy ? "Wird geprüft …" : "Bearbeitung freischalten") {
                    Task {
                        do { try await bookings.unlock(pin: pin); pin = ""; error = nil }
                        catch { self.error = error.localizedDescription }
                    }
                }.disabled(pin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || bookings.busy)
                    .accessibilityIdentifier("booking-unlock")
            }
            if let error { Text(error).font(.caption).foregroundStyle(.secondary).accessibilityIdentifier("booking-access-error") }
            if let notice = bookings.notice { Text(notice).font(.caption).foregroundStyle(.secondary) }
        }
    }
}

struct StayBookingSummary: View {
    let plans: PlanStore
    let tripID: String
    let stay: StayPlan
    var option: StayOption? = nil
    private var hotel: StayOption? {
        if let option { return option }
        if let pending, pending.version != nil, pending.booking == "booked",
           let selected = stay.options?.first(where: { $0.id == pending.optionID }) { return selected }
        return stay.activeOption
    }
    private var canEdit: Bool { (hotel?.bookingEditable ?? stay.bookingEditable) == true && (stay.options != nil || hotel?.name == stay.first?.name) }
    @State private var editing = false
    private var status: BookingStatus {
        if let pending, pending.version != nil, pending.optionID == hotel?.id, pending.context == (hotel?.bookingContext ?? stay.bookingContext),
           let saved = BookingStatus(rawValue: pending.booking) { return saved }
        return BookingStatus(rawValue: hotel?.booking ?? stay.booking ?? "") ?? (stay.status == "Gebucht" ? .booked : stay.status == "Angefragt" ? .asked : .open)
    }
    private var pending: PendingBooking? { plans.bookings.pendingChange(tripID: tripID, stayID: stay.id) }
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(hotel?.name ?? "Neue Unterkunft nötig").font(.headline)
                .accessibilityIdentifier("booking-hotel")
            if hotel != nil { Label(status.label, systemImage: status.icon)
                .font(.subheadline.weight(.semibold))
                .accessibilityElement(children: .ignore).accessibilityLabel(status.label)
                .accessibilityIdentifier("booking-status") }
            if let pending {
                Text(pending.version == nil ? "Speichern noch nicht bestätigt" : "Gespeichert · wird für Mitreisende aktualisiert.")
                    .font(.caption).foregroundStyle(.secondary)
                    .accessibilityIdentifier("booking-pending")
                if pending.version == nil {
                    Text("\(BookingStatus(rawValue: pending.booking)?.label ?? pending.booking) ist noch nicht bestätigt. Bitte den Status prüfen.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Button(pending.version == nil ? "Status prüfen" : "Aktualisieren") { Task { await plans.bookings.check(pending, plans: plans) } }
                    .disabled(plans.bookings.busy || plans.busy).accessibilityIdentifier("booking-check")
            } else if plans.bookings.unlocked && canEdit {
                Button("Buchungsstatus ändern") { editing = true }
                    .disabled(plans.bookings.busy).accessibilityIdentifier(option?.id.map { "booking-edit-" + $0 } ?? "booking-edit")
            }
        }
        .sheet(isPresented: $editing) {
            BookingEditor(plans: plans, tripID: tripID, stay: stay, option: hotel, initialStatus: status)
        }
    }
}

private struct BookingEditor: View {
    let plans: PlanStore
    let tripID: String
    let stay: StayPlan
    let option: StayOption?
    let initialStatus: BookingStatus
    @Environment(\.dismiss) private var dismiss
    @State private var selected: BookingStatus
    @State private var error: String?

    init(plans: PlanStore, tripID: String, stay: StayPlan, option: StayOption?, initialStatus: BookingStatus) {
        self.plans = plans; self.tripID = tripID; self.stay = stay; self.option = option; self.initialStatus = initialStatus
        _selected = State(initialValue: initialStatus)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Vorgesehene Unterkunft") {
                    Text(option?.name ?? stay.first?.name ?? "Unterkunft").font(.headline)
                    if let start = stay.startDate, let end = stay.endDate {
                        Text("\(displayDate(start)) – \(displayDate(end))").font(.subheadline)
                    }
                    Text("Gilt für den ganzen Aufenthalt in dieser Unterkunft. „Gebucht“ macht sie zum Ziel der Anreise und zum Start der nächsten Etappe.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                Section("Buchungsstatus") {
                    ForEach(stay.options == nil ? [.open, .asked, .booked] : BookingStatus.allCases) { status in
                        Button { selected = status } label: {
                            HStack {
                                Label(status.label, systemImage: status.icon)
                                Spacer()
                                if selected == status { Image(systemName: "checkmark") }
                            }.foregroundStyle(.primary)
                        }
                        .accessibilityAddTraits(selected == status ? .isSelected : [])
                        .accessibilityIdentifier("booking-select-\(status.rawValue)")
                    }
                }
                Section {
                    Text("Der Status wird für alle sichtbar. Die App führt keine Hotelbuchung oder Stornierung beim Anbieter aus. Deine Tagebucheinträge bleiben privat.")
                        .font(.caption).foregroundStyle(.secondary)
                    if let error { Text(error).accessibilityIdentifier("booking-save-error") }
                    Button(plans.bookings.busy ? "Wird übertragen …" : "Status speichern") {
                        Task {
                            do {
                                try await plans.bookings.save(tripID: tripID, stay: stay, option: option, status: selected, plans: plans)
                                dismiss()
                            } catch { self.error = error.localizedDescription }
                        }
                    }.disabled(selected == initialStatus || plans.bookings.busy || plans.bookings.pendingChange(tripID: tripID, stayID: stay.id) != nil)
                        .accessibilityIdentifier("booking-save")
                }
            }
            .navigationTitle("Buchungsstatus").navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("Schliessen") { dismiss() }.disabled(plans.bookings.busy) }
            .interactiveDismissDisabled(plans.bookings.busy)
        }
    }
}

struct AccommodationRouteNotice: View {
    let plans: PlanStore
    let tripID: String
    let stay: StayPlan
    let message: String?
    @State private var error: String?
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("Unterkunft gespeichert · Route noch nicht aktualisiert", systemImage: "exclamationmark.triangle")
            if let message { Text(message).font(.caption) }
            if let value = stay.directMapsURL, let url = URL(string: value) {
                Link("Direkt zur Unterkunft navigieren", destination: url)
                Text("Direkte Anfahrt ohne die geplanten Zwischenstopps.").font(.caption).foregroundStyle(.secondary)
            }
            if plans.bookings.unlocked, let option = stay.activeOption {
                Button("Route erneut aktualisieren") {
                    Task {
                        do { try await plans.bookings.save(tripID: tripID, stay: stay, option: option, status: BookingStatus(rawValue: option.booking ?? "open") ?? .open, plans: plans, retryRoute: true) }
                        catch { self.error = error.localizedDescription }
                    }
                }.disabled(plans.bookings.busy || plans.bookings.pendingChange(tripID: tripID, stayID: stay.id) != nil)
            }
            if let error { Text(error).font(.caption) }
        }
    }
}
