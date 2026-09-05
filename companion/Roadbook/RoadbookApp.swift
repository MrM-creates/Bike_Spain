import SwiftUI
import SwiftData

enum RoadbookStyle {
    static let accent = Color(red: 0.09, green: 0.42, blue: 0.28)
    static let lightAccent = Color(red: 0.34, green: 0.76, blue: 0.54)
    static let spacing: CGFloat = 16
    static let radius: CGFloat = 12
}

@main struct RoadbookApp: App {
    @State private var plans = PlanStore()
    @State private var journal = JournalSession()
    @Environment(\.scenePhase) private var scenePhase
    private var testColorScheme: ColorScheme? {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-ui-testing-dark") { return .dark }
        if args.contains("-ui-testing-light") { return .light }
        #endif
        return nil
    }
    var body: some Scene {
        WindowGroup {
            Group {
                if let container = journal.container {
                    CompanionView(plans: plans, journal: journal)
                        .modelContainer(container)
                        .id(journal.identity)
                } else {
                    CompanionView(plans: plans, journal: journal)
                }
            }
            .tint(RoadbookStyle.accent)
            .preferredColorScheme(testColorScheme)
            .task { if journal.container == nil { await journal.open() } }
            .task {
                #if DEBUG
                if ProcessInfo.processInfo.arguments.contains("-ui-testing") { return }
                #endif
                await plans.refresh()
            }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { Task { await journal.recheckIfNeeded() } }
            }
        }
    }
}

struct CompanionView: View {
    let plans: PlanStore
    let journal: JournalSession
    @State private var settings = false
    var body: some View {
        TabView {
            NavigationStack {
                List {
                    Section {
                        ForEach(plans.feed?.trips ?? []) { trip in
                            NavigationLink {
                                TripView(plans: plans, tripID: trip.id, journalAvailable: journal.container != nil)
                            } label: {
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(trip.name).font(.title3.weight(.semibold))
                                    Text("\(displayDate(trip.startDate)) – \(displayDate(trip.endDate))").font(.subheadline)
                                    Text("\(trip.days.count) Tage · \(trip.status)").font(.caption).foregroundStyle(.secondary)
                                    Text("Planstand: \(displayDate(String(trip.version.prefix(10))))")
                                        .font(.caption).foregroundStyle(.secondary)
                                }.padding(.vertical, 8)
                            }.accessibilityIdentifier(trip.id)
                        }
                    } header: { Text("Deine Reisen") } footer: {
                        Text("Planen und Routen ändern bleibt in der Web-App. Hier begleitest du die Reise und hältst Erinnerungen fest.")
                    }
                    if plans.error != nil {
                        Section {
                            Label("Reisepläne konnten nicht aktualisiert werden. Mehr dazu in den Einstellungen.", systemImage: "info.circle")
                                .font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .navigationTitle("Roadbook")
                .toolbar {
                    Button { settings = true } label: { Image(systemName: "gearshape") }
                        .accessibilityLabel("Einstellungen").accessibilityIdentifier("open-settings")
                }
            }.tabItem { Label("Reisen", systemImage: "map") }
            NavigationStack {
                Group {
                    if journal.container != nil { JournalList(plans: plans) }
                    else { JournalUnavailableView(journal: journal) }
                }.navigationTitle("Mein Tagebuch")
            }.tabItem { Label("Mein Tagebuch", systemImage: "book.closed") }
        }
        .sheet(isPresented: $settings) {
            NavigationStack {
                List {
                    Section("Reisepläne") {
                        Text("Beim Start werden veröffentlichte Änderungen automatisch übernommen. Dein gespeicherter Plan bleibt auch ohne Empfang lesbar.")
                            .font(.subheadline)
                        Text(plans.message).font(.caption).foregroundStyle(.secondary)
                        if let error = plans.error { Text(error).foregroundStyle(.secondary) }
                        Button { Task { await plans.refresh() } } label: {
                            Label(plans.busy ? "Wird geladen …" : "Reisepläne aktualisieren", systemImage: "arrow.clockwise")
                        }.disabled(plans.busy).accessibilityIdentifier("refresh-plans")
                    }
                    Section("Persönlich") {
                        Label("Notizen und Fotos siehst nur du.", systemImage: "lock")
                        Text("Keine automatische Freigabe an Mitreisende. Deine Einträge werden nicht an die Web-App oder ChatGPT gesendet.")
                        if journal.container != nil {
                            NavigationLink { JournalBackupView(journal: journal) } label: {
                                Label("Tagebuch sichern", systemImage: "externaldrive")
                            }.accessibilityIdentifier("journal-backup")
                        }
                    }
                    Section("Speicher") {
                        Text("Roadbook \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "") (\(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? ""))")
                        Text(journal.status)
                        Text("Offline-Reiseplan und persönliche Einträge sind getrennt gespeichert. Originalfotos bleiben in deiner Mediathek; das Tagebuch speichert verkleinerte Kopien.")
                        Text("Diese erste Version teilt keine Tagebucheinträge. Karten und externe Navigation benötigen gegebenenfalls Internet.")
                    }
                    Section("Reiseplanung") {
                        Link("Web-App öffnen", destination: URL(string: "https://motorrad-roadbook-spanien-2026.vercel.app/")!)
                        Text("Nur der online bereitgestellte Plan wird übernommen. Noch nicht veröffentlichte Browseränderungen erscheinen hier nicht.")
                    }
                }.navigationTitle("Einstellungen")
                    .toolbar { Button("Fertig") { settings = false } }
            }
        }
    }
}

struct TripView: View {
    let plans: PlanStore
    let tripID: String
    var journalAvailable = true
    private var trip: TripPlan? { plans.feed?.trips.first { $0.id == tripID } }
    var body: some View {
        if let trip {
            List {
                RouteMapSection(trip: trip)
                Section {
                    Text(trip.description)
                    Text(trip.status).font(.caption).foregroundStyle(.secondary)
                    Text("Planstand: \(displayDate(String(trip.version.prefix(10))))").font(.caption).foregroundStyle(.secondary)
                }
                Section("Tagesetappen") {
                    ForEach(trip.days) { day in
                        NavigationLink {
                            DayView(trip: trip, day: day, journalAvailable: journalAvailable)
                        } label: {
                            HStack(alignment: .top, spacing: 12) {
                                Text("\(day.number)").font(.headline).foregroundStyle(RoadbookStyle.accent).frame(width: 30)
                                VStack(alignment: .leading, spacing: 5) {
                                    Text(day.title).font(.headline)
                                    Text(displayDate(day.date)).font(.caption)
                                    Text(day.rest ? "Ruhetag" : "\(day.distance) · \(day.duration)").font(.subheadline).foregroundStyle(.secondary)
                                }
                            }.padding(.vertical, 6)
                        }.accessibilityIdentifier("day-\(day.number)")
                    }
                }
            }.navigationTitle(trip.name).navigationBarTitleDisplayMode(.inline)
        } else { ContentUnavailableView("Reise nicht vorhanden", systemImage: "map") }
    }
}

struct DayView: View {
    let trip: TripPlan
    let day: TripDay
    var journalAvailable = true
    @State private var selectedDayID: String?
    @Environment(\.colorScheme) private var colorScheme
    private var currentDay: TripDay { trip.days.first { $0.id == (selectedDayID ?? day.id) } ?? day }
    private var previous: TripDay? { trip.adjacentDay(to: currentDay.id, offset: -1) }
    private var next: TripDay? { trip.adjacentDay(to: currentDay.id, offset: 1) }

    var body: some View {
        DayContent(trip: trip, day: currentDay, journalAvailable: journalAvailable)
            // A new day gets fresh scroll, map camera, disclosures and journal context.
            .id(trip.id + "/" + currentDay.id)
            .navigationTitle("Tag \(currentDay.number)").navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button { if let previous { selectedDayID = previous.id } } label: {
                        Image(systemName: "chevron.left").frame(minWidth: 44, minHeight: 44)
                    }
                    .disabled(previous == nil)
                    .accessibilityLabel(previous.map { "Vorheriger Tag: Tag \($0.number)" } ?? "Kein vorheriger Tag")
                    .accessibilityHint(previous?.title ?? "Erster Tag dieser Reise")
                    .accessibilityIdentifier("previous-day")
                    Button { if let next { selectedDayID = next.id } } label: {
                        Image(systemName: "chevron.right").frame(minWidth: 44, minHeight: 44)
                    }
                    .disabled(next == nil)
                    .accessibilityLabel(next.map { "Nächster Tag: Tag \($0.number)" } ?? "Kein nächster Tag")
                    .accessibilityHint(next?.title ?? "Letzter Tag dieser Reise")
                    .accessibilityIdentifier("next-day")
                }
            }
            .tint(colorScheme == .dark ? Color(red: 0.40, green: 0.85, blue: 0.68) : RoadbookStyle.accent)
    }
}

private struct DayContent: View {
    let trip: TripPlan
    let day: TripDay
    var journalAvailable = true
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Environment(\.colorScheme) private var colorScheme
    @State private var routeExpanded = false
    @State private var stayExpanded = false
    @State private var navigationExpanded = false
    private var importantNotes: [String] { DayNotes.important(tripID: trip.id, day: day) }
    private var routePoints: [String] {
        guard !day.mapsURL.isEmpty else { return [] }
        return ((try? navigationRoutePoints(day.mapsURL)) ?? [])
            .map { $0.replacingOccurrences(of: "+", with: " ") }
    }
    private func routePointLabel(at index: Int) -> String {
        if index == 0 { return "Start" }
        if index == routePoints.count - 1 { return "Ziel" }
        return "Zwischenziel \(index)"
    }
    var body: some View {
        GeometryReader { geometry in
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Tag \(day.number) · \(displayDate(day.date))").font(.subheadline).foregroundStyle(.secondary)
                    Text(day.title).font(.title3.weight(.semibold))
                    if !day.rest { Text("\(day.distance) · \(day.duration)").font(.subheadline).foregroundStyle(.secondary) }
                    else { Label("Ruhetag", systemImage: "sun.horizon").font(.subheadline).foregroundStyle(.secondary) }
                }.padding(.vertical, 4)
            }
            RouteMapSection(trip: trip, day: day,
                            prominentHeight: min(sizeClass == .regular ? 420 : 320, max(220, geometry.size.height * 0.48)))
            if !day.mapsURL.isEmpty {
                Section {
                if let parts = day.navigationParts, let first = parts.first, let url = URL(string: first.mapsURL) {
                    Link(destination: url) {
                        Label("Abschnitt 1: \(first.title)", systemImage: "arrow.triangle.turn.up.right.diamond")
                            .frame(minHeight: 44, alignment: .leading)
                    }.accessibilityLabel("Abschnitt 1 von \(parts.count): \(first.title) in Google Maps öffnen")
                    DisclosureGroup("Weitere Abschnitte", isExpanded: $navigationExpanded) {
                        ForEach(Array(parts.dropFirst().enumerated()), id: \.element.id) { index, part in
                            if let url = URL(string: part.mapsURL) {
                                Link("Abschnitt \(index + 2): \(part.title)", destination: url)
                                    .frame(minHeight: 44, alignment: .leading)
                                    .accessibilityLabel("Abschnitt \(index + 2) von \(parts.count): \(part.title) in Google Maps öffnen")
                            }
                        }
                    }.accessibilityIdentifier("navigation-parts-toggle")
                    Text("Abschnitte der Reihe nach öffnen. Den nächsten Link erst am jeweiligen Haltepunkt aufrufen.")
                        .font(.caption).foregroundStyle(.secondary)
                } else if let url = URL(string: day.mapsURL) {
                    Link(destination: url) { Label("Route in Google Maps öffnen", systemImage: "arrow.triangle.turn.up.right.diamond") }
                }
                Text("Google Maps berechnet zwischen den Wegpunkten neu. Verlauf prüfen; keine Offline-Navigation zugesagt.").font(.caption).foregroundStyle(.secondary)
                }
            }
            if !importantNotes.isEmpty {
                Section {
                    ForEach(Array(importantNotes.enumerated()), id: \.offset) { _, note in
                        Label(note, systemImage: "exclamationmark.circle")
                            .font(.subheadline).fixedSize(horizontal: false, vertical: true)
                    }
                } header: { Text("Vor dieser Etappe beachten") }
            }
            if !day.rest {
                Section {
                    DisclosureGroup(isExpanded: $routeExpanded) {
                        ForEach(Array(routePoints.enumerated()), id: \.offset) { index, point in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(routePointLabel(at: index)).font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                                Text(point).font(.subheadline.monospaced()).textSelection(.enabled)
                            }.padding(.vertical, 3)
                        }
                        if routePoints.isEmpty {
                            Text("Keine übertragbaren Navigationspunkte hinterlegt.").foregroundStyle(.secondary)
                        }
                        if !day.roads.isEmpty {
                            Divider()
                            Text("Strassen und Verlauf").font(.caption.weight(.semibold)).foregroundStyle(.secondary)
                            Text(day.roads).font(.subheadline)
                        }
                    } label: { Label("Wegpunkte & Strassen", systemImage: "road.lanes") }
                    .accessibilityIdentifier("route-details-toggle")
                }
            }
            if let stay = day.accommodation {
                Section {
                    DisclosureGroup(isExpanded: $stayExpanded) {
                        if let option = stay.first { OptionView(option: option, label: "Erste Wahl") }
                        if let option = stay.alternative { OptionView(option: option, label: "Alternative") }
                        if !stay.notes.isEmpty { Text(stay.notes).font(.caption).foregroundStyle(.secondary) }
                    } label: {
                        VStack(alignment: .leading, spacing: 6) {
                            Label("Unterkunft · \(stay.status)", systemImage: "bed.double")
                            Text(stay.first?.name ?? "Noch keine erste Wahl").font(.subheadline).foregroundStyle(.secondary)
                        }
                    }.accessibilityIdentifier("stay-details-toggle")
                }
            }
            if journalAvailable { DayMemories(trip: trip, day: day) }
            else {
                Section("Meine Erinnerungen") {
                    Label("Persönlicher Speicher noch nicht verfügbar", systemImage: "lock")
                    Text("Du kannst die Route weiterhin ansehen. Unter Mein Tagebuch findest du den Speicherstatus.")
                }
            }
        }
        }
        .tint(colorScheme == .dark ? Color(red: 0.40, green: 0.85, blue: 0.68) : RoadbookStyle.accent)
    }
}

struct DayMemories: View {
    let trip: TripPlan
    let day: TripDay
    @State private var capture = false
    @State private var expanded = false
    @Query(sort: \JournalEntry.createdAt, order: .reverse) private var entries: [JournalEntry]
    private var dayEntries: [JournalEntry] { entries.filter { $0.tripID == trip.id && $0.stageID == day.id } }
    var body: some View {
        Section {
            Button { capture = true } label: { Label("Eintrag für Tag \(day.number)", systemImage: "square.and.pencil") }
                .accessibilityIdentifier("new-memory")
                .sheet(isPresented: $capture) { EntryEditor(tripID: trip.id, tripName: trip.name, day: day) }
            DisclosureGroup(isExpanded: $expanded) {
                if dayEntries.isEmpty { Text("Noch keine Einträge für diesen Tag.").foregroundStyle(.secondary) }
                ForEach(dayEntries) { entry in
                    NavigationLink { EntryDetail(entry: entry, trip: trip, day: day) } label: { EntryRow(entry: entry) }
                }
            } label: { Text("\(dayEntries.count) \(dayEntries.count == 1 ? "Eintrag" : "Einträge")") }
                .accessibilityIdentifier("day-memories-toggle")
        } header: { Label("Mein Tagebuch · Tag \(day.number)", systemImage: "lock") }
          footer: { Text("Persönlich. Für Mitreisende nicht sichtbar.") }
    }
}

struct JournalUnavailableView: View {
    let journal: JournalSession
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.shield").font(.largeTitle)
            Text(journal.error ?? "Dein persönlicher Speicher wird geöffnet …").multilineTextAlignment(.center)
            Text("Deine Reisepläne bleiben im Bereich Reisen verfügbar. Es werden keine Erinnerungen gelöscht.").font(.subheadline)
            if journal.error != nil {
                Button("Erneut versuchen") { Task { await journal.open() } }
                    .accessibilityIdentifier("retry-journal")
            } else { ProgressView() }
        }.padding().frame(maxWidth: 600)
    }
}

struct OptionView: View {
    let option: StayOption
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(option.name).font(.headline)
            if let url = URL(string: option.url), url.scheme == "https" {
                Link("Unterkunft öffnen", destination: url)
            }
            if !option.note.isEmpty { Text(option.note).font(.subheadline) }
        }.padding(.vertical, 6)
    }
}

struct EntryRow: View {
    let entry: JournalEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(entry.text.isEmpty ? "Foto-Erinnerung" : entry.text).lineLimit(3)
            Text("\(displayDate(entry.originalDate)) · \(entry.originalTitle)").font(.caption).foregroundStyle(.secondary)
        }
    }
}
