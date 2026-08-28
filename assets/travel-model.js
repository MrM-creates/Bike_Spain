(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MotorcycleTravelModel = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const DAY_MS = 86400000;

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const normalizeText = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const slug = (value) => normalizeText(value).replace(/\s+/g, "-") || "unknown";
  const stableId = (prefix, seed) => `${prefix}_${slug(seed)}`;
  const addDays = (date, amount) => {
    const parsed = Date.parse(`${date}T00:00:00Z`);
    if (Number.isNaN(parsed)) throw new Error(`Ungueltiges Reisedatum: ${date}`);
    return new Date(parsed + amount * DAY_MS).toISOString().slice(0, 10);
  };
  const parseDistanceMeters = (value) => {
    const numbers = String(value || "").match(/\d+(?:[.,]\d+)?/g);
    if (!numbers?.length) return 0;
    return Math.round(Math.max(...numbers.map((item) => Number(item.replace(",", ".")))) * 1000);
  };
  const parseDurationSeconds = (value) => {
    const text = String(value || "").toLowerCase();
    const hours = Number(text.match(/(\d+(?:[.,]\d+)?)\s*h/)?.[1]?.replace(",", ".") || 0);
    const minutes = Number(text.match(/h\s*(\d{1,2})(?:\s*(?:min|m\b))?/)?.[1] || text.match(/(\d+)\s*(?:min|m\b)/)?.[1] || 0);
    return Math.round(hours * 3600 + minutes * 60);
  };
  const canonicalPlaceName = (value, aliases = {}) => {
    const raw = String(value || "").trim();
    const key = normalizeText(raw);
    if (aliases[key]) return aliases[key];
    return raw
      .replace(/,\s*(Spain|France|Italy|Switzerland)$/i, "")
      .replace(/\s*\([^)]*\)\s*$/, "")
      .trim() || "Unbekannter Ort";
  };
  const bookingStatus = (value) => value === "booked" ? "booked" : value === "asked" ? "requested" : "unknown";
  const googleMapsRouteUrl = (source) => {
    if (source.main) return source.main;
    if (!source.origin || !source.destination) return null;
    const params = new URLSearchParams({
      api: "1",
      origin: source.origin,
      destination: source.destination,
      travelmode: "driving"
    });
    if (source.waypoints?.length) params.set("waypoints", source.waypoints.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const groupStayRanges = (stays = [], stages = []) => {
    const stageIndexByDate = new Map(stages.map((stage, index) => [stage.date, index]));
    const dayNumber = (index) => stages[index]?.dayNumber || index + 1;
    const groups = new Map();
    stays.forEach((stay, stayIndex) => {
      const startIndex = stageIndexByDate.get(stay.startDate);
      if (!Number.isInteger(startIndex)) return;
      const nightCount = Math.max(1, Number(stay.nightCount) || 1);
      const endIndex = Math.min(stages.length - 1, startIndex + nightCount - 1);
      const label = startIndex === endIndex
        ? String(dayNumber(startIndex))
        : `${dayNumber(startIndex)}–${dayNumber(endIndex)}`;
      const key = stay.placeId || stay.id || `stay-${stayIndex}`;
      const group = groups.get(key) || { placeId: stay.placeId || null, stays: [] };
      group.stays.push({ stay, stayIndex, startIndex, endIndex, label });
      groups.set(key, group);
    });
    return Array.from(groups.values()).map((group) => ({
      ...group,
      label: group.stays.map((entry) => entry.label).join(" · ")
    }));
  };

  function importLegacyRoadbook(input) {
    if (!input || !Array.isArray(input.days) || !input.days.length) {
      throw new Error("Der Legacy-Import braucht mindestens einen Reisetag.");
    }
    const config = input.trip || {};
    if (!config.id || !config.name || !config.startDate) {
      throw new Error("Trip-ID, Reisename und Startdatum sind fuer den Import erforderlich.");
    }
    const aliases = Object.fromEntries(Object.entries(config.placeAliases || {}).map(([key, value]) => [normalizeText(key), value]));
    const coordinates = Object.fromEntries(Object.entries(config.placeCoordinates || {}).map(([key, value]) => [normalizeText(key), value]));
    const placesByKey = new Map();
    const getPlace = (value) => {
      const name = canonicalPlaceName(value, aliases);
      const key = normalizeText(name);
      if (!placesByKey.has(key)) {
        const coordinate = coordinates[key] || {};
        placesByKey.set(key, {
          id: stableId("place", key),
          name,
          countryCode: coordinate.countryCode || null,
          latitude: Number.isFinite(coordinate.latitude) ? coordinate.latitude : null,
          longitude: Number.isFinite(coordinate.longitude) ? coordinate.longitude : null,
          providerRefs: {}
        });
      }
      return placesByKey.get(key);
    };

    const startPlace = getPlace(config.startPlace || input.days[0].origin || "Start");
    const endPlace = getPlace(config.endPlace || input.days[input.days.length - 1].destination || "Ende");
    const routeVariants = [];
    const stages = input.days.map((source, index) => {
      const date = addDays(config.startDate, index);
      const previousOvernight = index ? input.days[index - 1].overnight : startPlace.name;
      const origin = getPlace(source.origin || previousOvernight || startPlace.name);
      const destination = getPlace(source.destination || source.overnight || origin.name);
      const fixedTransport = Boolean((config.transportMatchers || []).some((pattern) => new RegExp(pattern, "i").test(`${source.title} ${source.type}`)));
      const isRest = Boolean(source.rest);
      const samePlace = origin.id === destination.id;
      const kind = fixedTransport ? "transport" : isRest ? "rest" : samePlace ? "loop" : "ride";
      const id = stableId("stage", `${config.id}-${date}-${source.id || source.title}`);
      let activeRouteVariantId = null;
      if (!isRest && !fixedTransport) {
        const variant = {
          id: stableId("route", `${id}-active`),
          stageId: id,
          style: ["direct", "scenic"].includes(source.routeStyle)
            ? source.routeStyle
            : (/anreise|transfer|heimweg|heimfahrt|rückweg|ruckweg|rückverbindung|ruckverbindung/i.test(`${source.type} ${source.title}`) ? "direct" : "scenic"),
          distanceMeters: parseDistanceMeters(source.km),
          durationSeconds: parseDurationSeconds(source.time),
          geometry: null,
          waypointPlaceIds: (source.waypoints || []).map((name) => getPlace(name).id),
          roadSummary: String(source.roads || "").split(/[·;]/).map((item) => item.trim()).filter(Boolean),
          provider: googleMapsRouteUrl(source) ? "google-maps" : "legacy",
          providerRouteRef: googleMapsRouteUrl(source),
          checkedAt: null
        };
        routeVariants.push(variant);
        activeRouteVariantId = variant.id;
      }
      return {
        id,
        dayNumber: index + 1,
        date,
        kind,
        title: String(source.title || `Tag ${index + 1}`),
        originPlaceId: origin.id,
        destinationPlaceId: destination.id,
        activeRouteVariantId,
        status: ["planned", "changed", "done", "skipped"].includes(source.status) ? source.status : "planned",
        notes: [source.note, source.travelNote, source.alert].filter(Boolean),
        legacy: {
          day: source.day ?? index + 1,
          type: source.type || "",
          overnight: source.overnight || destination.name,
          points: source.points || ""
        }
      };
    });

    const accommodationByDate = new Map();
    (input.accommodations || []).forEach((item) => {
      if (!item?.startDate || !item?.endDate) return;
      for (let date = item.startDate; date < item.endDate; date = addDays(date, 1)) accommodationByDate.set(date, item);
    });
    const stays = [];
    const accommodationOptions = [];
    const bookings = [];
    stages.forEach((stage, index) => {
      const source = input.days[index];
      const legacyAccommodation = accommodationByDate.get(stage.date) || null;
      const overnight = canonicalPlaceName(legacyAccommodation?.title || source.overnight || endPlace.name, aliases);
      if (index === stages.length - 1 && normalizeText(overnight) === normalizeText(endPlace.name)) return;
      const place = getPlace(overnight);
      const previous = stays[stays.length - 1];
      if (previous && previous.placeId === place.id && previous.endDate === stage.date) {
        previous.endDate = addDays(stage.date, 1);
        previous.nightCount += 1;
        return;
      }
      const stay = {
        id: stableId("stay", `${config.id}-${stage.date}-${place.id}`),
        placeId: place.id,
        startDate: stage.date,
        endDate: addDays(stage.date, 1),
        nightCount: 1,
        accommodationOptionIds: [],
        selectedAccommodationId: null
      };
      if (legacyAccommodation?.currentFirstChoice) {
        const option = {
          id: stableId("accommodation", `${stay.id}-${legacyAccommodation.currentFirstChoice}`),
          stayId: stay.id,
          name: legacyAccommodation.currentFirstChoice,
          url: legacyAccommodation.currentFirstChoiceUrl || null,
          latitude: null,
          longitude: null,
          motorcycleParking: /garage|motorrad|parking/i.test(legacyAccommodation.parking || "") ? "confirmed" : "unknown",
          availability: bookingStatus(legacyAccommodation.booking) === "booked" ? "available" : bookingStatus(legacyAccommodation.booking),
          source: "legacy-accommodation-page",
          checkedAt: null
        };
        accommodationOptions.push(option);
        stay.accommodationOptionIds.push(option.id);
        stay.selectedAccommodationId = option.id;
        if (legacyAccommodation.booking) {
          bookings.push({
            id: stableId("booking", stay.id),
            stayId: stay.id,
            accommodationOptionId: option.id,
            status: bookingStatus(legacyAccommodation.booking),
            confirmationRef: null,
            protected: legacyAccommodation.booking === "booked"
          });
        }
      }
      if (legacyAccommodation?.currentAlternative) {
        const alternative = {
          id: stableId("accommodation", `${stay.id}-${legacyAccommodation.currentAlternative}`),
          stayId: stay.id,
          name: legacyAccommodation.currentAlternative,
          url: legacyAccommodation.currentAlternativeUrl || null,
          latitude: null,
          longitude: null,
          motorcycleParking: "unknown",
          availability: "unknown",
          source: "legacy-accommodation-page",
          checkedAt: null
        };
        accommodationOptions.push(alternative);
        stay.accommodationOptionIds.push(alternative.id);
      }
      stays.push(stay);
    });

    const fixPoints = (config.fixPoints || []).map((item) => {
      const matchingStage = Number.isInteger(item.stageDay)
        ? stages[item.stageDay - 1] || null
        : item.stageTitlePattern
          ? stages.find((stage) => new RegExp(item.stageTitlePattern, "i").test(stage.title))
          : item.kind === "start"
            ? stages[0]
            : item.kind === "end"
              ? stages[stages.length - 1]
              : null;
      const place = item.place ? getPlace(item.place) : null;
      return {
        id: item.id || stableId("fix", `${config.id}-${item.kind}-${item.title}`),
        tripId: config.id,
        kind: item.kind,
        title: item.title,
        placeId: place?.id || matchingStage?.destinationPlaceId || null,
        startsAt: item.startsAt || (matchingStage ? `${matchingStage.date}T00:00:00${config.utcOffset || "+02:00"}` : null),
        endsAt: item.endsAt || null,
        targetRef: matchingStage ? { type: "stage", id: matchingStage.id } : null,
        source: item.source || "import",
        lockState: "locked",
        confirmationRequired: true,
        bookingRef: item.bookingRef || null
      };
    });
    fixPoints.filter((fixPoint) => fixPoint.bookingRef && fixPoint.targetRef?.type === "stage").forEach((fixPoint) => {
      const stage = stages.find((item) => item.id === fixPoint.targetRef.id);
      const stay = stage && stays.find((item) => item.startDate <= stage.date && item.endDate > stage.date);
      if (!stay || bookings.some((booking) => booking.stayId === stay.id)) return;
      bookings.push({
        id: stableId("booking", `${stay.id}-${fixPoint.bookingRef}`),
        stayId: stay.id,
        accommodationOptionId: stay.selectedAccommodationId,
        status: "booked",
        confirmationRef: fixPoint.bookingRef,
        protected: true
      });
    });
    const narrativeSegments = (config.narrativeSegments || []).map((item, index) => ({
      id: stableId("narrative", `${config.id}-${index + 1}`),
      title: item.title,
      text: item.text,
      stageIds: stages.slice(Math.max(0, item.fromDay - 1), Math.min(stages.length, item.toDay)).map((stage) => stage.id),
      mapGroup: item.mapGroup ?? index
    }));
    const revisionId = stableId("revision", `${config.id}-${input.publishedVersion || "legacy"}`);
    const trip = {
      id: config.id,
      name: config.name,
      characterTitle: config.characterTitle || "",
      characterText: config.characterText || "",
      routeGeometryUrl: config.routeGeometryUrl || "",
      mapKmlUrl: config.mapKmlUrl || "",
      capabilities: clone(config.capabilities || {}),
      mode: "motorcycle",
      timezone: config.timezone || "Europe/Zurich",
      participantCount: config.participantCount || 1,
      motorcycleCount: config.motorcycleCount || 1,
      brief: {
        startDate: config.startDate,
        durationDays: stages.length,
        startPlaceId: startPlace.id,
        endPlaceId: endPlace.id,
        desiredPlaceIds: [],
        surpriseSuggestions: false,
        preferences: clone(config.preferences || {}),
        hardConstraints: { asphaltOnly: true }
      },
      publishedRevisionId: revisionId,
      createdAt: config.createdAt || config.startDate,
      updatedAt: input.publishedVersion || config.startDate
    };
    const revision = {
      id: revisionId,
      tripId: trip.id,
      baseRevisionId: null,
      sequence: 1,
      phase: "ready",
      stages,
      routeVariants,
      stays,
      accommodationOptions,
      bookings,
      fixPoints,
      verificationEvidence: [],
      impactReport: { changedStageIds: [], changedStayIds: [], protectedConflictIds: [] },
      narrativeSegments,
      createdAt: input.publishedVersion || config.startDate,
      source: "legacy-read-only-import"
    };
    const publishedRelease = {
      id: stableId("release", revisionId),
      tripId: trip.id,
      revisionId,
      publishedAt: input.publishedVersion || config.startDate,
      publishedBy: "legacy-import"
    };
    return {
      trip,
      places: Array.from(placesByKey.values()),
      revision,
      publishedRelease,
      source: {
        planKind: input.planKind || "unknown",
        publishedVersion: input.publishedVersion || null,
        originalDayCount: Array.isArray(input.originalDays) ? input.originalDays.length : null
      },
      parity: {
        sourceDays: input.days.length,
        stages: stages.length,
        rideStages: stages.filter((stage) => ["ride", "loop"].includes(stage.kind)).length,
        restStages: stages.filter((stage) => stage.kind === "rest").length,
        transportStages: stages.filter((stage) => stage.kind === "transport").length,
        stays: stays.length,
        sourceAccommodations: (input.accommodations || []).length,
        fixPoints: fixPoints.length
      }
    };
  }

  function assertLegacyParity(model, expected = {}) {
    const actual = model?.parity || {};
    Object.entries(expected).forEach(([key, value]) => {
      if (actual[key] !== value) throw new Error(`Datenparitaet verletzt: ${key} ist ${actual[key]}, erwartet ${value}.`);
    });
    return true;
  }

  return { importLegacyRoadbook, assertLegacyParity, groupStayRanges, stableId, addDays, parseDistanceMeters, parseDurationSeconds, normalizeText };
});
