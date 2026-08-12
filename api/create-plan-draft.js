const OPENAI_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5.1";
const FERRY_DATE = "2026-10-21";

const json = (response, status, body) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (Buffer.byteLength(raw) > 900000) throw new Error("Planungsdaten sind zu gross.");
  return JSON.parse(raw || "{}");
};

const cleanText = (value, limit = 2000) => String(value || "").trim().slice(0, limit);

const daySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "type", "overnight", "km", "time", "roads", "points", "note", "travelNote", "rest", "origin", "destination", "waypoints", "status"],
  properties: {
    title: { type: "string" },
    type: { type: "string" },
    overnight: { type: "string" },
    km: { type: "string" },
    time: { type: "string" },
    roads: { type: "string" },
    points: { type: "string" },
    note: { type: "string" },
    travelNote: { type: "string" },
    rest: { type: "boolean" },
    origin: { type: "string" },
    destination: { type: "string" },
    waypoints: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["planned", "changed", "done", "skipped"] }
  }
};

const routeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "decision", "replaceFromDay", "replaceCount", "days", "openItems"],
  properties: {
    summary: { type: "array", items: { type: "string" } },
    decision: { type: "string" },
    replaceFromDay: { type: "integer" },
    replaceCount: { type: "integer" },
    days: { type: "array", items: daySchema },
    openItems: { type: "array", items: { type: "string" } }
  }
};

const staySchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "startDate", "endDate", "nightCount", "booking", "firstChoice", "firstChoiceUrl", "alternative", "alternativeUrl", "note", "baseNote", "hideBaseline", "action"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    nightCount: { type: "integer" },
    booking: { type: "string", enum: ["", "asked", "booked"] },
    firstChoice: { type: "string" },
    firstChoiceUrl: { type: "string" },
    alternative: { type: "string" },
    alternativeUrl: { type: "string" },
    note: { type: "string" },
    baseNote: { type: "string" },
    hideBaseline: { type: "boolean" },
    action: { type: "string", enum: ["behalten", "verlaengern", "umbuchen", "stornieren", "neu", "pruefen"] }
  }
};

const accommodationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "stays", "openItems"],
  properties: {
    summary: { type: "array", items: { type: "string" } },
    stays: { type: "array", items: staySchema },
    openItems: { type: "array", items: { type: "string" } }
  }
};

const responseText = (body) => {
  if (body.output_text) return body.output_text;
  for (const item of body.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  throw new Error("ChatGPT hat keinen auswertbaren Plan geliefert.");
};

const createStructuredResponse = async ({ instructions, input, schema, name, web = false }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt auf Vercel.");
  const payload = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    store: false,
    instructions,
    input,
    reasoning: { effort: "medium" },
    text: {
      verbosity: "low",
      format: { type: "json_schema", name, strict: true, schema }
    }
  };
  if (web) payload.tools = [{ type: "web_search" }];

  const result = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const body = await result.json();
  if (!result.ok) {
    const error = new Error(body?.error?.message || `OpenAI API error ${result.status}`);
    error.status = result.status;
    throw error;
  }
  return JSON.parse(responseText(body));
};

const ferryIndexOf = (days) => days.findIndex((day) => {
  const title = cleanText(day?.title, 180);
  const type = cleanText(day?.type, 100);
  const overnight = cleanText(day?.overnight, 160);
  return /^f(a|ä)hre\b/i.test(title)
    || /^f(a|ä)hr(tag)?$/i.test(type)
    || /kabine auf der f(a|ä)hre/i.test(overnight);
});

const placeIndexOf = (days, place) => {
  const target = placeKey(place);
  if (!target) return -1;
  const exactOvernight = days.findIndex((day) => placeKey(day.overnight) === target);
  if (exactOvernight >= 0) return exactOvernight;
  const exactTitle = days.findIndex((day) => placeKey(day.title) === target);
  if (exactTitle >= 0) return exactTitle;
  return days.findIndex((day) => {
    const overnight = placeKey(day.overnight);
    const title = placeKey(day.title);
    return overnight.includes(target) || title.includes(target);
  });
};

const normalizeInputDay = (day) => ({
  title: cleanText(day?.title, 180),
  type: cleanText(day?.type, 100),
  overnight: cleanText(day?.overnight, 160),
  km: cleanText(day?.km, 40),
  time: cleanText(day?.time, 40),
  roads: cleanText(day?.roads, 300),
  points: cleanText(day?.points, 500),
  note: cleanText(day?.note, 800),
  travelNote: cleanText(day?.travelNote, 500),
  rest: Boolean(day?.rest),
  origin: cleanText(day?.origin, 180),
  destination: cleanText(day?.destination, 180),
  waypoints: Array.isArray(day?.waypoints) ? day.waypoints.slice(0, 12).map((item) => cleanText(item, 180)) : [],
  status: ["planned", "changed", "done", "skipped"].includes(day?.status) ? day.status : "planned"
});

const isoForDay = (index) => new Date(Date.UTC(2026, 8, 24) + index * 86400000).toISOString().slice(0, 10);

const expectedStays = (days) => {
  const blocks = [];
  days.forEach((day, index) => {
    const overnight = cleanText(day.overnight, 160);
    if (!overnight || /berikon/i.test(overnight)) return;
    const startDate = isoForDay(index);
    const endDate = isoForDay(index + 1);
    const previous = blocks[blocks.length - 1];
    if (previous && placesMatch(previous.title, overnight) && previous.endDate === startDate) {
      previous.endDate = endDate;
      previous.nightCount += 1;
    } else {
      blocks.push({ title: overnight, startDate, endDate, nightCount: 1 });
    }
  });
  return blocks;
};

const placeKey = (value) => cleanText(value, 200)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const placesMatch = (left, right) => {
  const a = placeKey(left);
  const b = placeKey(right);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
};

const assignAccommodationSlots = (expected, current) => {
  const unused = new Set(current.map((stay) => stay.id).filter(Boolean));
  const assigned = expected.map((stay) => {
    let id = "";
    if (stay.startDate === FERRY_DATE || /fahre|kabine/.test(placeKey(stay.title))) id = "ferry";
    else if (stay.startDate >= "2026-10-22") id = "aosta-como";
    if (!unused.has(id)) id = "";
    if (!id) {
      const target = placeKey(stay.title);
      const match = current.find((candidate) => {
        if (!unused.has(candidate.id)) return false;
        const existing = placeKey(candidate.title);
        return existing && target && (existing.includes(target) || target.includes(existing));
      });
      id = match?.id || "";
    }
    if (!id) id = Array.from(unused).find((candidate) => !["ferry", "aosta-como"].includes(candidate)) || "";
    if (!id) throw new Error("Für einen Unterkunftsstopp ist kein freier Anzeigeplatz verfügbar.");
    unused.delete(id);
    return { ...stay, slotId: id };
  });
  return { assigned, unused: Array.from(unused) };
};

const normalizeStayState = (stays, allIds) => {
  const state = Object.fromEntries(allIds.map((id) => [id, { inactive: "true" }]));
  stays.forEach((stay) => {
    state[stay.id] = {
      title: stay.title,
      startDate: stay.startDate,
      endDate: stay.endDate,
      nightCount: String(stay.nightCount),
      booking: stay.booking,
      firstChoice: stay.firstChoice,
      firstChoiceUrl: stay.firstChoiceUrl,
      alternative: stay.alternative,
      alternativeUrl: stay.alternativeUrl,
      note: stay.note,
      baseNote: stay.baseNote,
      hideBaseline: stay.hideBaseline ? "true" : "",
      inactive: ""
    };
  });
  return state;
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    json(response, 405, { error: "Nur POST ist erlaubt." });
    return;
  }

  try {
    const payload = await readBody(request);
    const submittedSecret = cleanText(payload.secret, 200);
    const configuredSecret = cleanText(process.env.ROADBOOK_PUBLISH_SECRET, 200);
    if (!configuredSecret || submittedSecret !== configuredSecret) {
      json(response, 401, { error: "Publish-PIN ist falsch." });
      return;
    }
    if (!Array.isArray(payload.days) || payload.days.length < 2) throw new Error("Der aktuelle Reiseplan fehlt.");

    const currentDays = payload.days.map(normalizeInputDay);
    const ferryIndex = ferryIndexOf(currentDays);
    if (ferryIndex < 0 || isoForDay(ferryIndex) !== FERRY_DATE) throw new Error("Der feste Fährtermin am 21.10.2026 wurde im aktuellen Plan nicht gefunden.");

    const requestedType = cleanText(payload.change?.type, 80);
    const requestedPlace = cleanText(payload.change?.place, 160);
    const placeBased = ["extend", "shorten", "skip"].includes(requestedType);
    const placeIndex = placeBased ? placeIndexOf(currentDays.slice(0, ferryIndex), requestedPlace) : -1;
    if (placeBased && placeIndex < 0) throw new Error(`Ort oder Etappe „${requestedPlace || "unbekannt"}“ wurde im aktuellen Plan nicht gefunden.`);
    const startDay = placeBased
      ? placeIndex + 1
      : Math.max(1, Math.min(ferryIndex, Number(payload.change?.startDay) || 1));
    const startIndex = startDay - 1;
    const replaceCount = ferryIndex - startIndex;
    const changeTypes = {
      extend: "Aufenthalt verlaengern",
      shorten: "Aufenthalt verkuerzen",
      skip: "Etappe oder Ausflug auslassen",
      reroute: "Ab diesem Tag neu planen",
      free: "Andere Aenderung"
    };
    const change = {
      type: changeTypes[requestedType] || requestedType,
      place: requestedPlace,
      nights: Math.max(0, Math.min(7, Number(payload.change?.nights) || 0)),
      instruction: cleanText(payload.change?.instruction, 1200)
    };

    const routePlan = await createStructuredResponse({
      name: "roadbook_route_draft",
      schema: routeSchema,
      instructions: `Du planst eine reale Motorradreise fuer zwei Personen auf zwei beladenen Triumph-Motorraedern. Plane ruhig, sicher und motorradfreundlich, nicht als Kurvenmaximierung. Keine Offroad-Strecken, Pisten, Strand- oder Waldwege. Historische Ortskerne vermeiden. Die Faehre Barcelona-Genua am 21.10.2026 mit Check-in 08:30 ist ein unverrueckbarer Fixpunkt. Der Reiseplan muss gleich viele Kalendertage behalten. Zusaetzliche Aufenthaltsnaechte muessen vor der Faehre durch Weglassen optionaler Rundfahrten oder Reservetage, Zusammenlegen oder direktere Etappen ausgeglichen werden. Entscheide pragmatisch und erklaere den Ausgleich in summary. Bereits gefahrene Tage vor replaceFromDay werden nie geaendert. Gib ausschliesslich das geforderte strukturierte Ergebnis aus.`,
      input: JSON.stringify({
        requestedChange: change,
        replaceFromDay: startDay,
        replaceCount,
        fixedFerry: { day: ferryIndex + 1, date: FERRY_DATE, checkIn: "08:30", dayData: currentDays[ferryIndex] },
        currentSegment: currentDays.slice(startIndex, ferryIndex)
      })
    });

    if (routePlan.replaceFromDay !== startDay || routePlan.replaceCount !== replaceCount || routePlan.days.length !== replaceCount) {
      throw new Error(`ChatGPT hat ${routePlan.days.length} statt ${replaceCount} benötigten Tagen geliefert.`);
    }
    const draftDays = [
      ...currentDays.slice(0, startIndex),
      ...routePlan.days.map(normalizeInputDay),
      ...currentDays.slice(ferryIndex)
    ];
    const draftFerryIndex = ferryIndexOf(draftDays);
    if (draftDays.length !== currentDays.length || draftFerryIndex !== ferryIndex || isoForDay(draftFerryIndex) !== FERRY_DATE) {
      throw new Error("Der Routenvorschlag verletzt den festen Fährtermin.");
    }

    const expected = expectedStays(draftDays);
    const accommodationContext = Array.isArray(payload.accommodations) ? payload.accommodations.slice(0, 30) : [];
    const allSlotIds = accommodationContext.map((stay) => cleanText(stay.id, 80)).filter(Boolean);
    if (expected.length > allSlotIds.length) throw new Error("Der Entwurf benötigt mehr Unterkunftsstopps als die aktuelle Unterkunftsliste aufnehmen kann.");
    const slotPlan = assignAccommodationSlots(expected, accommodationContext);

    const accommodationPlan = await createStructuredResponse({
      name: "roadbook_accommodation_draft",
      schema: accommodationSchema,
      web: true,
      instructions: `Du planst die Unterkuenfte als zwingende Folge eines bereits validierten Motorrad-Roadbooks. Gib fuer jeden erwarteten Uebernachtungsblock genau einen Eintrag in gleicher Reihenfolge aus und verwende dafuer die bereitgestellte slotId. Erhalte gebuchte Unterkuenfte, wenn Ort und Datum passen. Wenn eine gebuchte Unterkunft geaendert, verlaengert oder storniert werden muesste, setze den passenden action-Wert und nenne das deutlich in note und openItems; behaupte nie, eine Buchung sei automatisch geaendert. Suche nur fuer neue oder unpassende Stopps konkrete erste Wahl und Alternative und liefere fuer beide einen direkten HTTPS-Link zur offiziellen Unterkunftsseite oder einer serioesen Buchungsseite. Wichtig sind sichere Abstellung fuer zwei beladene Motorraeder, einfache asphaltierte Zufahrt, keine problematische Altstadt- oder ZBE-Zufahrt und moeglichst stornierbare Tarife. Verfuegbarkeit und Preis gelten immer als zu pruefen. Gib ausschliesslich das strukturierte Ergebnis aus.`,
      input: JSON.stringify({
        expectedStays: slotPlan.assigned,
        currentAccommodations: accommodationContext,
        routeChanges: routePlan.summary
      })
    });
    if (accommodationPlan.stays.length !== expected.length) {
      throw new Error(`ChatGPT hat ${accommodationPlan.stays.length} statt ${expected.length} Unterkunftsstopps geliefert.`);
    }
    accommodationPlan.stays.forEach((stay, index) => {
      const expectedStay = expected[index];
      if (stay.id !== slotPlan.assigned[index].slotId || stay.startDate !== expectedStay.startDate || stay.endDate !== expectedStay.endDate || stay.nightCount !== expectedStay.nightCount) {
        throw new Error(`Unterkunftsstopp ${index + 1} stimmt nicht mit dem Roadbook überein.`);
      }
    });

    json(response, 200, {
      ok: true,
      draft: {
        createdAt: new Date().toISOString(),
        request: change,
        summary: [...routePlan.summary, ...accommodationPlan.summary],
        decision: routePlan.decision,
        openItems: [...routePlan.openItems, ...accommodationPlan.openItems],
        days: draftDays,
        accommodations: normalizeStayState(accommodationPlan.stays, allSlotIds)
      }
    });
  } catch (error) {
    json(response, error.status || 500, { error: error.message || "Der Entwurf konnte nicht erstellt werden." });
  }
};
