import SwiftUI
import AVKit

struct AnimationLibrary: View {
    @Environment(AnimationStore.self) private var videos
    @Environment(PlanStore.self) private var plans
    @State private var selecting = false
    @State private var selected: Set<String> = []
    @State private var share: AnimationShare?
    private var trips: [TripPlan] {
        (plans.feed?.trips ?? []).filter { trip in
            trip.id == "trip_adria_2026" || videos.catalog.contains { $0.tripID == trip.id }
        }
    }
    private var selectedAssets: [StageAnimation] {
        trips.flatMap { trip in visibleDays(trip).compactMap { day in
            selected.contains("\(trip.id)/\(day.id)") ? asset(trip, day) : nil
        }}
    }
    private func visibleDays(_ trip: TripPlan) -> [TripDay] {
        trip.days.filter { !$0.rest && !($0.map?.lines.isEmpty ?? true) }
    }
    private var selectableKeys: Set<String> {
        Set(trips.flatMap { trip in visibleDays(trip).compactMap { day in
            asset(trip, day) != nil ? "\(trip.id)/\(day.id)" : nil
        }})
    }
    private func asset(_ trip: TripPlan, _ day: TripDay) -> StageAnimation? {
        videos.available(trip: trip, day: day) ?? videos.saved(tripID: trip.id, stageID: day.id)
    }
    var body: some View {
        List {
            Section {
                Text("Lade die gewünschten Etappen herunter. Danach kannst du sie offline ansehen und teilen.")
                    .font(.subheadline).foregroundStyle(.secondary)
                if !videos.progress.isEmpty || !videos.queue.isEmpty {
                    Text("Lass Roadbook während der Downloads geöffnet.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            ForEach(trips) { trip in
                Section(trip.name) {
                    ForEach(visibleDays(trip)) { day in
                        let movie = asset(trip, day)
                        if selecting {
                            Button {
                                let key = "\(trip.id)/\(day.id)"
                                if selected.contains(key) { selected.remove(key) } else { selected.insert(key) }
                            } label: {
                                HStack {
                                    Image(systemName: selected.contains("\(trip.id)/\(day.id)") ? "checkmark.circle.fill" : "circle")
                                    animationRow(trip, day, movie)
                                }.foregroundStyle(.primary)
                            }.disabled(movie == nil).accessibilityIdentifier("animation-select-stage-\(day.id)")
                        } else if let movie {
                            NavigationLink { AnimationDetail(asset: movie, day: day) } label: {
                                animationRow(trip, day, movie)
                            }.accessibilityIdentifier("animation-stage-\(day.id)")
                        } else {
                            animationRow(trip, day, nil)
                        }
                    }
                }
            }
            if let error = videos.catalogError {
                Section { Text(error).font(.caption).foregroundStyle(.secondary) }
            }
            if let error = videos.storageError {
                Section { Text(error).font(.caption).foregroundStyle(.secondary) }
            }
            Section {
                NavigationLink { AnimationDownloads() } label: {
                    Label("Downloads verwalten · \(ByteCountFormatter.string(fromByteCount: videos.usedBytes, countStyle: .file))", systemImage: "internaldrive")
                }.accessibilityIdentifier("animation-downloads")
                Link("Kartenquellen", destination: URL(string: "https://motorrad-roadbook-spanien-2026.vercel.app/animations/credits.html")!)
                    .font(.caption)
            }
        }
        .navigationTitle("Etappenanimationen")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            Button(selecting ? "Fertig" : "Auswählen") {
                selecting.toggle(); selected.removeAll()
            }.accessibilityIdentifier("animation-select")
        }
        .safeAreaInset(edge: .bottom) {
            if selecting {
                let pending = selectedAssets.filter { videos.localURL($0) == nil }
                let files = selectedAssets.compactMap { videos.localURL($0) }
                VStack(spacing: 10) {
                    ViewThatFits(in: .horizontal) {
                        HStack {
                            selectionCount
                            Spacer()
                            selectAllButton
                        }
                        VStack(spacing: 8) {
                            selectionCount
                            selectAllButton
                        }
                    }
                    if !pending.isEmpty {
                        Button {
                            videos.enqueue(pending)
                            selecting = false; selected.removeAll()
                        } label: {
                            Text("\(pending.count) laden · \(ByteCountFormatter.string(fromByteCount: pending.reduce(0) { $0 + $1.bytes }, countStyle: .file))")
                                .frame(maxWidth: .infinity)
                        }.buttonStyle(.borderedProminent).accessibilityIdentifier("animation-download-selected")
                    }
                    Button { share = AnimationShare(files: files) } label: {
                        Text(pending.isEmpty ? "Auswahl teilen" : "\(files.count) gespeicherte Videos teilen").frame(maxWidth: .infinity)
                    }.buttonStyle(.bordered).disabled(files.isEmpty).accessibilityIdentifier("animation-share-selected")
                }.padding().background(.regularMaterial)
            }
        }
        .task { await videos.refresh() }
        .refreshable { await videos.refresh() }
        .sheet(item: $share) { AnimationShareSheet(files: $0.files) }
    }
    private var selectionCount: some View {
        Text("\(selectedAssets.count) ausgewählt").font(.caption).foregroundStyle(.secondary)
    }
    private var selectAllButton: some View {
        let keys = selectableKeys
        let allSelected = !keys.isEmpty && keys.isSubset(of: selected)
        return Button(allSelected ? "Auswahl aufheben" : "Alle auswählen") {
            selected = allSelected ? [] : keys
        }
        .disabled(keys.isEmpty)
        .accessibilityIdentifier("animation-select-all")
    }
    private func animationRow(_ trip: TripPlan, _ day: TripDay, _ movie: StageAnimation?) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text("Tag \(day.number) · \(displayDate(day.date))").font(.caption).foregroundStyle(.secondary)
            Text(day.title).font(.headline)
            if let movie {
                AnimationStatus(asset: movie)
                if movie.routeFingerprint != videos.fingerprint(trip: trip, day: day) {
                    Text("Gespeichert mit früherem Routenstand").font(.caption).foregroundStyle(.secondary)
                }
            } else {
                Text("Für diese Route noch nicht verfügbar").font(.caption).foregroundStyle(.secondary)
            }
        }.padding(.vertical, 5)
    }
}

private struct AnimationStatus: View {
    @Environment(AnimationStore.self) private var videos
    let asset: StageAnimation
    var body: some View {
        Group {
            if let value = videos.progress[asset.id] {
                ProgressView(value: value) { Text("Wird geladen … \(Int(value * 100)) %") }
            } else if videos.queued(asset) {
                Label("Wartet auf Download", systemImage: "clock")
            } else if videos.localURL(asset) != nil {
                Text("Geladen · \(asset.sizeText)")
                    .accessibilityIdentifier("animation-offline-\(asset.stageID)")
            } else {
                Text("Noch nicht geladen · \(asset.sizeText)")
            }
        }.font(.caption).foregroundStyle(.secondary)
    }
}

struct AnimationDetail: View {
    @Environment(AnimationStore.self) private var videos
    @Environment(\.horizontalSizeClass) private var sizeClass
    let asset: StageAnimation
    var day: TripDay? = nil
    @State private var player: AVPlayer?
    @State private var share: AnimationShare?
    @State private var deleting = false
    private var local: URL? { videos.localURL(asset) }
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    Text(asset.tripName).font(.headline)
                    Text("Tag \(asset.number) · \(displayDate(asset.date))").font(.caption).foregroundStyle(.secondary)
                    Text(asset.title).font(.subheadline)
                }.padding(.vertical, 4)
                if let day, asset.routeFingerprint != StageAnimation.fingerprint(tripID: asset.tripID, day: day) {
                    Label("Dieses Video zeigt einen früheren Routenstand.", systemImage: "info.circle")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            Section {
                if let player, local != nil {
                    VideoPlayer(player: player).aspectRatio(CGFloat(asset.width) / CGFloat(asset.height), contentMode: .fit)
                        .frame(maxHeight: sizeClass == .regular ? 500 : 360)
                        .frame(maxWidth: .infinity).accessibilityLabel("Etappenanimation abspielen")
                    Button { if let local { share = AnimationShare(files: [local]) } } label: {
                        Label("Video teilen", systemImage: "square.and.arrow.up")
                    }.accessibilityIdentifier("animation-share")
                } else if videos.progress[asset.id] != nil || videos.queued(asset) {
                    AnimationStatus(asset: asset)
                    Button("Download abbrechen") { videos.cancel(asset) }
                        .accessibilityIdentifier("animation-cancel")
                } else {
                    Button { videos.enqueue([asset]) } label: {
                        Label("Laden · \(asset.sizeText)", systemImage: "arrow.down.circle")
                    }.accessibilityIdentifier("animation-download")
                }
                if local != nil { AnimationStatus(asset: asset) }
                if let error = videos.failures[asset.id] { Text(error).font(.caption).foregroundStyle(.secondary).accessibilityIdentifier("animation-error") }
            } footer: {
                Text("Geplante Route · Geladene Videos kannst du ohne Internet ansehen. Zum Versenden ist eine Verbindung nötig.")
            }
        }
        .navigationTitle("Etappenanimation").navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if local != nil {
                Menu {
                    Button("Download löschen", role: .destructive) { deleting = true }
                } label: { Image(systemName: "ellipsis") }.accessibilityLabel("Weitere Aktionen")
            }
        }
        .task(id: local) {
            player?.pause()
            player = local.map { AVPlayer(url: $0) }
        }
        .onDisappear { player?.pause() }
        .sheet(item: $share) { AnimationShareSheet(files: $0.files) }
        .confirmationDialog("Download von diesem Gerät löschen?", isPresented: $deleting, titleVisibility: .visible) {
            Button("Download löschen", role: .destructive) { player?.pause(); player = nil; videos.remove(asset) }
        } message: { Text("Dein Tagebuch, Fotos und Reiseplan bleiben erhalten.") }
    }
}

struct JournalAnimationLink: View {
    @Environment(AnimationStore.self) private var videos
    let trip: TripPlan
    let day: TripDay
    var body: some View {
        if let asset = videos.available(trip: trip, day: day) ?? videos.saved(tripID: trip.id, stageID: day.id) {
            NavigationLink { AnimationDetail(asset: asset, day: day) } label: {
                Label {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Etappenanimation")
                        AnimationStatus(asset: asset)
                    }
                } icon: { Image(systemName: "play.rectangle") }
            }.accessibilityIdentifier("journal-animation")
        }
    }
}

private struct AnimationDownloads: View {
    @Environment(AnimationStore.self) private var videos
    var body: some View {
        List {
            if videos.downloads.filter({ videos.localURL($0) != nil }).isEmpty {
                ContentUnavailableView("Noch keine Downloads", systemImage: "arrow.down.circle", description: Text("Wähle unter Etappenanimationen eine Etappe aus."))
            }
            ForEach(videos.downloads.filter { videos.localURL($0) != nil }) { asset in
                NavigationLink { AnimationDetail(asset: asset) } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Tag \(asset.number) · \(asset.title)")
                        Text("\(asset.tripName) · \(asset.sizeText)").font(.caption).foregroundStyle(.secondary)
                    }
                }
            }
            if let error = videos.storageError { Text(error).foregroundStyle(.secondary) }
        }.navigationTitle("Downloads")
    }
}

private struct AnimationShare: Identifiable {
    let id = UUID()
    let files: [URL]
}
private struct AnimationShareSheet: UIViewControllerRepresentable {
    let files: [URL]
    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: files, applicationActivities: nil)
    }
    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
