(function (root) {
  "use strict";

  const STORAGE_KEY = "motorcycle-trip-catalog-v2";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const storedTrips = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch (_) { return {}; }
  };
  const saveStoredTrips = (trips) => localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  const tripSummary = (item, status = "draft") => ({
    id: item.trip.id,
    name: item.trip.name,
    startDate: item.trip.startDate,
    endDate: new Date(Date.parse(`${item.trip.startDate}T00:00:00Z`) + (item.days.length - 1) * 86400000).toISOString().slice(0, 10),
    status
  });
  const builtInSnapshots = () => [root.__TRIP_ADRIA_DATA__].filter((item) => item?.trip?.id);

  root.MotorcycleTripCatalog = Object.freeze({
    defaultTripId: "trip_adria_2026",
    list(publishedDefaultSnapshot) {
      const builtIns = [publishedDefaultSnapshot, ...builtInSnapshots()].filter((item) => item?.trip?.id);
      const summaries = builtIns.map((item, index) => tripSummary(item, index === 0 ? "published" : (item.planKind || "draft")));
      return [...summaries, ...Object.values(storedTrips()).filter((item) => item?.trip?.id && !summaries.some((trip) => trip.id === item.trip.id)).map((item) => tripSummary(item))];
    },
    getSnapshot(id, publishedDefaultSnapshot) {
      const builtIn = [publishedDefaultSnapshot, ...builtInSnapshots()].find((item) => item?.trip?.id === id);
      const stored = storedTrips()[id];
      const storedIsCurrent = !builtIn?.trip?.dataVersion || stored?.trip?.dataVersion === builtIn.trip.dataVersion;
      if (stored && storedIsCurrent) return clone(stored);
      return clone(builtIn || publishedDefaultSnapshot);
    },
    saveSnapshot(value) {
      if (!value?.trip?.id) throw new Error("Die Reise besitzt keine gültige ID.");
      const trips = storedTrips();
      trips[value.trip.id] = clone(value);
      saveStoredTrips(trips);
      return clone(value);
    },
    createTrip({ name, startDate, endDate, startPlace, endPlace }) {
      const start = Date.parse(`${startDate}T00:00:00Z`);
      const end = Date.parse(`${endDate}T00:00:00Z`);
      const duration = Math.round((end - start) / 86400000) + 1;
      if (!name || !Number.isFinite(start) || !Number.isFinite(end) || duration < 2 || duration > 90) throw new Error("Bitte gültige Reisedaten für 2 bis 90 Tage eingeben.");
      const id = `trip_${name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_${startDate.replaceAll("-", "")}`;
      const newDays = Array.from({ length: duration }, (_, index) => ({
        id: `${id}-${index + 1}`, day: index + 1,
        title: index === 0 ? `Start in ${startPlace}` : index === duration - 1 ? `Rückkehr nach ${endPlace}` : "Planung offen",
        type: "Planung offen", overnight: index === duration - 1 ? endPlace : startPlace, km: "", time: "", roads: "Noch nicht geplant", points: "",
        note: "Diesen Tag im Roadbook bearbeiten.", rest: true, origin: "", destination: "", waypoints: [], status: "planned", routeStyle: ""
      }));
      const created = {
        publishedVersion: new Date().toISOString(), planKind: "draft", originalDays: clone(newDays), days: newDays, accommodations: [],
        trip: {
          id, name, characterTitle: name, characterText: "Neuer Reiseentwurf. Die Tagesetappen werden im Roadbook aufgebaut.", startDate, endDate, startPlace, endPlace,
          timezone: "Europe/Zurich", utcOffset: "+02:00", participantCount: 2, motorcycleCount: 2,
          routeGeometryUrl: "",
          capabilities: { storage: "local", fullReplanning: true, originalPlan: false, downloads: false, mapNarrativeSource: "stages" },
          preferences: { routeStyle: "mixed", ridingRhythm: "relaxed", preferGoodWeather: true, asphaltOnly: true },
          planningProfile: { countries: [], seasonalRisks: ["Wetter, saisonale Sperren, Baustellen, Grenzen und Zufahrtsbeschränkungen im Reisezeitraum"], routeConstraints: [] },
          fixPoints: [
            { id: `${id}_start`, kind: "start", title: `Start in ${startPlace}`, place: startPlace, startsAt: `${startDate}T08:00:00+02:00`, locks: ["date", "origin"] },
            { id: `${id}_end`, kind: "end", title: `Rückkehr nach ${endPlace}`, place: endPlace, startsAt: `${endDate}T18:00:00+02:00`, locks: ["date", "destination", "overnight"] }
          ],
          narrativeSegments: [{ title: "Reiseentwurf", text: "Die Etappen werden im Roadbook ergänzt.", fromDay: 1, toDay: duration, mapGroup: 0 }]
        }
      };
      this.saveSnapshot(created);
      return clone(created);
    }
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
