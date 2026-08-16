(function () {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view") === "roadbook" ? "roadbook" : "overview";

  const bridge = window.__ROADBOOK_READ_MODEL__;
  const modelApi = window.MotorcycleTravelModel;
  const navRoot = document.querySelector("#generic-trip-nav");
  const root = document.querySelector("#trip-overview-root");
  const legacyRoadbook = document.querySelector("#legacy-roadbook");
  if (!bridge || !modelApi || !navRoot || !root || !legacyRoadbook) return;

  const leafletCss = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  const leafletJs = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  const colours = ["#176b46", "#b06024", "#6d58a7", "#26758a", "#b14d55", "#68733b", "#2d67a2", "#9b6515"];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  const hotelIcon = (secondary = false) => `<span class="generic-hotel-icon${secondary ? " secondary" : ""}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5V20M3 20h18M9 20v-4h6v4M8 8h2m4 0h2m-8 4h2m4 0h2"/></svg></span>`;
  const stayMarkerIcon = (L, label, repeatedPlace = false) => {
    const width = Math.max(32, 12 + label.length * 7);
    return L.divIcon({
      className: `generic-stay-marker-shell range${repeatedPlace ? " repeated" : ""}`,
      html: `<span>${escapeHtml(label)}</span>`,
      iconSize: [width, 28],
      iconAnchor: [width / 2, repeatedPlace ? 42 : 14]
    });
  };
  const normalize = (value) => modelApi.normalizeText(value || "");
  const km = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 });
  const formatDate = (value, options = { day: "2-digit", month: "long", year: "numeric" }) => {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-CH", { ...options, timeZone: "UTC" }).format(date);
  };
  const formatDuration = (seconds) => {
    if (!seconds) return "–";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours ? `${hours} h` : ""}${minutes ? ` ${minutes} min` : ""}`.trim();
  };
  const parseCoordinates = (text) => String(text || "").trim().split(/\s+/).map((entry) => {
    const [longitude, latitude] = entry.split(",").map(Number);
    return [latitude, longitude];
  }).filter(([latitude, longitude]) => Number.isFinite(latitude) && Number.isFinite(longitude));

  let model;
  let activeView = "overview";
  let listMode = "days";
  let selectedStage = 0;
  let selectedStay = 0;
  let overviewMap = null;
  let overviewGroups = [];
  let overviewRoutes = new Map();
  let overviewBounds = null;
  let workspaceMap = null;
  let workspaceBounds = null;
  let workspaceRoutes = new Map();
  let workspaceMarkers = [];
  let workspaceInitialised = false;
  let workspaceShowAll = true;
  let compareOriginal = false;
  let inspectorOpen = false;
  let inspectorWindowMode = "detail";
  let inspectorReviewRestoreRect = null;
  let inspectorControlRestoreRect = null;
  let mapDataPromise = null;
  const routeGeometryData = new Map();
  const routeStyleDrafts = new Map();
  const confirmedRouteStyleDrafts = new Set();
  let pendingRouteStyleChange = null;
  let planDraftStatus = { active: false };
  let showPlanDraftDialog = () => {};

  const hydrateRouteStyleDrafts = async () => {
    if (typeof bridge.getRouteStyleDrafts !== "function") return;
    const changes = await bridge.getRouteStyleDrafts();
    (Array.isArray(changes) ? changes : []).forEach((change) => {
      const stageIndex = Number(change.stageIndex);
      if (!Number.isInteger(stageIndex) || !["direct", "scenic"].includes(change.style)) return;
      routeStyleDrafts.set(stageIndex, change.style);
      confirmedRouteStyleDrafts.add(stageIndex);
    });
  };

  const updateDraftChrome = () => {
    const count = confirmedRouteStyleDrafts.size;
    const status = navRoot.querySelector(".generic-status");
    if (status) status.textContent = count ? `Routenentwurf · ${count} ${count === 1 ? "Änderung" : "Änderungen"}` : planStatusLabel();
    const loaded = root.querySelector(".generic-loaded-plan strong");
    if (loaded) loaded.textContent = count || isOriginalDraft() || isPlanDraft() ? "Lokaler Entwurf" : "Online";
  };

  const persistRouteStyle = async (stageIndex, style) => {
    if (typeof bridge.saveRouteStyleDraft !== "function") return;
    const stage = model.revision.stages[stageIndex];
    const route = routeFor(stage);
    const metrics = geometryFor(stageIndex, style === "direct" ? "direct" : "original") || route;
    const result = await bridge.saveRouteStyleDraft({
      stageIndex,
      style,
      distanceMeters: metrics?.distanceMeters || 0,
      durationSeconds: metrics?.durationSeconds || 0
    });
    routeStyleDrafts.clear();
    confirmedRouteStyleDrafts.clear();
    (result?.changes || []).forEach((change) => {
      const index = Number(change.stageIndex);
      if (!Number.isInteger(index)) return;
      routeStyleDrafts.set(index, change.style);
      confirmedRouteStyleDrafts.add(index);
    });
  };

  const place = (id) => model.places.find((item) => item.id === id) || { name: "Unbekannter Ort" };
  const routeFor = (stage) => model.revision.routeVariants.find((item) => item.id === stage.activeRouteVariantId) || null;
  const optionsFor = (stay) => stay.accommodationOptionIds.map((id) => model.revision.accommodationOptions.find((item) => item.id === id)).filter(Boolean);
  const bookingFor = (stay) => model.revision.bookings.find((item) => item.stayId === stay.id) || null;
  const stayForDate = (date) => model.revision.stays.find((item) => item.startDate <= date && item.endDate > date) || null;
  const stageForStay = (stay) => model.revision.stages.findIndex((item) => item.date === stay.startDate);
  const fixedForStage = (stage) => model.revision.fixPoints.find((item) => item.targetRef?.type === "stage" && item.targetRef.id === stage.id) || null;
  const dateRange = () => `${formatDate(model.revision.stages[0].date)} – ${formatDate(model.revision.stages.at(-1).date)}`;
  const bookingLabel = (booking) => booking?.status === "booked" ? "Gebucht" : booking?.status === "requested" ? "Angefragt" : "Offen";
  const bookingClass = (booking) => booking?.status === "booked" ? "booked" : booking?.status === "requested" ? "requested" : "open";
  const parkingLabel = (accommodation, stay) => /fahre|kabine/.test(normalize(`${place(stay?.placeId).name} ${accommodation?.name || ""}`))
    ? "Motorradverladung gemäss Reederei"
    : accommodation?.motorcycleParking === "confirmed" ? "Motorradgarage bestätigt" : "Sichere Abstellung prüfen";
  const travelDayNumber = (stageIndex) => model.revision.stages[stageIndex]?.dayNumber || stageIndex + 1;
  const dayRangeLabel = (startIndex, endIndex = startIndex) => startIndex === endIndex
    ? String(travelDayNumber(startIndex))
    : `${travelDayNumber(startIndex)}–${travelDayNumber(endIndex)}`;
  const dayRangeForStay = (stay) => {
    const startIndex = stageForStay(stay);
    const endIndex = Math.min(model.revision.stages.length - 1, startIndex + Math.max(1, stay.nightCount) - 1);
    return { startIndex, endIndex, label: dayRangeLabel(startIndex, endIndex) };
  };
  const stayMarkerGroups = () => modelApi.groupStayRanges(model.revision.stays, model.revision.stages);
  const isOriginalDraft = () => model?.source?.planKind === "original-draft";
  const isPlanDraft = () => model?.source?.planKind === "plan-draft";
  const planLabel = () => isOriginalDraft() ? "Originalplan" : (isPlanDraft() ? "Planentwurf" : "Aktueller Plan");
  const planStatusLabel = () => isOriginalDraft()
    ? "Originalplan · lokaler Entwurf"
    : (isPlanDraft() ? "Planentwurf · lokal" : "Aktueller Plan · online");
  const planVersionLabel = () => {
    if (isOriginalDraft() || isPlanDraft()) return "Gemeinsamer Plan unverändert";
    const value = model.source?.publishedVersion;
    if (!value) return "Stand unbekannt";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Stand unbekannt" : `Stand ${new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Zurich" }).format(date)}`;
  };
  const routeStyleLabel = (style) => style === "scenic" ? "Kurvig & schön" : "Direkt";
  const googleMapsUrlForSelection = (stage, route) => {
    if (!stage || !route?.providerRouteRef) return null;
    if (selectedRouteStyle(stage, route) !== "direct") return route.providerRouteRef;
    try {
      const url = new URL(route.providerRouteRef);
      url.searchParams.delete("waypoints");
      return url.toString();
    } catch (_error) {
      return route.providerRouteRef;
    }
  };

  const loadLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) { resolve(window.L); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = leafletCss;
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.append(link);
    const script = document.createElement("script");
    script.src = leafletJs;
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
    script.crossOrigin = "";
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Kartenbibliothek konnte nicht geladen werden."));
    document.head.append(script);
  });

  async function loadKml() {
    const response = await fetch("/reiseplanung-verfeinert-2026.kml", { cache: "no-store" });
    if (!response.ok) throw new Error("KML-Korridor konnte nicht geladen werden.");
    return new DOMParser().parseFromString(await response.text(), "application/xml");
  }

  async function loadMapData() {
    if (!mapDataPromise) {
      mapDataPromise = Promise.all([
        loadKml(),
        fetch("/assets/roadbook-routes.geojson", { cache: "no-store" }).then((response) => {
          if (!response.ok) throw new Error("Straßenverlauf konnte nicht geladen werden.");
          return response.json();
        })
      ]).then(([xml, routes]) => ({ xml, routes }));
    }
    return mapDataPromise;
  }

  const leafletCoordinates = (feature) => feature.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]);
  const stageIndexForFeature = (feature) => {
    const day = Number(feature.properties.day);
    const matched = feature.properties.ferry
      ? model.revision.stages.findIndex((stage) => stage.kind === "transport")
      : model.revision.stages.findIndex((stage) => Number(stage.legacy?.day) === day);
    return matched >= 0 ? matched : Math.max(0, day - 1);
  };
  const kmlPoints = (xml) => {
    const points = new Map();
    Array.from(xml.querySelectorAll("Placemark")).forEach((placemark) => {
      const point = placemark.querySelector("Point coordinates");
      if (!point) return;
      const name = placemark.querySelector("name")?.textContent.trim() || "Ort";
      const coordinate = parseCoordinates(point.textContent)[0];
      if (coordinate) points.set(normalize(name), coordinate);
    });
    return points;
  };
  const pointCoordinateFor = (points, placeName, day) => {
    const key = normalize(placeName);
    const tokens = key.split(" ").filter((token) => token.length >= 4 && !["raum", "oder", "vorzugsweise"].includes(token));
    return Array.from(points.entries()).map(([pointName, coordinate]) => {
      const placeScore = tokens.reduce((score, token) => score + (pointName.includes(token) ? token.length : 0), 0);
      const dayText = String(day);
      const dayScore = pointName.includes(`tag ${dayText}`) || pointName.includes(`-${dayText}`) ? 20 : 0;
      return { coordinate, score: placeScore + dayScore };
    }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score)[0]?.coordinate || null;
  };
  const geometryFor = (index, variant) => routeGeometryData.get(`${index}:${variant}`) || null;
  const previewMetricsFor = (index, route) => {
    const style = routeStyleDrafts.get(index);
    if (!style) return route;
    return geometryFor(index, style === "direct" ? "direct" : "original") || route;
  };

  const kmlGroupForName = (name) => {
    const day = Number(String(name).match(/^\s*(\d+)/)?.[1]);
    if (!day) return -1;
    if (day <= 6) return 0;
    if (day <= 16) return 1;
    if (day <= 23) return 2;
    return 3;
  };

  function renderNavigation() {
    navRoot.hidden = false;
    navRoot.innerHTML = `
      <div class="generic-trip-nav-left"><button class="generic-back" id="generic-journeys" type="button"><span aria-hidden="true">←</span> Reisen</button><div class="generic-trip-identity"><strong>${escapeHtml(model.trip.name)}</strong><span>${escapeHtml(dateRange())} · ${model.revision.stages.length} Tage</span></div></div>
      <nav class="generic-trip-tabs" role="tablist" aria-label="Ansicht der Reise"><button class="generic-trip-tab" type="button" role="tab" aria-selected="true" data-generic-view="overview">Übersicht</button><button class="generic-trip-tab" type="button" role="tab" aria-selected="false" data-generic-view="roadbook">Roadbook</button></nav>
      <div class="generic-trip-nav-actions"><span class="generic-status">${escapeHtml(planStatusLabel())}</span><button class="generic-primary" id="generic-adjust" type="button">${isOriginalDraft() ? "Originalplan prüfen" : (isPlanDraft() ? "Entwurf prüfen" : "Reise anpassen")}</button><div class="generic-more"><button class="generic-more-button" id="generic-more" type="button" aria-label="Weitere Aktionen" aria-expanded="false">•••</button><div class="generic-more-menu" id="generic-more-menu" hidden><button type="button" id="generic-export">Exportieren</button><button type="button" id="generic-accommodations">Unterkünfte</button><button type="button" id="generic-help">Hilfe</button><button type="button" id="generic-original-plan">${isOriginalDraft() ? "Originalplan verwalten" : "Originalplan laden"}</button></div></div></div>`;

    const dialog = document.createElement("dialog");
    dialog.className = "generic-journeys-dialog";
    dialog.id = "generic-journeys-dialog";
    dialog.innerHTML = `<div class="generic-dialog-head"><div><h2>Reisen</h2><p>Bestehende Reise öffnen oder später eine neue Motorradreise planen.</p></div><button class="generic-dialog-close" type="button" aria-label="Dialog schließen">×</button></div><div class="generic-journey-row"><div><strong>${escapeHtml(model.trip.name)}</strong><span>${escapeHtml(dateRange())} · ${model.revision.stages.length} Tage</span></div><button class="generic-secondary" type="button">Geöffnet</button></div><div class="generic-dialog-foot"><span>Die generische Neuerstellung folgt in einem späteren Integrationsschritt.</span><button class="generic-secondary" type="button" disabled>Neue Reise planen</button></div>`;
    document.body.append(dialog);
    dialog.querySelector(".generic-dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".generic-journey-row button").addEventListener("click", () => dialog.close());
    navRoot.querySelector("#generic-journeys").addEventListener("click", () => dialog.showModal());
    const exportDialog = document.createElement("dialog");
    exportDialog.className = "generic-journeys-dialog generic-export-dialog";
    exportDialog.id = "generic-export-dialog";
    exportDialog.innerHTML = `<div class="generic-dialog-head"><div><h2>Route exportieren</h2><p>Die gewählte Tagesroute in Google Maps öffnen oder die gesamte Reise als Datei laden.</p></div><button class="generic-dialog-close" type="button" aria-label="Export schließen">×</button></div><div class="generic-export-options"><a class="generic-action-button primary" id="generic-export-google" target="_blank" rel="noopener">Tagesroute in Google Maps öffnen ↗</a><span id="generic-export-day"></span><a class="generic-action-button" href="/reiseplanung-verfeinert-2026-export.kml" download>Gesamtreise als KML</a><a class="generic-action-button" href="/reiseplanung-verfeinert-2026.gpx" download>Gesamtreise als GPX</a></div>`;
    document.body.append(exportDialog);
    exportDialog.querySelector(".generic-dialog-close").addEventListener("click", () => exportDialog.close());
    const originalDialog = document.createElement("dialog");
    originalDialog.className = "generic-journeys-dialog generic-original-dialog";
    originalDialog.id = "generic-original-dialog";
    const renderOriginalDialog = () => {
      const active = isOriginalDraft();
      originalDialog.innerHTML = active
        ? `<div class="generic-dialog-head"><div><h2>Originalplan bereit</h2><p>Route und Unterkünfte werden jetzt als lokaler Entwurf angezeigt.</p></div><button class="generic-dialog-close" type="button" aria-label="Originalplan schließen">×</button></div><div class="generic-original-copy"><strong>Der gemeinsame Plan ist noch unverändert.</strong><p>Prüfe den Originalplan in Übersicht und Roadbook. Veröffentlicht wird er erst nach PIN-Eingabe.</p><p class="generic-original-feedback" aria-live="polite"></p></div><div class="generic-dialog-foot generic-original-actions"><button class="generic-secondary" id="generic-original-discard" type="button">Beim aktuellen Plan bleiben</button><button class="generic-secondary" id="generic-original-review" type="button">Weiter prüfen</button><button class="generic-primary" id="generic-original-publish" type="button">Originalplan veröffentlichen</button></div>`
        : `<div class="generic-dialog-head"><div><h2>Originalplan laden?</h2><p>Der festgelegte Rückfallplan wird zuerst nur auf diesem Gerät geladen.</p></div><button class="generic-dialog-close" type="button" aria-label="Originalplan schließen">×</button></div><div class="generic-original-copy"><strong>Der gemeinsame Plan bleibt unverändert.</strong><p>Nach dem Laden kannst du Route und Unterkünfte prüfen und den Entwurf wieder verwerfen.</p><p class="generic-original-feedback" aria-live="polite"></p></div><div class="generic-dialog-foot generic-original-actions"><button class="generic-secondary" id="generic-original-cancel" type="button">Abbrechen</button><button class="generic-primary" id="generic-original-load" type="button">Als Entwurf laden</button></div>`;
      originalDialog.querySelector(".generic-dialog-close").addEventListener("click", () => originalDialog.close());
      originalDialog.querySelector("#generic-original-cancel")?.addEventListener("click", () => originalDialog.close());
      originalDialog.querySelector("#generic-original-review")?.addEventListener("click", () => originalDialog.close());
      originalDialog.querySelector("#generic-original-load")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const feedback = originalDialog.querySelector(".generic-original-feedback");
        button.disabled = true;
        button.textContent = "Wird geladen …";
        try {
          const result = await bridge.loadOriginalDraft?.();
          if (!result?.loaded) throw new Error("Der Entwurf konnte nicht angelegt werden.");
          const target = new URL(window.location.href);
          target.searchParams.set("originalDraft", "ready");
          window.location.href = target.toString();
        } catch (error) {
          feedback.textContent = `Originalplan konnte nicht geladen werden: ${error.message}`;
          button.disabled = false;
          button.textContent = "Als Entwurf laden";
        }
      });
      originalDialog.querySelector("#generic-original-discard")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Wird zurückgesetzt …";
        const result = await bridge.discardOriginalDraft?.();
        if (result?.discarded) window.location.reload();
        else {
          originalDialog.querySelector(".generic-original-feedback").textContent = "Der aktuelle Plan konnte nicht wiederhergestellt werden.";
          button.disabled = false;
          button.textContent = "Beim aktuellen Plan bleiben";
        }
      });
      originalDialog.querySelector("#generic-original-publish")?.addEventListener("click", async (event) => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Veröffentlichung wird vorbereitet …";
        const result = await bridge.publishOriginalDraft?.();
        if (result?.published) window.location.reload();
        else {
          button.disabled = false;
          button.textContent = "Originalplan veröffentlichen";
        }
      });
    };
    const showOriginalDialog = () => {
      renderOriginalDialog();
      originalDialog.showModal();
    };
    document.body.append(originalDialog);
    const planDraftDialog = document.createElement("dialog");
    planDraftDialog.className = "generic-journeys-dialog generic-original-dialog";
    planDraftDialog.id = "generic-plan-draft-dialog";
    const renderPlanDraftDialog = () => {
      const routeReady = planDraftStatus.phase === "route";
      const summary = (planDraftStatus.summary || []).slice(0, 6);
      planDraftDialog.innerHTML = `<div class="generic-dialog-head"><div><h2>Planentwurf prüfen</h2><p>${routeReady ? "Die Route ist geprüft. Als Nächstes werden die passenden Unterkünfte abgeglichen." : "Route und Unterkünfte sind geprüft. Erst die Veröffentlichung ändert den gemeinsamen Plan."}</p></div><button class="generic-dialog-close" type="button" aria-label="Planentwurf schließen">×</button></div><div class="generic-original-copy"><strong>Der gemeinsame Plan ist unverändert.</strong>${summary.length ? `<ul class="generic-draft-summary">${summary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}<p class="generic-original-feedback" aria-live="polite"></p></div><div class="generic-dialog-foot generic-original-actions"><button class="generic-secondary" id="generic-plan-draft-discard" type="button">Entwurf verwerfen</button><button class="generic-secondary" id="generic-plan-draft-review" type="button">Im Roadbook prüfen</button><button class="generic-primary" id="generic-plan-draft-next" type="button">${routeReady ? "Unterkünfte erstellen" : "Plan veröffentlichen"}</button></div>`;
      planDraftDialog.querySelector(".generic-dialog-close").addEventListener("click", () => planDraftDialog.close());
      planDraftDialog.querySelector("#generic-plan-draft-review").addEventListener("click", () => { planDraftDialog.close(); setView("roadbook"); });
      planDraftDialog.querySelector("#generic-plan-draft-discard").addEventListener("click", async (event) => {
        if (!confirm("Diesen Entwurf verwerfen und wieder den aktuellen Online-Plan anzeigen?")) return;
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Wird verworfen …";
        const result = await bridge.discardPlanDraft?.();
        if (result?.discarded) window.location.reload();
      });
      planDraftDialog.querySelector("#generic-plan-draft-next").addEventListener("click", async (event) => {
        const button = event.currentTarget;
        const feedback = planDraftDialog.querySelector(".generic-original-feedback");
        button.disabled = true;
        button.textContent = routeReady ? "Unterkünfte werden erstellt …" : "Veröffentlichung wird vorbereitet …";
        const result = await bridge.advancePlanDraft?.();
        if (result?.published || (routeReady && result?.phase === "complete")) window.location.reload();
        else {
          feedback.textContent = routeReady ? "Die Unterkünfte konnten noch nicht erstellt werden. Der Routenentwurf bleibt erhalten." : "Der Entwurf wurde nicht veröffentlicht und bleibt erhalten.";
          button.disabled = false;
          button.textContent = routeReady ? "Unterkünfte erneut erstellen" : "Plan veröffentlichen";
        }
      });
    };
    showPlanDraftDialog = () => {
      renderPlanDraftDialog();
      planDraftDialog.showModal();
    };
    document.body.append(planDraftDialog);
    navRoot.querySelectorAll("[data-generic-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.genericView)));
    navRoot.querySelector("#generic-adjust").addEventListener("click", () => isOriginalDraft() ? showOriginalDialog() : (isPlanDraft() ? showPlanDraftDialog() : openExistingPlanner()));
    const moreButton = navRoot.querySelector("#generic-more");
    const moreMenu = navRoot.querySelector("#generic-more-menu");
    const closeMore = () => { moreMenu.hidden = true; moreButton.setAttribute("aria-expanded", "false"); };
    navRoot.querySelector("#generic-export").addEventListener("click", () => {
      const stage = model.revision.stages[selectedStage];
      const route = routeFor(stage);
      const selectedStyle = selectedRouteStyle(stage, route);
      const googleMapsUrl = googleMapsUrlForSelection(stage, route);
      const googleLink = exportDialog.querySelector("#generic-export-google");
      googleLink.href = googleMapsUrl || "#";
      googleLink.setAttribute("aria-disabled", String(!googleMapsUrl));
      exportDialog.querySelector("#generic-export-day").textContent = `Tag ${travelDayNumber(selectedStage)} · ${stage.title} · ${routeStyleLabel(selectedStyle)} ausgewählt. Google Maps berechnet den Verlauf beim Öffnen neu.`;
      exportDialog.showModal();
      closeMore();
    });
    navRoot.querySelector("#generic-accommodations").addEventListener("click", () => { setView("roadbook"); setListMode("stays"); closeMore(); });
    navRoot.querySelector("#generic-help").addEventListener("click", () => { document.querySelector("#nav-help")?.click(); closeMore(); });
    navRoot.querySelector("#generic-original-plan").addEventListener("click", () => {
      closeMore();
      showOriginalDialog();
    });
    moreButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = moreMenu.hidden;
      moreMenu.hidden = !open;
      moreButton.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (event) => { if (!event.target.closest(".generic-more")) closeMore(); });
    if (isOriginalDraft() && params.get("originalDraft") === "ready") {
      const readyUrl = new URL(window.location.href);
      readyUrl.searchParams.delete("originalDraft");
      history.replaceState(null, "", readyUrl);
      window.setTimeout(showOriginalDialog, 0);
    }
  }

  function renderOverview() {
    const { trip, revision } = model;
    const totalDistance = revision.routeVariants.reduce((sum, route) => sum + route.distanceMeters, 0) / 1000;
    const rideCount = revision.stages.filter((stage) => ["ride", "loop"].includes(stage.kind)).length;
    const restCount = revision.stages.filter((stage) => stage.kind === "rest").length;
    const booked = revision.bookings.filter((booking) => booking.status === "booked").length;
    const requested = revision.bookings.filter((booking) => booking.status === "requested").length;
    const open = Math.max(0, revision.stays.length - booked - requested);
    root.innerHTML = `${isOriginalDraft() ? `<section class="generic-original-draft-banner" aria-label="Aktionen für den Originalplan"><div><strong>Originalplan als Entwurf geladen</strong><span>Der gemeinsame Plan bleibt unverändert, bis du ihn veröffentlichst.</span><small class="generic-original-bar-feedback" aria-live="polite"></small></div><div><button class="generic-secondary" id="generic-original-bar-discard" type="button">Beim aktuellen Plan bleiben</button><button class="generic-primary" id="generic-original-bar-publish" type="button">Originalplan veröffentlichen</button></div></section>` : (isPlanDraft() ? `<section class="generic-original-draft-banner generic-plan-draft-banner" aria-label="Aktionen für den Planentwurf"><div><strong>Planentwurf wird lokal angezeigt</strong><span>Der gemeinsame Plan bleibt unverändert, bis du ihn veröffentlichst.</span></div><div><button class="generic-secondary" id="generic-plan-bar-discard" type="button">Entwurf verwerfen</button><button class="generic-primary" id="generic-plan-bar-review" type="button">Entwurf prüfen</button></div></section>` : "")}<section id="generic-overview-panel">
      <section class="generic-overview-heading" aria-labelledby="generic-overview-title"><div><span class="generic-eyebrow">Charakter der Reise</span><h1 id="generic-overview-title">Kurven, Küsten und spanisches Hinterland</h1><p>Eine ausgedehnte Motorradreise von den Westalpen über Südfrankreich bis nach Andalusien. Kurvige Berg- und Küstenstraßen wechseln sich mit entspannten Ruhetagen ab; die gebuchte Fähre von Barcelona nach Genua setzt den festen Schlusspunkt in Spanien.</p></div><div class="generic-overview-date">${escapeHtml(planLabel())} · ${(isOriginalDraft() || isPlanDraft()) ? "lokaler Entwurf" : "online"}<strong>${escapeHtml(dateRange())}</strong><span>${escapeHtml(planVersionLabel())}</span></div></section>
      <section class="generic-route-card" aria-label="Karte und Reiseverlauf"><div class="generic-map-wrap"><div id="trip-overview-map" aria-label="Interaktive Übersichtskarte"></div><div class="generic-map-loading">Karte und aktuelle Route werden geladen …</div><span class="generic-map-label" id="generic-overview-map-label">${escapeHtml(planLabel())} · dieselbe Route wie im Roadbook</span><button class="generic-map-reset" id="generic-map-reset" type="button">Gesamte Route</button></div><div class="generic-route-story"><h2>Reiseverlauf</h2><p>Karte und Beschreibung sind miteinander verbunden.</p>${revision.narrativeSegments.map((segment, index) => `<button class="generic-story-segment" type="button" data-story="${index}" aria-current="false"><strong>${escapeHtml(segment.title)}</strong>${escapeHtml(segment.text)}</button>`).join("")}</div></section>
      <section class="generic-overview-stats" aria-label="Eckdaten"><div class="generic-overview-stat"><strong>${revision.stages.length} Tage</strong><span>Gesamtdauer</span></div><div class="generic-overview-stat"><strong>${rideCount}</strong><span>Fahretappen</span></div><div class="generic-overview-stat"><strong>${restCount}</strong><span>Ruhetage</span></div><div class="generic-overview-stat"><strong>${km.format(totalDistance)} km</strong><span>Planwerte</span></div><div class="generic-overview-stat"><strong>${trip.motorcycleCount} Motorräder</strong><span>Reiseparameter</span></div></section>
      <section class="generic-overview-details"><article class="generic-overview-card"><div class="generic-card-head"><h2>Fixpunkte</h2><span>Automatisch geschützt</span></div><ul class="generic-fix-list">${revision.fixPoints.map((fix) => `<li><span class="generic-fix-icon">${fix.kind === "transport" ? "⚓" : fix.kind === "start" ? "●" : "◎"}</span><span><strong>${escapeHtml(fix.title)}</strong><small>${escapeHtml(fix.startsAt ? formatDate(fix.startsAt.slice(0, 10)) : "Verbindlich")}</small></span><span class="generic-fix-tag">Geschützt</span></li>`).join("")}</ul></article><article class="generic-overview-card"><div class="generic-card-head"><h2>Unterkünfte</h2><span>${revision.stays.length} Stopps</span></div><div class="generic-booking-stats"><div><strong>${booked}</strong><span>Gebucht</span></div><div><strong>${requested}</strong><span>Angefragt</span></div><div><strong>${open}</strong><span>Offen</span></div></div><p class="generic-card-note">Unterkünfte, Alternativen und Buchungsstatus sind direkt mit dem Roadbook verbunden.</p><button class="generic-secondary" id="generic-overview-stays" type="button">Unterkünfte im Roadbook ansehen</button></article></section>
    </section><section class="generic-workspace" id="generic-workspace" hidden></section>`;
    root.querySelectorAll(".generic-story-segment").forEach((button) => button.addEventListener("click", () => activateOverviewStory(Number(button.dataset.story), true)));
    root.querySelector("#generic-overview-stays").addEventListener("click", () => { setView("roadbook"); setListMode("stays"); });
    root.querySelector("#generic-plan-bar-review")?.addEventListener("click", () => showPlanDraftDialog());
    root.querySelector("#generic-plan-bar-discard")?.addEventListener("click", async () => {
      if (!confirm("Diesen Entwurf verwerfen und wieder den aktuellen Online-Plan anzeigen?")) return;
      const result = await bridge.discardPlanDraft?.();
      if (result?.discarded) window.location.reload();
    });
    root.querySelector("#generic-original-bar-discard")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const feedback = root.querySelector(".generic-original-bar-feedback");
      button.disabled = true;
      button.textContent = "Wird zurückgesetzt …";
      const result = await bridge.discardOriginalDraft?.();
      if (result?.discarded) window.location.reload();
      else {
        feedback.textContent = "Der aktuelle Plan konnte nicht wiederhergestellt werden.";
        button.disabled = false;
        button.textContent = "Beim aktuellen Plan bleiben";
      }
    });
    root.querySelector("#generic-original-bar-publish")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Veröffentlichung wird vorbereitet …";
      const result = await bridge.publishOriginalDraft?.();
      if (result?.published) window.location.reload();
      else {
        button.disabled = false;
        button.textContent = "Originalplan veröffentlichen";
      }
    });
    renderWorkspace();
    initialiseOverviewMap(revision.narrativeSegments);
  }

  async function initialiseOverviewMap(narrativeSegments) {
    const loading = root.querySelector(".generic-map-loading");
    try {
      const [L, { xml, routes }] = await Promise.all([loadLeaflet(), loadMapData()]);
      overviewMap = L.map("trip-overview-map", { zoomControl: true, scrollWheelZoom: true }).setView([42.2, 2.1], 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(overviewMap);
      overviewGroups = narrativeSegments.map(() => L.featureGroup().addTo(overviewMap));
      overviewRoutes = new Map();
      const allRoutes = L.featureGroup().addTo(overviewMap);
      const overviewDayEnds = new Map();
      routes.features.filter((feature) => !feature.properties.optional && !(feature.properties.ferry && feature.properties.variant === "direct")).forEach((feature) => {
        const { name, ferry, variant } = feature.properties;
        const groupIndex = kmlGroupForName(name);
        if (groupIndex < 0 || !overviewGroups[groupIndex]) return;
        const index = stageIndexForFeature(feature);
        routeGeometryData.set(`${index}:${variant}`, feature.properties);
        const polyline = L.polyline(leafletCoordinates(feature), { className: `generic-route-line route-${variant} route-stage-${index}`, color: ferry ? "#9a6118" : colours[index % colours.length], weight: ferry ? 4 : 5, opacity: .9, dashArray: ferry ? "9 8" : variant === "direct" ? "9 7" : null, lineCap: "round", isFerry: ferry }).bindTooltip(`Tag ${travelDayNumber(index)} · ${model.revision.stages[index]?.title || name}`, { sticky: true });
        polyline.on("click", () => activateOverviewStory(groupIndex, true));
        if (!overviewRoutes.has(index)) overviewRoutes.set(index, { groupIndex, original: null, direct: null });
        overviewRoutes.get(index)[variant] = polyline;
        if (variant === "original") {
          overviewGroups[groupIndex].addLayer(polyline);
          allRoutes.addLayer(polyline);
          overviewDayEnds.set(index, leafletCoordinates(feature).at(-1));
        }
      });
      const points = kmlPoints(xml);
      stayMarkerGroups().forEach((group) => {
        const first = group.stays[0];
        const name = place(group.placeId).name;
        const legacyDay = model.revision.stages[first.startIndex]?.legacy?.day || travelDayNumber(first.startIndex);
        const labels = group.stays.map((entry) => entry.label);
        const markerLabel = group.label;
        let coordinate = pointCoordinateFor(points, name, legacyDay) || overviewDayEnds.get(first.startIndex);
        for (let offset = 1; !coordinate && offset <= 4; offset += 1) {
          coordinate = overviewDayEnds.get(first.startIndex - offset) || overviewDayEnds.get(first.startIndex + offset);
        }
        if (!coordinate) return;
        const icon = stayMarkerIcon(L, markerLabel, group.stays.length > 1);
        L.marker(coordinate, { icon, zIndexOffset: 500 }).bindTooltip(`Tag ${labels.join(" und ")} · ${name}`).on("click", () => { setView("roadbook"); selectStay(first.stayIndex, true); }).addTo(overviewMap);
      });
      const finalIndex = model.revision.stages.length - 1;
      const finalCoordinate = overviewDayEnds.get(finalIndex);
      if (finalCoordinate) {
        const finalStage = model.revision.stages[finalIndex];
        const finalLabel = String(travelDayNumber(finalIndex));
        const icon = L.divIcon({ className: "generic-stay-marker-shell final", html: `<span>${finalLabel}</span>`, iconSize: [28, 28], iconAnchor: [14, 14] });
        L.marker(finalCoordinate, { icon, zIndexOffset: 510 }).bindTooltip(`Tag ${finalLabel} · ${finalStage.title}`).on("click", () => { setView("roadbook"); selectStage(finalIndex, true); }).addTo(overviewMap);
      }
      overviewBounds = allRoutes.getBounds();
      loading?.remove();
      applyOverviewRouteStyles();
      showOverviewFullRoute(true);
      root.querySelector("#generic-map-reset")?.addEventListener("click", () => showOverviewFullRoute(true));
    } catch (error) {
      if (loading) loading.outerHTML = `<div class="generic-map-fallback"><div><strong>Karte momentan nicht verfügbar</strong><br>${escapeHtml(error.message)}</div></div>`;
    }
  }

  function activateOverviewStory(index, fit) {
    root.querySelectorAll(".generic-story-segment").forEach((button) => button.setAttribute("aria-current", String(Number(button.dataset.story) === Number(index))));
    overviewGroups.forEach((group, groupIndex) => group.eachLayer((layer) => {
      const ferry = Boolean(layer.options.isFerry);
      const match = String(layer.options.className || "").match(/route-stage-(\d+)/);
      const stageIndex = Number(match?.[1] || 0);
      layer.setStyle({ color: ferry ? "#9a6118" : groupIndex === index ? colours[stageIndex % colours.length] : "#718078", weight: groupIndex === index ? 7 : 3, opacity: groupIndex === index ? .95 : .22 });
    }));
    if (fit && overviewGroups[index]?.getBounds().isValid()) overviewMap.fitBounds(overviewGroups[index].getBounds(), { padding: [30, 30], maxZoom: 7 });
  }

  function showOverviewFullRoute(fit) {
    root.querySelectorAll(".generic-story-segment").forEach((button) => button.setAttribute("aria-current", "false"));
    overviewGroups.forEach((group) => group.eachLayer((layer) => {
      const match = String(layer.options.className || "").match(/route-stage-(\d+)/);
      const index = Number(match?.[1] || 0);
      layer.setStyle({ color: layer.options.isFerry ? "#9a6118" : colours[index % colours.length], weight: 5, opacity: .9 });
    }));
    if (!fit || !overviewBounds?.isValid()) return;
    window.requestAnimationFrame(() => {
      overviewMap.invalidateSize();
      overviewMap.fitBounds(overviewBounds, { padding: [24, 24] });
    });
  }

  function applyOverviewRouteStyles() {
    if (!overviewMap || !overviewRoutes.size) return;
    overviewRoutes.forEach((variants, index) => {
      const group = overviewGroups[variants.groupIndex];
      const useDirect = confirmedRouteStyleDrafts.has(index) && routeStyleDrafts.get(index) === "direct";
      const desired = useDirect ? variants.direct : variants.original;
      const hidden = useDirect ? variants.original : variants.direct;
      if (hidden && group.hasLayer(hidden)) group.removeLayer(hidden);
      if (desired && !group.hasLayer(desired)) group.addLayer(desired);
    });
    const changeCount = confirmedRouteStyleDrafts.size;
    const label = root.querySelector("#generic-overview-map-label");
    if (label) label.textContent = changeCount
      ? `Roadbook-Entwurf · ${changeCount} ${changeCount === 1 ? "Routenänderung" : "Routenänderungen"}`
      : `${planLabel()} · dieselbe Route wie im Roadbook`;
    const activeStory = root.querySelector(".generic-story-segment[aria-current='true']");
    if (activeStory) activateOverviewStory(Number(activeStory.dataset.story), false);
  }

  function renderWorkspace() {
    const workspace = root.querySelector("#generic-workspace");
    const allRoutesUrl = new URL(window.location.href);
    allRoutesUrl.searchParams.set("view", "roadbook");
    allRoutesUrl.searchParams.set("map", "all");
    workspace.innerHTML = `<section class="generic-stage-panel" aria-labelledby="generic-list-title"><div class="generic-panel-head"><div class="generic-panel-title"><h2 id="generic-list-title">Reiseplan</h2><span id="generic-list-meta"></span></div><div class="generic-loaded-plan"><span>${escapeHtml(planLabel())}</span><strong>${isOriginalDraft() ? "Lokaler Entwurf" : "Online"}</strong><small>${escapeHtml(planVersionLabel())}</small></div><div class="generic-plan-switch" role="tablist" aria-label="Reiseplan-Ansicht"><button type="button" role="tab" aria-selected="true" data-list-mode="days">Tage <span>${model.revision.stages.length}</span></button><button type="button" role="tab" aria-selected="false" data-list-mode="stays">Unterkünfte <span>${model.revision.stays.length}</span></button></div><a class="generic-show-all-route" href="${escapeHtml(allRoutesUrl.toString())}">Gesamte Route auf Karte</a></div><div class="generic-stage-list" id="generic-stage-list"></div></section>
      <section class="generic-work-map" aria-label="Interaktive Routenkarte"><div id="generic-work-map"></div><div class="generic-work-map-toolbar"><div class="generic-work-map-status"><strong id="generic-work-map-title">Gesamte Route</strong><span id="generic-work-map-subtitle">Alle Etappen der Reise.</span></div><div class="generic-work-map-actions"><button class="generic-compare" type="button" aria-pressed="false" disabled title="Verfügbar, sobald für diese Etappe eine Routenvorschau erstellt wurde"><span>Original vergleichen</span><i aria-hidden="true"></i></button></div></div><div class="generic-work-map-legend"><span><i class="route"></i>Tagesetappe</span><span><i class="stay"></i>Übernachtung</span><span>◆ Ruhetag</span><span>🔒 Fixpunkt</span><span class="generic-compare-legend" id="generic-compare-legend" hidden></span></div><div class="generic-map-hint">Ort oder Strecke anklicken, um Details zu sehen</div></section>
      <aside class="generic-inspector" id="generic-inspector" aria-live="polite" aria-label="Auswahldetails"></aside>`;
    workspace.querySelectorAll("[data-list-mode]").forEach((button) => button.addEventListener("click", () => setListMode(button.dataset.listMode)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && inspectorOpen && !document.querySelector("dialog[open]")) {
        if (pendingRouteStyleChange) cancelPendingRouteStyleChange();
        else closeInspector();
      }
    });
    window.addEventListener("resize", syncInspectorState);
    workspace.querySelector(".generic-compare").addEventListener("click", () => {
      if (listMode !== "days" || !routeStyleDrafts.has(selectedStage)) return;
      compareOriginal = !compareOriginal;
      updateCompareControl();
      applyWorkspaceMapFocus(false);
    });
    renderWorkList();
    renderInspector();
    syncInspectorState();
  }

  function setListMode(mode) {
    if (pendingRouteStyleChange) cancelPendingRouteStyleChange();
    listMode = mode === "stays" ? "stays" : "days";
    workspaceShowAll = false;
    compareOriginal = false;
    closeInspector();
    root.querySelectorAll("[data-list-mode]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.listMode === listMode)));
    renderWorkList();
    renderInspector();
    updateCompareControl();
    applyWorkspaceMapFocus(true);
  }

  function syncInspectorState() {
    const workspace = root.querySelector("#generic-workspace");
    const inspector = root.querySelector("#generic-inspector");
    if (!workspace || !inspector) return;
    workspace.classList.toggle("is-inspector-open", inspectorOpen);
    document.body.classList.remove("generic-compact-workspace");
    inspector.setAttribute("aria-hidden", String(!inspectorOpen));
    if (inspectorOpen) window.requestAnimationFrame(() => constrainInspectorWindow());
  }

  function openInspector() {
    inspectorOpen = true;
    const inspector = root.querySelector("#generic-inspector");
    if (inspector?.classList.contains("is-minimized")) {
      inspector.classList.remove("is-minimized");
      setInspectorRect(inspectorControlRestoreRect || defaultInspectorRect());
      inspectorControlRestoreRect = null;
    }
    if (inspector && !inspector.style.width) setInspectorRect(savedInspectorRect() || defaultInspectorRect());
    syncInspectorState();
    window.setTimeout(() => workspaceMap?.invalidateSize(), 220);
  }

  function closeInspector() {
    const inspector = root.querySelector("#generic-inspector");
    if (inspector?.contains(document.activeElement)) {
      const returnTarget = listMode === "stays"
        ? root.querySelector(`[data-stay-index="${selectedStay}"]`)
        : root.querySelector(`[data-stage-index="${selectedStage}"]`);
      returnTarget?.focus();
    }
    inspectorOpen = false;
    syncInspectorState();
    window.setTimeout(() => workspaceMap?.invalidateSize(), 220);
  }

  function inspectorMapBounds() {
    const workspace = root.querySelector("#generic-workspace");
    const map = root.querySelector(".generic-work-map");
    if (!workspace || !map) return null;
    const workspaceBounds = workspace.getBoundingClientRect();
    const mapBounds = map.getBoundingClientRect();
    return {
      left: mapBounds.left - workspaceBounds.left,
      top: mapBounds.top - workspaceBounds.top,
      width: mapBounds.width,
      height: mapBounds.height
    };
  }

  function currentInspectorRect() {
    const inspector = root.querySelector("#generic-inspector");
    const workspace = root.querySelector("#generic-workspace");
    if (!inspector || !workspace) return null;
    const rect = inspector.getBoundingClientRect();
    const parent = workspace.getBoundingClientRect();
    return { x: rect.left - parent.left, y: rect.top - parent.top, width: rect.width, height: rect.height };
  }

  function setInspectorRect(rect, persist = false) {
    const inspector = root.querySelector("#generic-inspector");
    const map = inspectorMapBounds();
    if (!inspector || !map) return;
    const margin = 10;
    const maxWidth = Math.max(280, map.width - margin * 2);
    const fullMapHeight = Math.max(120, map.height - margin * 2);
    const maxHeight = inspector.classList.contains("is-maximized") || inspectorWindowMode === "review"
      ? fullMapHeight
      : Math.max(220, Math.min(fullMapHeight, map.height * .82));
    const width = Math.min(Math.max(280, rect.width), maxWidth);
    const minimumHeight = inspector.classList.contains("is-minimized") ? 48 : inspectorWindowMode === "review" ? 132 : 180;
    const height = Math.min(Math.max(minimumHeight, rect.height), maxHeight);
    const x = Math.min(Math.max(map.left + margin, rect.x), map.left + map.width - width - margin);
    const y = Math.min(Math.max(map.top + margin, rect.y), map.top + map.height - height - margin);
    Object.assign(inspector.style, { left: `${Math.round(x)}px`, top: `${Math.round(y)}px`, width: `${Math.round(width)}px`, height: `${Math.round(height)}px` });
    if (persist && inspectorWindowMode === "detail" && !inspector.classList.contains("is-minimized") && !inspector.classList.contains("is-maximized")) {
      try { localStorage.setItem("spanien-roadbook-detail-window", JSON.stringify({ x, y, width, height })); } catch (_) { /* Browser-Speicher ist optional. */ }
    }
  }

  function defaultInspectorRect() {
    const map = inspectorMapBounds();
    if (!map) return { x: 0, y: 0, width: 360, height: 560 };
    const width = Math.min(380, Math.max(280, map.width - 20));
    const height = Math.min(560, Math.max(220, map.height * .76));
    return { x: map.left + map.width - width - 14, y: map.top + 14, width, height };
  }

  function savedInspectorRect() {
    try {
      const value = JSON.parse(localStorage.getItem("spanien-roadbook-detail-window") || "null");
      return value && [value.x, value.y, value.width, value.height].every(Number.isFinite) ? value : null;
    } catch (_) {
      return null;
    }
  }

  function constrainInspectorWindow() {
    const inspector = root.querySelector("#generic-inspector");
    if (!inspector || !inspectorOpen) return;
    if (inspectorWindowMode === "review") {
      const map = inspectorMapBounds();
      if (!map) return;
      const width = Math.min(560, Math.max(280, map.width - 20));
      const desiredHeight = map.width <= 900 ? 240 : 190;
      const height = Math.min(desiredHeight, Math.max(132, map.height - 20));
      setInspectorRect({ x: map.left + map.width - width - 10, y: map.top + 10, width, height });
      return;
    }
    const current = currentInspectorRect();
    setInspectorRect(inspector.style.width && current?.width > 100 ? current : savedInspectorRect() || defaultInspectorRect());
  }

  function inspectorChrome(label) {
    return `<div class="generic-inspector-windowbar" data-inspector-drag><strong>${escapeHtml(label)}</strong><span>Verschieben</span><div class="generic-inspector-window-actions"><button type="button" data-inspector-minimize aria-label="Detailfenster minimieren" title="Minimieren">−</button><button type="button" data-inspector-maximize aria-label="Detailfenster vergrössern" title="Vergrössern">□</button><button type="button" data-inspector-close aria-label="Detailfenster schliessen" title="Schliessen">×</button></div></div>`;
  }

  function attachInspectorWindowInteractions() {
    const inspector = root.querySelector("#generic-inspector");
    const dragHandle = inspector?.querySelector("[data-inspector-drag]");
    const resizeHandle = inspector?.querySelector("[data-inspector-resize]");
    if (!inspector || !dragHandle) return;
    const startPointerAction = (event, mode) => {
      if (event.target.closest("button")) return;
      event.preventDefault();
      const start = currentInspectorRect();
      if (!start) return;
      inspector.classList.remove("is-maximized", "is-minimized");
      const pointerId = event.pointerId;
      const originX = event.clientX;
      const originY = event.clientY;
      event.currentTarget.setPointerCapture?.(pointerId);
      const move = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId) return;
        const dx = moveEvent.clientX - originX;
        const dy = moveEvent.clientY - originY;
        setInspectorRect(mode === "drag"
          ? { ...start, x: start.x + dx, y: start.y + dy }
          : { ...start, width: start.width + dx, height: start.height + dy });
      };
      const end = (endEvent) => {
        if (endEvent.pointerId !== pointerId) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        const rect = currentInspectorRect();
        if (rect) setInspectorRect(rect, true);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
    };
    dragHandle.addEventListener("pointerdown", (event) => startPointerAction(event, "drag"));
    resizeHandle?.addEventListener("pointerdown", (event) => startPointerAction(event, "resize"));
    inspector.querySelector("[data-inspector-close]")?.addEventListener("click", () => {
      if (pendingRouteStyleChange) cancelPendingRouteStyleChange();
      closeInspector();
    });
    inspector.querySelector("[data-inspector-minimize]")?.addEventListener("click", () => {
      if (inspector.classList.contains("is-minimized")) {
        inspector.classList.remove("is-minimized");
        setInspectorRect(inspectorControlRestoreRect || defaultInspectorRect());
        inspectorControlRestoreRect = null;
      } else {
        inspectorControlRestoreRect = currentInspectorRect();
        inspector.classList.remove("is-maximized");
        inspector.classList.add("is-minimized");
        const rect = currentInspectorRect() || defaultInspectorRect();
        setInspectorRect({ ...rect, width: Math.min(320, rect.width), height: 48 });
      }
    });
    inspector.querySelector("[data-inspector-maximize]")?.addEventListener("click", () => {
      const map = inspectorMapBounds();
      if (!map) return;
      if (inspector.classList.contains("is-maximized")) {
        inspector.classList.remove("is-maximized");
        setInspectorRect(inspectorControlRestoreRect || defaultInspectorRect());
        inspectorControlRestoreRect = null;
      } else {
        inspectorControlRestoreRect = currentInspectorRect();
        inspector.classList.remove("is-minimized");
        inspector.classList.add("is-maximized");
        setInspectorRect({ x: map.left + 10, y: map.top + 10, width: map.width - 20, height: map.height - 20 });
      }
    });
  }

  function renderWorkList() {
    const list = root.querySelector("#generic-stage-list");
    const meta = root.querySelector("#generic-list-meta");
    if (!list || !meta) return;
    if (listMode === "days") {
      const total = model.revision.routeVariants.reduce((sum, item) => sum + item.distanceMeters, 0) / 1000;
      meta.textContent = `${model.revision.stages.length} Tage · ${km.format(total)} km`;
      list.setAttribute("aria-label", "Tagesetappen");
      list.innerHTML = model.revision.stages.map((stage, index) => {
        const route = routeFor(stage);
        const fixed = fixedForStage(stage);
        const overnight = stage.legacy?.overnight || place(stage.destinationPlaceId).name;
        return `<button class="generic-stage-row ${stage.kind === "rest" ? "rest" : ""} ${fixed ? "fixed" : ""}" type="button" data-stage-index="${index}" aria-current="${index === selectedStage}" style="--stage-colour:${colours[index % colours.length]}"><span class="generic-day-number">${travelDayNumber(index)}</span><span class="generic-stage-copy"><strong>${escapeHtml(stage.title)}</strong><span>${fixed ? "🔒 Geschützter Fixpunkt" : escapeHtml(overnight)}</span></span><span class="generic-stage-distance">${stage.kind === "rest" ? "Ruhetag" : route?.distanceMeters ? `${km.format(route.distanceMeters / 1000)} km` : stage.kind === "transport" ? "Fähre" : "–"}</span></button>`;
      }).join("");
      list.querySelectorAll("[data-stage-index]").forEach((button) => button.addEventListener("click", () => selectStage(Number(button.dataset.stageIndex), true)));
    } else {
      meta.textContent = `${model.revision.stays.length} Stopps · aktueller Stand`;
      list.setAttribute("aria-label", "Unterkünfte");
      list.innerHTML = model.revision.stays.map((stay, index) => {
        const startIndex = stageForStay(stay);
        const option = optionsFor(stay)[0];
        const booking = bookingFor(stay);
        const range = dayRangeForStay(stay);
        return `<button class="generic-stage-row stay" type="button" data-stay-index="${index}" aria-current="${index === selectedStay}"><span class="generic-day-number">${range.label}</span><span class="generic-stage-copy"><strong>${escapeHtml(place(stay.placeId).name)}</strong><span>${escapeHtml(option?.name || "Unterkunft offen")}</span><small class="generic-booking-badge ${bookingClass(booking)}">${bookingLabel(booking)}</small></span><span class="generic-stage-distance">${stay.nightCount} ${stay.nightCount === 1 ? "Nacht" : "Nächte"}</span></button>`;
      }).join("");
      list.querySelectorAll("[data-stay-index]").forEach((button) => button.addEventListener("click", () => selectStay(Number(button.dataset.stayIndex), true)));
    }
  }

  function selectedRouteStyle(stage, route) {
    return routeStyleDrafts.get(model.revision.stages.indexOf(stage)) || route?.style || "direct";
  }

  function previewRouteStyle(style) {
    const stage = model.revision.stages[selectedStage];
    const route = routeFor(stage);
    if (!route) return;
    const previousStyle = selectedRouteStyle(stage, route);
    if (style === previousStyle) return;
    pendingRouteStyleChange = {
      stageIndex: selectedStage,
      previousStyle,
      previousDraftStyle: routeStyleDrafts.get(selectedStage) || null,
      previousConfirmed: confirmedRouteStyleDrafts.has(selectedStage),
      previewStyle: style
    };
    if (style === route.style) {
      routeStyleDrafts.delete(selectedStage);
      confirmedRouteStyleDrafts.delete(selectedStage);
    } else {
      routeStyleDrafts.set(selectedStage, style);
      confirmedRouteStyleDrafts.delete(selectedStage);
    }
    const inspector = root.querySelector("#generic-inspector");
    inspectorReviewRestoreRect = currentInspectorRect();
    inspectorWindowMode = "review";
    inspector?.classList.remove("is-minimized", "is-maximized");
    compareOriginal = true;
    renderInspector();
    updateCompareControl();
    applyWorkspaceMapFocus(true);
    constrainInspectorWindow();
  }

  async function discardRoutePreview() {
    const stage = model.revision.stages[selectedStage];
    const route = routeFor(stage);
    const wasConfirmed = confirmedRouteStyleDrafts.has(selectedStage);
    pendingRouteStyleChange = null;
    if (wasConfirmed && route) {
      try {
        await persistRouteStyle(selectedStage, route.style);
      } catch (error) {
        window.alert(`Die Routenänderung konnte nicht zurückgesetzt werden: ${error.message}`);
        return;
      }
    } else {
      routeStyleDrafts.delete(selectedStage);
      confirmedRouteStyleDrafts.delete(selectedStage);
    }
    compareOriginal = false;
    renderInspector();
    updateCompareControl();
    applyWorkspaceMapFocus(true);
    applyOverviewRouteStyles();
    updateDraftChrome();
  }

  function cancelPendingRouteStyleChange() {
    if (!pendingRouteStyleChange) return;
    const { stageIndex, previousDraftStyle, previousConfirmed } = pendingRouteStyleChange;
    pendingRouteStyleChange = null;
    if (previousDraftStyle) routeStyleDrafts.set(stageIndex, previousDraftStyle);
    else routeStyleDrafts.delete(stageIndex);
    if (previousConfirmed) confirmedRouteStyleDrafts.add(stageIndex);
    else confirmedRouteStyleDrafts.delete(stageIndex);
    compareOriginal = false;
    inspectorWindowMode = "detail";
    renderInspector();
    if (inspectorReviewRestoreRect) setInspectorRect(inspectorReviewRestoreRect);
    inspectorReviewRestoreRect = null;
    inspectorControlRestoreRect = null;
    updateCompareControl();
    applyWorkspaceMapFocus(true);
    applyOverviewRouteStyles();
    updateDraftChrome();
  }

  async function confirmPendingRouteStyleChange() {
    const confirmButton = root.querySelector("#generic-route-review-confirm");
    const stageIndex = pendingRouteStyleChange?.stageIndex;
    const style = pendingRouteStyleChange?.previewStyle;
    if (!Number.isInteger(stageIndex) || !style || !confirmButton) return;
    confirmButton.disabled = true;
    confirmButton.textContent = "Wird gespeichert …";
    try {
      await persistRouteStyle(stageIndex, style);
      pendingRouteStyleChange = null;
      compareOriginal = false;
      inspectorWindowMode = "detail";
      renderInspector();
      if (inspectorReviewRestoreRect) setInspectorRect(inspectorReviewRestoreRect);
      inspectorReviewRestoreRect = null;
      inspectorControlRestoreRect = null;
      updateCompareControl();
      applyWorkspaceMapFocus(false);
      applyOverviewRouteStyles();
      updateDraftChrome();
    } catch (error) {
      cancelPendingRouteStyleChange();
      window.alert(`Die Routenänderung konnte nicht gespeichert werden: ${error.message}`);
    }
  }

  function routeHintsFor(stage, route, activeStyle) {
    const hasChangedStyle = routeStyleDrafts.has(selectedStage) && activeStyle !== route?.style;
    if (hasChangedStyle && activeStyle === "direct") {
      return `Direkte Verbindung von ${place(stage.originPlaceId).name} nach ${place(stage.destinationPlaceId).name}. Die Zwischenziele der kurvigen Variante entfallen.`;
    }
    if (hasChangedStyle && activeStyle === "scenic") {
      return `Kurvige Verbindung von ${place(stage.originPlaceId).name} nach ${place(stage.destinationPlaceId).name}. Landschaftliche Zwischenziele werden bei der Routenprüfung festgelegt.`;
    }
    return [route?.roadSummary.join(" · "), stage.legacy?.points].filter(Boolean).join(" · ")
      || stage.notes.join(" ")
      || (stage.kind === "rest" ? "Motorräder bleiben stehen." : "Keine zusätzlichen Hinweise.");
  }

  function updateCompareControl() {
    const control = root.querySelector(".generic-compare");
    if (!control) return;
    const hasSelectedPreview = !workspaceShowAll && listMode === "days" && routeStyleDrafts.has(selectedStage);
    const stage = model.revision.stages[selectedStage];
    const route = stage ? routeFor(stage) : null;
    const previewStyle = routeStyleDrafts.get(selectedStage);
    const legend = root.querySelector("#generic-compare-legend");
    control.hidden = Boolean(pendingRouteStyleChange);
    control.disabled = !hasSelectedPreview;
    control.setAttribute("aria-pressed", String(hasSelectedPreview && compareOriginal));
    control.querySelector("span").textContent = compareOriginal ? "Vergleich aktiv" : "Original vergleichen";
    control.title = hasSelectedPreview ? "Original und Routenvorschau dieser Etappe vergleichen" : "Verfügbar, sobald für diese Etappe eine Routenvorschau erstellt wurde";
    if (legend) {
      legend.hidden = !(hasSelectedPreview && compareOriginal);
      if (hasSelectedPreview && route) {
        legend.innerHTML = `<span><i class="compare-line original" style="--compare-colour:${colours[selectedStage % colours.length]}"></i>${escapeHtml(routeStyleLabel(route.style))} · Originalplan</span><span><i class="compare-line preview"></i>${escapeHtml(routeStyleLabel(previewStyle))} · Vorschau</span>`;
      } else {
        legend.innerHTML = "";
      }
    }
  }

  function openPlanContext(request) {
    if (typeof window.__ROADBOOK_OPEN_PLAN_CHANGE__ === "function") {
      window.__ROADBOOK_OPEN_PLAN_CHANGE__(request);
      return;
    }
    document.querySelector("#nav-plan")?.click();
  }

  function openStagePlanContext(action = "stage") {
    const stage = model.revision.stages[selectedStage];
    const route = routeFor(stage);
    const previewStyle = routeStyleDrafts.get(selectedStage);
    const dayLabel = travelDayNumber(selectedStage);
    const fixed = fixedForStage(stage);
    const previewText = previewStyle
      ? ` Die Routenart soll von ${route?.style === "scenic" ? "Kurvig & schön" : "Direkt"} auf ${previewStyle === "scenic" ? "Kurvig & schön" : "Direkt"} wechseln.`
      : "";
    openPlanContext({
      title: fixed && action === "fixed" ? "Fixpunkt ändern" : "Etappe anpassen",
      contextLabel: `Tag ${dayLabel} · ${stage.title}`,
      scope: "stage",
      type: "free",
      startDay: selectedStage + 1,
      place: stage.title,
      instruction: `Nur die ausgewählte Etappe „${stage.title}“ anpassen. Start, Ziel, Unterkunft und alle übrigen Reisetage unverändert lassen.${previewText}`
    });
  }

  function openStayPlanContext(action) {
    const stay = model.revision.stays[selectedStay];
    const startIndex = stageForStay(stay);
    const location = place(stay.placeId).name;
    const dayLabel = travelDayNumber(startIndex);
    if (action === "night") {
      openPlanContext({
        title: "Aufenthalt verlängern",
        contextLabel: `Unterkunft · ${location} · ab Tag ${dayLabel}`,
        type: "extend",
        startDay: startIndex + 1,
        place: location,
        nights: 1,
        instruction: `Den bestehenden Aufenthalt in ${location} um eine Nacht verlängern. Angrenzende Etappen und den geschützten Fährtermin prüfen.`
      });
      return;
    }
    openPlanContext({
      title: "Neue Unterkunft suchen",
      contextLabel: `Unterkunft · ${location} · ab Tag ${dayLabel}`,
      type: "free",
      startDay: startIndex + 1,
      place: location,
      instruction: `Für den bestehenden Aufenthalt in ${location} eine neue motorradfreundliche Unterkunft mit sicherer Abstellung suchen. Zuerst am gleichen Ort suchen; nur falls nötig die angrenzenden Etappen ändern.`
    });
  }

  function renderInspector() {
    const inspector = root.querySelector("#generic-inspector");
    if (!inspector) return;
    inspector.classList.toggle("is-route-review", Boolean(pendingRouteStyleChange));
    if (pendingRouteStyleChange && pendingRouteStyleChange.stageIndex === selectedStage) {
      const stage = model.revision.stages[selectedStage];
      const route = routeFor(stage);
      const preview = previewMetricsFor(selectedStage, route);
      const previousStyle = pendingRouteStyleChange.previousStyle;
      const previewStyle = pendingRouteStyleChange.previewStyle;
      const metrics = (value) => value?.distanceMeters
        ? `${km.format(value.distanceMeters / 1000)} km · ${formatDuration(value.durationSeconds)}`
        : "Wird beim Übernehmen berechnet";
      const previousMetrics = previousStyle === route?.style
        ? route
        : geometryFor(selectedStage, previousStyle === "direct" ? "direct" : "original") || route;
      inspector.innerHTML = `${inspectorChrome(`Routenvergleich · Tag ${travelDayNumber(selectedStage)}`)}<div class="generic-inspector-content generic-route-review-content"><div class="generic-route-review-change"><div><span>Bisher</span><strong>${escapeHtml(routeStyleLabel(previousStyle))}</strong><small>${escapeHtml(metrics(previousMetrics))}</small></div><i aria-hidden="true">→</i><div><span>Vorschau</span><strong>${escapeHtml(routeStyleLabel(previewStyle))}</strong><small>${escapeHtml(metrics(preview))}</small></div></div><button class="generic-route-review-compare" type="button" aria-pressed="${compareOriginal}" id="generic-route-review-compare"><i aria-hidden="true"></i><span>${compareOriginal ? "Beide Strecken sichtbar" : "Original zusätzlich anzeigen"}</span></button><div class="generic-route-review-actions"><button class="generic-action-button" type="button" id="generic-route-review-discard">Verwerfen</button><button class="generic-action-button primary" type="button" id="generic-route-review-confirm">Übernehmen</button></div></div><span class="generic-inspector-resize" data-inspector-resize aria-hidden="true"></span>`;
      inspector.querySelector("#generic-route-review-compare")?.addEventListener("click", () => {
        compareOriginal = !compareOriginal;
        renderInspector();
        updateCompareControl();
        applyWorkspaceMapFocus(false);
      });
      inspector.querySelector("#generic-route-review-discard")?.addEventListener("click", cancelPendingRouteStyleChange);
      inspector.querySelector("#generic-route-review-confirm")?.addEventListener("click", confirmPendingRouteStyleChange);
      attachInspectorWindowInteractions();
      return;
    }
    if (listMode === "days") {
      const stage = model.revision.stages[selectedStage];
      const route = routeFor(stage);
      const stay = stayForDate(stage.date);
      const accommodation = stay ? optionsFor(stay)[0] : null;
      const alternative = stay ? optionsFor(stay)[1] : null;
      const booking = stay ? bookingFor(stay) : null;
      const fixed = fixedForStage(stage);
      const destination = stage.legacy?.overnight || place(stage.destinationPlaceId).name;
      const activeStyle = selectedRouteStyle(stage, route);
      const hasRoutePreview = routeStyleDrafts.has(selectedStage);
      const routePreviewConfirmed = confirmedRouteStyleDrafts.has(selectedStage);
      const displayedRoute = previewMetricsFor(selectedStage, route);
      const googleMapsUrl = googleMapsUrlForSelection(stage, route);
      inspector.innerHTML = `${inspectorChrome(`Etappe · Tag ${travelDayNumber(selectedStage)}`)}<div class="generic-inspector-content"><div class="generic-inspector-head"><span class="generic-inspector-type">Tag ${travelDayNumber(selectedStage)} · ${stage.kind === "rest" ? "Ruhetag" : stage.kind === "transport" ? "Transport" : stage.kind === "loop" ? "Rundfahrt" : "Motorradetappe"}</span><h2>${escapeHtml(stage.title)}</h2><span>${escapeHtml(formatDate(stage.date, { weekday: "long", day: "2-digit", month: "long" }))}</span></div>
        ${fixed ? `<div class="generic-fixed-notice"><strong>🔒 Geschützter Fixpunkt</strong>${escapeHtml(fixed.title)} kann nur nach ausdrücklicher Bestätigung verändert werden.</div>` : ""}
        <div class="generic-metrics"><div><strong>${displayedRoute?.distanceMeters ? `${km.format(displayedRoute.distanceMeters / 1000)} km` : "–"}</strong><span>${hasRoutePreview ? "Neu berechnet" : "Strecke"}</span></div><div><strong>${formatDuration(displayedRoute?.durationSeconds)}</strong><span>${hasRoutePreview ? "Neu berechnet" : "Fahrzeit"}</span></div><div><strong>${escapeHtml(destination)}</strong><span>Übernachtung</span></div></div>
        ${route ? `<div class="generic-detail-block"><h3>Routenart</h3>${stage.kind === "loop" ? `<p class="generic-context-note">Festgelegte Rundfahrt über die definierten Wegpunkte. Eine direkte Verbindung wäre hier keine sinnvolle Alternative.</p>` : `<div class="generic-route-choice"><button type="button" data-route-style="direct" aria-pressed="${activeStyle === "direct"}">${activeStyle === "direct" ? `<span aria-hidden="true">✓</span>` : ""}Direkt</button><button type="button" data-route-style="scenic" aria-pressed="${activeStyle === "scenic"}">${activeStyle === "scenic" ? `<span aria-hidden="true">✓</span>` : ""}Kurvig & schön</button></div><p class="generic-route-current"><span aria-hidden="true"></span>Ausgewählt: <strong>${activeStyle === "scenic" ? "Kurvig & schön" : "Direkt"}</strong></p><p class="generic-context-note">Eine andere Auswahl zeigt beide Strecken auf der Karte und reduziert dieses Fenster auf die Entscheidung.</p>${hasRoutePreview ? `<div class="generic-route-preview ${routePreviewConfirmed ? "confirmed" : ""}"><strong>${routePreviewConfirmed ? "Lokal gespeichert · Prüfung ausstehend" : "Routenvorschau"}</strong><span>${activeStyle === "scenic" ? "Kurvig & schön" : "Direkt"} · ${displayedRoute?.distanceMeters ? `${km.format(displayedRoute.distanceMeters / 1000)} km · ${formatDuration(displayedRoute.durationSeconds)}` : "noch nicht übernommen"}</span><button type="button" id="generic-discard-route-preview">${routePreviewConfirmed ? "Zurücksetzen" : "Verwerfen"}</button></div>` : ""}`}</div>` : ""}
        <div class="generic-detail-block"><h3>Streckenhinweise</h3><p>${escapeHtml(routeHintsFor(stage, route, activeStyle))}</p></div>
        <div class="generic-detail-block"><h3>Unterkunft</h3>${accommodation ? `<div class="generic-hotel">${hotelIcon()}<div><strong>${escapeHtml(accommodation.name)}</strong><span>${bookingLabel(booking)} · ${parkingLabel(accommodation, stay)}</span>${accommodation.url ? `<a class="generic-hotel-link" href="${escapeHtml(accommodation.url)}" target="_blank" rel="noopener">Hotel öffnen ↗</a>` : ""}${alternative ? `<small>Alternative: ${escapeHtml(alternative.name)}</small>${alternative.url ? `<a class="generic-hotel-link" href="${escapeHtml(alternative.url)}" target="_blank" rel="noopener">Alternative öffnen ↗</a>` : ""}` : ""}</div></div>` : `<p>Für diesen Tag ist noch keine Unterkunft hinterlegt.</p>`}${stay ? `<button class="generic-context-link" type="button" id="generic-show-stay">Unterkunft dieses Tages ansehen →</button>` : ""}</div>
        <div class="generic-inspector-actions">${googleMapsUrl ? `<a class="generic-action-button" href="${escapeHtml(googleMapsUrl)}" target="_blank" rel="noopener">In Google Maps öffnen ↗</a>${hasRoutePreview ? `<p class="generic-google-note">Google Maps berechnet die gewählte Route dort neu. Verlauf und Fahrzeit können leicht von der Vorschau abweichen.</p>` : ""}` : ""}<button class="generic-action-button primary" type="button" id="generic-adjust-stage">Etappe anpassen</button>${fixed ? `<button class="generic-action-button warning" type="button" id="generic-adjust-fixed">Fixpunkt ändern</button>` : ""}</div></div><span class="generic-inspector-resize" data-inspector-resize aria-hidden="true"></span>`;
      inspector.querySelectorAll("[data-route-style]").forEach((button) => button.addEventListener("click", () => previewRouteStyle(button.dataset.routeStyle)));
      inspector.querySelector("#generic-discard-route-preview")?.addEventListener("click", discardRoutePreview);
      inspector.querySelector("#generic-adjust-stage")?.addEventListener("click", () => openStagePlanContext("stage"));
      inspector.querySelector("#generic-adjust-fixed")?.addEventListener("click", () => openStagePlanContext("fixed"));
      inspector.querySelector("#generic-show-stay")?.addEventListener("click", () => { selectedStay = model.revision.stays.indexOf(stay); setListMode("stays"); openInspector(); });
    } else {
      const stay = model.revision.stays[selectedStay];
      const startIndex = stageForStay(stay);
      const option = optionsFor(stay)[0];
      const alternative = optionsFor(stay)[1];
      const booking = bookingFor(stay);
      const protectedBooking = Boolean(booking?.protected);
      inspector.innerHTML = `${inspectorChrome(`Unterkunft · Tag ${dayRangeForStay(stay).label}`)}<div class="generic-inspector-content"><div class="generic-inspector-head"><span class="generic-inspector-type">Unterkunft · Tag ${dayRangeForStay(stay).label}</span><h2>${escapeHtml(place(stay.placeId).name)}</h2><span>${formatDate(stay.startDate)} · ${stay.nightCount} ${stay.nightCount === 1 ? "Nacht" : "Nächte"}</span></div>
        ${protectedBooking ? `<div class="generic-fixed-notice"><strong>🔒 Buchung geschützt</strong>Eine Änderung benötigt deine ausdrückliche Bestätigung und eine Prüfung der angrenzenden Route.</div>` : ""}
        <div class="generic-metrics two"><div><strong>${bookingLabel(booking)}</strong><span>Buchungsstatus</span></div><div><strong>${stay.nightCount}</strong><span>${stay.nightCount === 1 ? "Nacht" : "Nächte"}</span></div></div>
        <div class="generic-detail-block"><h3>${option ? "Unterkunft" : "Unterkunft offen"}</h3>${option ? `<div class="generic-hotel">${hotelIcon()}<div><strong>${escapeHtml(option.name)}</strong><span>${parkingLabel(option, stay)}</span>${option.url ? `<a class="generic-hotel-link" href="${escapeHtml(option.url)}" target="_blank" rel="noopener">Hotel öffnen ↗</a>` : `<small>Kein Hotel-Link hinterlegt</small>`}</div></div>` : `<p>Es ist noch keine erste Wahl hinterlegt.</p>`}</div>
        <div class="generic-detail-block"><h3>Alternative</h3>${alternative ? `<div class="generic-hotel">${hotelIcon(true)}<div><strong>${escapeHtml(alternative.name)}</strong><span>Noch nicht ausgewählt</span>${alternative.url ? `<a class="generic-hotel-link" href="${escapeHtml(alternative.url)}" target="_blank" rel="noopener">Alternative öffnen ↗</a>` : `<small>Kein Link hinterlegt</small>`}</div></div>` : `<p>Noch keine Alternative hinterlegt.</p>`}<p class="generic-context-note">Zuerst am gleichen Ort suchen. Nur ein Ortswechsel löst eine Prüfung der angrenzenden Etappen aus.</p></div>
        <div class="generic-inspector-actions"><button class="generic-action-button primary" type="button" id="generic-find-accommodation">Neue Unterkunft suchen</button><button class="generic-action-button" type="button" id="generic-add-night">Nacht hinzufügen</button><button class="generic-context-link" type="button" id="generic-show-adjacent">Angrenzende Etappen ansehen →</button></div></div><span class="generic-inspector-resize" data-inspector-resize aria-hidden="true"></span>`;
      inspector.querySelector("#generic-find-accommodation")?.addEventListener("click", () => openStayPlanContext("search"));
      inspector.querySelector("#generic-add-night")?.addEventListener("click", () => openStayPlanContext("night"));
      inspector.querySelector("#generic-show-adjacent")?.addEventListener("click", () => { selectedStage = Math.max(0, startIndex); setListMode("days"); openInspector(); });
    }
    attachInspectorWindowInteractions();
  }

  function selectStage(index, fit) {
    const nextStage = Math.max(0, Math.min(model.revision.stages.length - 1, index));
    if (pendingRouteStyleChange && pendingRouteStyleChange.stageIndex !== nextStage) cancelPendingRouteStyleChange();
    if (nextStage !== selectedStage || listMode !== "days") compareOriginal = false;
    selectedStage = nextStage;
    workspaceShowAll = false;
    if (listMode !== "days") listMode = "days";
    root.querySelectorAll("[data-list-mode]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.listMode === "days")));
    renderWorkList();
    renderInspector();
    updateCompareControl();
    applyWorkspaceMapFocus(fit);
    openInspector();
  }

  function selectStay(index, fit) {
    selectedStay = Math.max(0, Math.min(model.revision.stays.length - 1, index));
    workspaceShowAll = false;
    compareOriginal = false;
    if (listMode !== "stays") listMode = "stays";
    root.querySelectorAll("[data-list-mode]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.listMode === "stays")));
    renderWorkList();
    renderInspector();
    updateCompareControl();
    applyWorkspaceMapFocus(fit);
    openInspector();
  }

  async function initialiseWorkspaceMap() {
    if (workspaceInitialised) return;
    workspaceInitialised = true;
    try {
      const [L, { xml, routes }] = await Promise.all([loadLeaflet(), loadMapData()]);
      workspaceMap = L.map("generic-work-map", { zoomControl: true, scrollWheelZoom: true, preferCanvas: true }).setView([42.2, 2.1], 5);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(workspaceMap);
      const pointCoordinates = kmlPoints(xml);
      const dayEnds = new Map();
      workspaceBounds = L.latLngBounds([]);
      routes.features.forEach((feature) => {
        const { variant, ferry, day, name } = feature.properties;
        if (feature.properties.optional || (ferry && variant === "direct")) return;
        const index = stageIndexForFeature(feature);
        const coordinates = leafletCoordinates(feature);
        routeGeometryData.set(`${index}:${variant}`, feature.properties);
        if (!workspaceRoutes.has(index)) workspaceRoutes.set(index, { original: L.featureGroup(), direct: L.featureGroup() });
        const polyline = L.polyline(coordinates, { className: `generic-route-line route-${variant} route-stage-${index}`, color: ferry ? "#9a6118" : colours[index % colours.length], weight: 5, opacity: .78, dashArray: ferry ? "9 8" : null, lineCap: "round", isFerry: ferry }).bindTooltip(`Tag ${day} · ${model.revision.stages[index]?.title || name}`, { sticky: true });
        polyline.on("click", () => selectStage(index, true));
        workspaceRoutes.get(index)[variant].addLayer(polyline);
        if (variant === "original") {
          workspaceRoutes.get(index).original.addTo(workspaceMap);
          workspaceBounds.extend(polyline.getBounds());
          dayEnds.set(index, coordinates.at(-1));
        }
      });
      stayMarkerGroups().forEach((group) => {
        const first = group.stays[0];
        const name = place(group.placeId).name;
        const legacyDay = model.revision.stages[first.startIndex]?.legacy?.day || travelDayNumber(first.startIndex);
        const dayLabel = group.label;
        let coordinate = pointCoordinateFor(pointCoordinates, name, legacyDay) || dayEnds.get(first.startIndex);
        for (let offset = 1; !coordinate && offset <= 4; offset += 1) {
          coordinate = dayEnds.get(first.startIndex - offset) || dayEnds.get(first.startIndex + offset);
        }
        if (!coordinate) return;
        const icon = stayMarkerIcon(L, dayLabel, group.stays.length > 1);
        const marker = L.marker(coordinate, { icon, zIndexOffset: 500 }).bindTooltip(`Tag ${group.stays.map((entry) => entry.label).join(" und ")} · ${name}`);
        const stayIndexes = group.stays.map((entry) => entry.stayIndex);
        const stageIndexes = group.stays.flatMap((entry) => Array.from({ length: entry.endIndex - entry.startIndex + 1 }, (_, offset) => entry.startIndex + offset));
        marker.on("click", () => selectStay(stayIndexes.includes(selectedStay) ? selectedStay : stayIndexes[0], true));
        marker.addTo(workspaceMap);
        if (marker.getElement()) {
          marker.getElement().dataset.stayIndex = String(stayIndexes[0]);
          marker.getElement().dataset.stayIndexes = stayIndexes.join(",");
          marker.getElement().dataset.latitude = String(coordinate[0]);
          marker.getElement().dataset.longitude = String(coordinate[1]);
        }
        workspaceMarkers.push({ marker, stayIndexes, stageIndexes });
      });
      if (workspaceBounds.isValid()) workspaceMap.fitBounds(workspaceBounds, { padding: [32, 32] });
      renderInspector();
      updateCompareControl();
      applyWorkspaceMapFocus(false);
    } catch (error) {
      const mapRoot = root.querySelector("#generic-work-map");
      if (mapRoot) mapRoot.innerHTML = `<div class="generic-map-fallback"><div><strong>Karte momentan nicht verfügbar</strong><br>${escapeHtml(error.message)}</div></div>`;
    }
  }

  function applyWorkspaceAllRoutes(fit) {
    if (!workspaceMap) return;
    const title = root.querySelector("#generic-work-map-title");
    const subtitle = root.querySelector("#generic-work-map-subtitle");
    if (title) title.textContent = "Gesamte Route";
    if (subtitle) subtitle.textContent = `${model.revision.stages.length} Tage · alle Etappen und Übernachtungsorte.`;
    workspaceRoutes.forEach((variants, index) => {
      const useDirectDraft = confirmedRouteStyleDrafts.has(index) && routeStyleDrafts.get(index) === "direct";
      const desired = useDirectDraft ? variants.direct : variants.original;
      const hidden = useDirectDraft ? variants.original : variants.direct;
      if (desired && !workspaceMap.hasLayer(desired)) desired.addTo(workspaceMap);
      if (hidden && workspaceMap.hasLayer(hidden)) workspaceMap.removeLayer(hidden);
      desired?.eachLayer((layer) => layer.setStyle({
        color: layer.options.isFerry ? "#9a6118" : colours[index % colours.length],
        weight: 5,
        opacity: .82,
        dashArray: layer.options.isFerry ? "9 8" : null
      }));
    });
    workspaceMarkers.forEach(({ marker }) => marker.getElement()?.classList.remove("is-active"));
    if (fit && workspaceBounds?.isValid()) workspaceMap.fitBounds(workspaceBounds, { padding: [32, 32] });
  }

  function applyWorkspaceMapFocus(fit) {
    if (!workspaceMap) return;
    if (workspaceShowAll) {
      applyWorkspaceAllRoutes(fit);
      return;
    }
    const title = root.querySelector("#generic-work-map-title");
    const subtitle = root.querySelector("#generic-work-map-subtitle");
    if (listMode === "days") {
      const stage = model.revision.stages[selectedStage];
      const route = routeFor(stage);
      const previewStyle = routeStyleDrafts.get(selectedStage);
      const previewMetrics = previewMetricsFor(selectedStage, route);
      title.textContent = `${previewStyle ? (compareOriginal ? "Routenvergleich" : "Routenvorschau") : planLabel()} · Tag ${travelDayNumber(selectedStage)}`;
      subtitle.textContent = previewStyle
        ? compareOriginal
          ? `${routeStyleLabel(route?.style)} (Original) und ${routeStyleLabel(previewStyle)} (Vorschau).`
          : `${routeStyleLabel(previewStyle)} neu berechnet${previewMetrics?.distanceMeters ? ` · ${km.format(previewMetrics.distanceMeters / 1000)} km · ${formatDuration(previewMetrics.durationSeconds)}` : ""}. Der Online-Plan bleibt unverändert.`
        : `${stage.title} · aktueller Stand.`;
      workspaceRoutes.forEach((variants, index) => {
        const isSelectedPreview = index === selectedStage && Boolean(previewStyle);
        const publishedStyle = index === selectedStage ? route?.style || "scenic" : "scenic";
        const showDirect = isSelectedPreview
          ? previewStyle === "direct" || (compareOriginal && publishedStyle === "direct")
          : false;
        const showOriginal = isSelectedPreview
          ? previewStyle !== "direct" || (compareOriginal && publishedStyle !== "direct")
          : true;
        if (showOriginal && !workspaceMap.hasLayer(variants.original)) variants.original.addTo(workspaceMap);
        if (!showOriginal && workspaceMap.hasLayer(variants.original)) workspaceMap.removeLayer(variants.original);
        if (showDirect && !workspaceMap.hasLayer(variants.direct)) variants.direct.addTo(workspaceMap);
        if (!showDirect && workspaceMap.hasLayer(variants.direct)) workspaceMap.removeLayer(variants.direct);
        variants.original.eachLayer((layer) => {
          const isPreview = isSelectedPreview && previewStyle !== "direct";
          const isComparedOriginal = isSelectedPreview && compareOriginal && publishedStyle !== "direct" && !isPreview;
          layer.setStyle({
            color: isPreview ? "#176b46" : isComparedOriginal ? "#737b76" : layer.options.isFerry ? "#9a6118" : colours[index % colours.length],
            weight: isPreview ? 8 : isComparedOriginal ? 6 : index === selectedStage ? 8 : 4,
            opacity: isPreview ? .98 : isComparedOriginal ? .82 : index === selectedStage ? .96 : .2,
            dashArray: isComparedOriginal ? "7 7" : layer.options.isFerry ? "9 8" : null
          });
        });
        variants.direct.eachLayer((layer) => {
          const isPreview = isSelectedPreview && previewStyle === "direct";
          const isComparedOriginal = isSelectedPreview && compareOriginal && publishedStyle === "direct" && !isPreview;
          layer.setStyle({
            color: isPreview ? "#176b46" : "#737b76",
            weight: isPreview ? 8 : 6,
            opacity: isPreview ? .98 : .82,
            dashArray: isComparedOriginal ? "7 7" : null
          });
        });
      });
      workspaceMarkers.forEach(({ marker, stageIndexes }) => marker.getElement()?.classList.toggle("is-active", stageIndexes.includes(selectedStage)));
      const selected = workspaceRoutes.get(selectedStage);
      const selectedGroup = previewStyle === "direct" ? selected?.direct : selected?.original;
      if (fit && selectedGroup?.getBounds().isValid()) {
        const bounds = selectedGroup.getBounds();
        const publishedGroup = route?.style === "direct" ? selected?.direct : selected?.original;
        if (compareOriginal && publishedGroup?.getBounds().isValid()) bounds.extend(publishedGroup.getBounds());
        const mapBounds = inspectorMapBounds();
        const inspectorBounds = pendingRouteStyleChange ? currentInspectorRect() : null;
        const fitOptions = { paddingTopLeft: [70, 70], paddingBottomRight: [70, 70], maxZoom: 9 };
        if (mapBounds && inspectorBounds) {
          if (inspectorBounds.width > mapBounds.width * .55) fitOptions.paddingTopLeft = [70, Math.min(mapBounds.height * .45, inspectorBounds.height + 28)];
          else fitOptions.paddingBottomRight = [Math.min(mapBounds.width * .45, inspectorBounds.width + 28), 70];
        }
        workspaceMap.fitBounds(bounds, fitOptions);
      }
    } else {
      const stay = model.revision.stays[selectedStay];
      const startIndex = stageForStay(stay);
      title.textContent = `${planLabel()} · ${place(stay.placeId).name}`;
      subtitle.textContent = "Übernachtungsort mit ankommender und abgehender Etappe.";
      workspaceRoutes.forEach((variants, index) => {
        if (!workspaceMap.hasLayer(variants.original)) variants.original.addTo(workspaceMap);
        if (workspaceMap.hasLayer(variants.direct)) workspaceMap.removeLayer(variants.direct);
        variants.original.eachLayer((layer) => layer.setStyle({ weight: [startIndex, startIndex + 1].includes(index) ? 6 : 3, opacity: [startIndex, startIndex + 1].includes(index) ? .42 : .05 }));
      });
      workspaceMarkers.forEach(({ marker, stayIndexes }) => marker.getElement()?.classList.toggle("is-active", stayIndexes.includes(selectedStay)));
      const selectedMarker = workspaceMarkers.find((item) => item.stayIndexes.includes(selectedStay))?.marker;
      if (fit && selectedMarker) workspaceMap.setView(selectedMarker.getLatLng(), 8, { animate: true });
    }
  }

  function openExistingPlanner() {
    if (typeof window.__ROADBOOK_OPEN_PLAN_CHANGE__ === "function") {
      window.__ROADBOOK_OPEN_PLAN_CHANGE__({ type: "extend", startDay: Math.max(1, travelDayNumber(selectedStage)) });
      return;
    }
    document.querySelector("#nav-plan")?.click();
  }

  function setView(view) {
    activeView = view === "roadbook" ? "roadbook" : "overview";
    const overview = activeView === "overview";
    root.hidden = false;
    root.querySelector("#generic-overview-panel").hidden = !overview;
    root.querySelector("#generic-workspace").hidden = overview;
    legacyRoadbook.hidden = true;
    document.body.classList.toggle("generic-roadbook-view", !overview);
    navRoot.querySelectorAll("[data-generic-view]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.genericView === activeView)));
    const viewUrl = new URL(window.location.href);
    if (activeView === "roadbook") viewUrl.searchParams.set("view", "roadbook");
    else viewUrl.searchParams.delete("view");
    history.replaceState(null, "", viewUrl);
    if (overview && overviewMap) {
      applyOverviewRouteStyles();
      window.setTimeout(() => overviewMap.invalidateSize(), 0);
    }
    if (!overview) {
      initialiseWorkspaceMap();
      window.setTimeout(() => { workspaceMap?.invalidateSize(); applyWorkspaceMapFocus(false); }, 0);
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function start() {
    document.body.classList.add("generic-trip-enabled");
    document.body.classList.toggle("generic-touch-device", navigator.maxTouchPoints > 1);
    try {
      const snapshot = await bridge.getPublishedSnapshot();
      planDraftStatus = typeof bridge.getPlanDraftStatus === "function" ? await bridge.getPlanDraftStatus() : { active: false };
      model = modelApi.importLegacyRoadbook(snapshot);
      modelApi.assertLegacyParity(model, { sourceDays: 30, stages: 30 });
      document.body.classList.toggle("generic-original-draft", isOriginalDraft());
      document.body.classList.toggle("generic-plan-draft", isPlanDraft());
      await hydrateRouteStyleDrafts();
      window.__GENERIC_TRIP_MODEL__ = model;
      renderNavigation();
      renderOverview();
      setView(requestedView);
      updateDraftChrome();
    } catch (error) {
      document.body.classList.remove("generic-trip-enabled");
      navRoot.hidden = true;
      root.hidden = true;
      legacyRoadbook.hidden = false;
      console.error("Generische Reiseansicht konnte nicht geladen werden", error);
    }
  }

  start();
})();
