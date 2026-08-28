"use strict";

const PLANNING_POLICY = Object.freeze({
  version: 4,
  id: "motorcycle-roadbook-policy-v4",
  principles: [
    "Plane reale Motorradstrecken für zwei beladene Reisemotorräder, ruhig und sicher statt als Kurvenmaximierung.",
    "Verwende nur geografisch zusammenhängende, asphaltierte und legal befahrbare Straßen.",
    "Prüfe Start, Ziel, Wegpunktreihenfolge, Straßenfolge, Distanz und Fahrzeit.",
    "Prüfe aktuelle und saisonale Sperren, Baustellen, Wetterrisiken, Grenzen, Umweltzonen und Zufahrtsbeschränkungen.",
    "Unterscheide eine heutige Störung von einem strukturellen oder saisonalen Risiko im tatsächlichen Reisezeitraum.",
    "Nutze für jeden geänderten Fahrtag mindestens eine offizielle Quelle und zusätzlich eine unabhängige motorradspezifische Quelle.",
    "Dokumentiere die verwendeten Quellen und ihren Einfluss auf die konkrete Streckenwahl.",
    "Behalte alle übergebenen Fixpunkte und deren gesperrte Eigenschaften unverändert.",
    "Speichere oder veröffentliche keinen unvollständig geprüften Fahrtag."
  ],
  excludedRoads: ["Offroad", "Pisten", "Strandwege", "Waldwege", "unnötig schmale Abenteuerstraßen"],
  requiredEvidence: ["official", "motorcycle", "routingEvidence"]
});

const SOURCE_REGISTRY = Object.freeze({
  Schweiz: { official: ["ASTRA – nationale Verkehrslage", "TCS Verkehrsinformationen", "MeteoSchweiz"], motorcycle: ["SchweizMobil und offizielle Motorradtourismus-Routen", "aktuelle unabhängige Motorrad-Reiseberichte Schweiz"] },
  Österreich: { official: ["ASFINAG Verkehrslage", "österreichische Landesverkehrsdienste", "GeoSphere Austria"], motorcycle: ["offizielle Motorradtourismus-Routen Österreich", "aktuelle unabhängige Motorrad-Reiseberichte Österreich"] },
  Italien: { official: ["ANAS Verkehrsinformationen", "Autostrade per l'Italia", "Protezione Civile Meteo"], motorcycle: ["offizielle regionale Motorradtourismus-Routen Italien", "aktuelle unabhängige Motorrad-Reiseberichte Italien"] },
  Frankreich: { official: ["Bison Futé", "französische Präfekturen und Straßenbehörden", "Météo-France"], motorcycle: ["offizielle französische Motorradtourismus-Routen", "aktuelle unabhängige Motorrad-Reiseberichte Frankreich"] },
  Spanien: { official: ["DGT Verkehrslage", "regionale spanische Straßenbehörden", "AEMET"], motorcycle: ["offizielle spanische Motorradtourismus-Routen", "aktuelle unabhängige Motorrad-Reiseberichte Spanien"] },
  Slowenien: { official: ["promet.si", "slowenische Straßenbehörde DRSI", "ARSO Wetter"], motorcycle: ["offizielle slowenische Motorradtourismus-Routen", "aktuelle unabhängige Motorrad-Reiseberichte Slowenien"] },
  Kroatien: { official: ["HAK – Straßen-, Wind-, Baustellen- und Grenzlage", "DHMZ Wetter"], motorcycle: ["Kroatische Tourismuszentrale – Motorradführer", "aktuelle unabhängige Motorrad-Reiseberichte Kroatien"] },
  Montenegro: { official: ["Montenegrinische Regierung und Straßeninformationen", "AMSCG", "ZHMS Montenegro Wetter"], motorcycle: ["offizielle montenegrinische Motorradtourismus-Routen", "aktuelle unabhängige Motorrad-Reiseberichte Montenegro"] }
});

const clean = (value, limit = 500) => String(value || "").trim().slice(0, limit);
const list = (value, limit = 20) => Array.isArray(value) ? value.slice(0, limit).map((item) => clean(item, 500)).filter(Boolean) : [];

const normalizeFixPoint = (fix = {}) => ({
  id: clean(fix.id, 120),
  kind: clean(fix.kind, 60) || "anchor",
  title: clean(fix.title, 200) || "Fixpunkt",
  place: clean(fix.place, 180),
  startsAt: clean(fix.startsAt, 60),
  endsAt: clean(fix.endsAt, 60),
  stageDay: Number.isInteger(Number(fix.stageDay)) ? Number(fix.stageDay) : null,
  stageTitlePattern: clean(fix.stageTitlePattern, 200),
  locks: list(fix.locks, 12),
  bookingRef: clean(fix.bookingRef, 160),
  reason: clean(fix.reason, 300)
});

const normalizeTripContext = (trip = {}) => {
  const profile = trip.planningProfile && typeof trip.planningProfile === "object" ? trip.planningProfile : {};
  return {
    id: clean(trip.id, 120) || "trip_unbekannt",
    name: clean(trip.name, 200) || "Motorradreise",
    startDate: /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate || "") ? trip.startDate : "2026-09-24",
    endDate: clean(trip.endDate, 40),
    startPlace: clean(trip.startPlace, 180),
    endPlace: clean(trip.endPlace, 180),
    participantCount: Math.max(1, Number(trip.participantCount) || 2),
    motorcycleCount: Math.max(1, Number(trip.motorcycleCount) || 2),
    preferences: trip.preferences && typeof trip.preferences === "object" ? { ...trip.preferences } : {},
    fixPoints: Array.isArray(trip.fixPoints) ? trip.fixPoints.slice(0, 30).map(normalizeFixPoint) : [],
    planningProfile: {
      countries: list(profile.countries, 20),
      seasonalRisks: list(profile.seasonalRisks, 30),
      routeConstraints: list(profile.routeConstraints || trip.routeConstraints, 30)
    }
  };
};

const isoForTripDay = (context, index) => new Date(Date.parse(`${context.startDate}T00:00:00Z`) + index * 86400000).toISOString().slice(0, 10);

const resolveFixPointIndex = (fix, days, context) => {
  if (fix.stageDay && fix.stageDay >= 1 && fix.stageDay <= days.length) return fix.stageDay - 1;
  if (fix.startsAt) {
    const day = clean(fix.startsAt, 10);
    const index = Math.round((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${context.startDate}T00:00:00Z`)) / 86400000);
    if (index >= 0 && index < days.length) return index;
  }
  if (fix.stageTitlePattern) {
    try {
      const matcher = new RegExp(fix.stageTitlePattern, "i");
      const index = days.findIndex((day) => matcher.test(day?.title || ""));
      if (index >= 0) return index;
    } catch (_) {}
  }
  if (fix.kind === "start") return 0;
  if (fix.kind === "end") return days.length - 1;
  return -1;
};

const resolvedFixPoints = (context, days) => context.fixPoints
  .map((fix) => ({ ...fix, dayIndex: resolveFixPointIndex(fix, days, context) }))
  .filter((fix) => fix.dayIndex >= 0)
  .sort((left, right) => left.dayIndex - right.dayIndex);

const nextProtectedAnchor = (context, days, startIndex) => resolvedFixPoints(context, days).find((fix) => fix.dayIndex > startIndex) || null;

const sourcesForTrip = (context) => {
  const selected = context.planningProfile.countries.map((country) => SOURCE_REGISTRY[country]).filter(Boolean);
  return {
    official: [...new Set(selected.flatMap((entry) => entry.official))],
    motorcycle: [...new Set(selected.flatMap((entry) => entry.motorcycle))]
  };
};

const fixPointIssue = (before, after, context) => {
  const fieldsFor = (fix) => fix.locks.length ? fix.locks : ["date", "place", "stage"];
  for (const fix of resolvedFixPoints(context, before)) {
    const prior = before[fix.dayIndex] || {};
    const next = after[fix.dayIndex] || {};
    const locks = fieldsFor(fix);
    if (locks.includes("stage") && clean(prior.title) !== clean(next.title)) return `${fix.title}: die geschützte Etappe wurde verändert.`;
    const placeFields = locks.includes("place")
      ? (fix.kind === "start" ? ["origin"] : fix.kind === "end" ? ["destination", "overnight"] : ["origin", "destination", "overnight"])
      : ["origin", "destination", "overnight"].filter((field) => locks.includes(field));
    if (placeFields.some((field) => clean(prior[field]) !== clean(next[field]))) return `${fix.title}: ein geschützter Ort wurde verändert.`;
    if (locks.includes("route") && ["roads", "waypoints"].some((field) => JSON.stringify(prior[field] || "") !== JSON.stringify(next[field] || ""))) return `${fix.title}: die geschützte Route wurde verändert.`;
  }
  return "";
};

const commonInstructions = (context) => {
  const sources = sourcesForTrip(context);
  return [
    `Planungsrichtlinie ${PLANNING_POLICY.id}.`,
    ...PLANNING_POLICY.principles,
    `Ausgeschlossen sind: ${PLANNING_POLICY.excludedRoads.join(", ")}.`,
    context.planningProfile.seasonalRisks.length ? `Reisespezifisch zu prüfen: ${context.planningProfile.seasonalRisks.join("; ")}.` : "",
    context.planningProfile.routeConstraints.length ? `Reisespezifische Routenbedingungen: ${context.planningProfile.routeConstraints.join("; ")}.` : "",
    sources.official.length ? `Bevorzugte offizielle Quellen für die betroffenen Länder: ${sources.official.join("; ")}.` : "Ermittle die zuständigen offiziellen Verkehrs-, Straßen-, Grenz- und Wetterquellen anhand des tatsächlichen Korridors.",
    sources.motorcycle.length ? `Zusätzliche Motorradquellen: ${sources.motorcycle.join("; ")}.` : "Ermittle zusätzlich eine belastbare aktuelle motorradspezifische Quelle.",
    "Links gehören ausschließlich in sourceChecks, niemals in Roadbook-Texte."
  ].filter(Boolean).join(" ");
};

const verificationInstructions = ({ context, singleStage, routeStyleOnly }) => `${commonInstructions(context)} Du bist die unabhängige Qualitätsprüfung. ${singleStage ? "Prüfe ausschließlich die ausgewählte Tagesetappe; alle übrigen Tage bleiben unverändert." : "Prüfe jeden bereitgestellten Fahrtag vollständig."} ${routeStyleOnly ? "Halte die verlangte Routenart direct oder scenic ein." : ""} Start, Ziel und Übernachtung jedes bereitgestellten Tages sind feste Grenzen. sourceChecks enthält für jeden Fahrtag die absolute Tagesnummer, eine direkte offizielle HTTPS-Quelle, eine davon verschiedene motorradspezifische HTTPS-Quelle, checkedAt, warnings und eine konkrete routingEvidence. Ruhetage benötigen keinen sourceCheck. Gib exakt replaceFromDay, replaceCount und gleich viele Tage zurück. decision ist immer 'Vorgeschlagene Planänderung'. Gib ausschließlich das strukturierte Ergebnis aus.`;

const routeDraftInstructions = ({ context, scopeInstruction }) => `${commonInstructions(context)} Du erstellst einen Routenentwurf für ${context.participantCount} Personen auf ${context.motorcycleCount} Motorrädern. ${scopeInstruction} Der Reiseplan behält gleich viele Kalendertage. Wenn previousDay vorhanden ist, beginnt der erste neue Tag an dessen Übernachtungsort. Jeder Folgetag beginnt am Übernachtungsort des Vortags und endet an der eigenen Übernachtung. protectedAnchor ist der nächste unveränderliche Fixpunkt und darf nicht in days aufgenommen oder verändert werden. Bereits gefahrene Tage vor replaceFromDay bleiben unverändert. sourceChecks darf im Entwurf leer sein; die verbindliche Prüfung folgt separat. Gib ausschließlich das strukturierte Ergebnis aus.`;

module.exports = { PLANNING_POLICY, SOURCE_REGISTRY, normalizeTripContext, isoForTripDay, resolveFixPointIndex, resolvedFixPoints, nextProtectedAnchor, sourcesForTrip, fixPointIssue, commonInstructions, verificationInstructions, routeDraftInstructions };
