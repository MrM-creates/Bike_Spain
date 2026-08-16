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
  required: ["title", "type", "overnight", "km", "time", "roads", "points", "note", "travelNote", "rest", "origin", "destination", "waypoints", "status", "routeStyle"],
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
    status: { type: "string", enum: ["planned", "changed", "done", "skipped"] },
    routeStyle: { type: "string", enum: ["", "direct", "scenic"] }
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

const createStructuredResponse = async ({ instructions, input, schema, name, web = false, reasoningEffort = "low" }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY fehlt auf Vercel.");
  const payload = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    store: false,
    instructions,
    input,
    reasoning: { effort: reasoningEffort },
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
  return /^f(?:ä|ae)hre\b/i.test(title)
    || /^f(?:ä|ae)hr(tag)?$/i.test(type)
    || /kabine auf der f(?:ä|ae)hre/i.test(overnight);
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
  note: cleanText(day?.note, 1800),
  travelNote: cleanText(day?.travelNote, 500),
  rest: Boolean(day?.rest),
  origin: cleanText(day?.origin, 180),
  destination: cleanText(day?.destination, 180),
  waypoints: Array.isArray(day?.waypoints) ? day.waypoints.slice(0, 12).map((item) => cleanText(item, 180)) : [],
  status: ["planned", "changed", "done", "skipped"].includes(day?.status) ? day.status : "planned",
  routeStyle: ["direct", "scenic"].includes(day?.routeStyle) ? day.routeStyle : ""
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
  const routePlaceKey = (value) => {
    const key = placeKey(value);
    if (/\b(?:la patacona|alboraya|olympia hotel)\b/.test(key)) return "la patacona";
    return key;
  };
  const a = routePlaceKey(left);
  const b = routePlaceKey(right);
  if (!a || !b) return false;
  const isFerryStay = (value) => /(?:^| )(?:fahre|fahrkabine|kabine an bord|kabine auf der fahre)(?: |$)/.test(value);
  if (isFerryStay(a) && isFerryStay(b)) return true;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const ignored = new Set([
    "oder", "raum", "vorzugsweise", "stadtrand", "ortsrand", "randlage", "aussenbezirk",
    "gewerbegebiet", "neustadt", "spain", "france", "italy", "switzerland"
  ]);
  const tokens = (value) => new Set(value.split(" ").filter((token) => token.length >= 4 && !ignored.has(token)));
  const aTokens = tokens(a);
  const bTokens = tokens(b);
  const smaller = aTokens.size <= bTokens.size ? aTokens : bTokens;
  const larger = smaller === aTokens ? bTokens : aTokens;
  return smaller.size > 0 && Array.from(smaller).every((token) => larger.has(token));
};

const contiguousPlaceNights = (days, startIndex, place) => {
  let nights = 0;
  for (let index = startIndex; index < days.length; index += 1) {
    if (!placesMatch(days[index]?.overnight, place)) break;
    nights += 1;
  }
  return nights;
};

const departurePlace = (day) => cleanText(day?.rest ? day?.overnight : (day?.origin || day?.overnight), 180);

const protectedStartIssue = (days, lockedStart) => {
  const expected = cleanText(lockedStart?.place, 180);
  if (!expected) return "";
  const actual = departurePlace(days[0]);
  if (!actual || !placesMatch(actual, expected)) {
    return `Die Reise beginnt in ${actual || "einem unbekannten Ort"} statt am geschützten Startpunkt ${expected}.`;
  }
  return "";
};

const routeContinuityIssue = (days, startIndex, endIndex) => {
  for (let index = startIndex; index < endIndex; index += 1) {
    const day = days[index];
    const previousOvernight = cleanText(days[index - 1]?.overnight, 160);
    const departure = day.rest ? cleanText(day.overnight, 160) : cleanText(day.origin, 180);
    const dayNumber = index + 1;

    if (previousOvernight && !departure) {
      return `Tag ${dayNumber} hat keinen Ausgangsort; erwartet wird ${previousOvernight}.`;
    }
    if (previousOvernight && !placesMatch(previousOvernight, departure)) {
      return `Tag ${dayNumber} beginnt in ${departure}, obwohl Tag ${dayNumber - 1} in ${previousOvernight} endet.`;
    }
    if (!day.rest) {
      const destination = cleanText(day.destination, 180);
      if (!destination) return `Tag ${dayNumber} hat keinen Zielort.`;
      if (!placesMatch(destination, day.overnight)) {
        return `Tag ${dayNumber} endet laut Route in ${destination}, die Übernachtung ist aber in ${day.overnight}.`;
      }
    }
  }
  return "";
};

const maximumDistance = (value) => {
  const values = String(value || "").match(/\d+(?:[.,]\d+)?/g) || [];
  return values.length ? Math.max(...values.map((item) => Number(item.replace(",", ".")))) : 0;
};

const routeDetailIssue = (days, startIndex, endIndex) => {
  for (let index = startIndex; index < endIndex; index += 1) {
    const day = days[index];
    if (day.rest) continue;
    const dayNumber = index + 1;
    if (!maximumDistance(day.km)) return `Tag ${dayNumber} hat keine auswertbare Kilometerangabe.`;
    if (!/\d/.test(day.time || "")) return `Tag ${dayNumber} hat keine auswertbare Fahrzeit.`;
    if (!cleanText(day.roads, 300) || /keine (feste )?fahrroute/i.test(day.roads)) {
      return `Tag ${dayNumber} nennt keine konkrete Straßenfolge.`;
    }
    if (placesMatch(day.origin, day.destination) && day.waypoints.length < 2) {
      return `Die Rundtour an Tag ${dayNumber} benötigt mindestens zwei konkrete Wegpunkte.`;
    }
    const routeText = [day.title, day.roads, day.points, day.note, ...day.waypoints].join(" ");
    if (/\bC-?28\b/i.test(routeText) && /vielha|val d.?aran/i.test(routeText)) {
      if (!/bonaigua/i.test(routeText) || !/(n-?230|tunnel|schlechtwetteralternative)/i.test(routeText)) {
        return `Tag ${dayNumber} nutzt die C-28 bei Vielha, benennt aber Pòrt dera Bonaigua und die tiefere N-230-Tunnelalternative nicht konkret.`;
      }
    }
    if (/san glorio/i.test(routeText) && !/(hermida|n-?627|schlechtwetteralternative)/i.test(routeText)) {
      return `Tag ${dayNumber} nennt Puerto de San Glorio ohne konkrete tiefere Schlechtwetteralternative.`;
    }
  }
  return "";
};

const routeAuditSummary = (days, startIndex, endIndex) => {
  const ridingDays = days.slice(startIndex, endIndex)
    .map((day, offset) => ({ day, index: startIndex + offset, km: maximumDistance(day.km) }))
    .filter((item) => !item.day.rest);
  const longest = ridingDays.reduce((current, item) => !current || item.km > current.km ? item : current, null);
  return longest
    ? `Automatisch geprüft: ${ridingDays.length} Fahrtage; längste geplante Etappe ist Tag ${longest.index + 1} „${longest.day.title}“ mit bis zu ${longest.km} km.`
    : "Automatisch geprüft: Der geänderte Abschnitt enthält keine Fahrtage.";
};

const routeVerificationSummary = (days, startIndex, endIndex, candidateDays = days, ferryIndex = endIndex) => {
  const segment = days.slice(startIndex, endIndex);
  const restDays = segment.filter((day) => day.rest).length;
  const overnightChain = segment
    .map((day) => cleanText(day.overnight, 160))
    .filter((place, index, places) => place && (index === 0 || !placesMatch(place, places[index - 1])));
  const correctedDays = segment
    .map((day, offset) => {
      const candidate = candidateDays[startIndex + offset] || {};
      const fields = ["title", "overnight", "origin", "destination", "roads", "km", "time"];
      const routeChanged = fields.some((field) => cleanText(day[field], 500) !== cleanText(candidate[field], 500));
      const waypointsChanged = JSON.stringify(day.waypoints || []) !== JSON.stringify(candidate.waypoints || []);
      return routeChanged || waypointsChanged ? startIndex + offset + 1 : 0;
    })
    .filter(Boolean);
  const details = [
    routeAuditSummary(days, startIndex, endIndex),
    `Reiseverlauf: ${overnightChain.join(" → ")}.`,
    `Geprüfter Änderungsbereich: Tag ${startIndex + 1} bis Tag ${endIndex}; ${segment.length} Kalendertage mit ${restDays} Ruhe- oder Reservetagen.`,
    `Der feste Fährtag bleibt Tag ${ferryIndex + 1} am ${FERRY_DATE} mit Check-in 08:30.`
  ];
  if (correctedDays.length) {
    const shownDays = correctedDays.slice(0, 8).join(", ");
    const remainder = correctedDays.length > 8 ? ` sowie ${correctedDays.length - 8} weitere` : "";
    details.push(`Die automatische Prüfung hat die Routendaten an Tag ${shownDays}${remainder} konkret korrigiert.`);
  } else {
    details.push("Die automatische Prüfung hat keine technische Korrektur am vorgeschlagenen Tagesverlauf benötigt.");
  }
  const routeText = segment.map((day) => [day.title, day.roads, day.points, day.note, ...day.waypoints].join(" ")).join(" ");
  if (/san glorio/i.test(routeText)) {
    details.push("Puerto de San Glorio und eine tiefere Schlechtwetteralternative sind im geprüften Tagesverlauf konkret ausgewiesen.");
  }
  if (/\bC-?28\b/i.test(routeText) && /vielha|val d.?aran/i.test(routeText)) {
    details.push("Die C-28-Etappe bei Vielha weist Pòrt dera Bonaigua und die tiefere Alternative über N-230 und Vielha-Tunnel aus.");
  } else if (/vielha|val d.?aran/i.test(routeText) && /\bN-?230\b/i.test(routeText)) {
    details.push("Die geprüfte Verbindung nach Vielha nutzt die N-230-/Tunnelachse statt Pòrt dera Bonaigua.");
  }
  return details;
};

const assignAccommodationSlots = (expected, current) => {
  const unused = new Set(current.map((stay) => stay.id).filter(Boolean));
  const assigned = expected.map((stay) => {
    let id = "";
    if (stay.startDate === FERRY_DATE || /fahre|kabine/.test(placeKey(stay.title))) id = "ferry";
    else if (stay.startDate >= "2026-10-22") id = "aosta";
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
    if (!id) id = Array.from(unused).find((candidate) => !["ferry", "aosta"].includes(candidate)) || "";
    if (!id) throw new Error("Für einen Unterkunftsstopp ist kein freier Anzeigeplatz verfügbar.");
    unused.delete(id);
    return { ...stay, slotId: id };
  });
  return { assigned, unused: Array.from(unused) };
};

const normalizeStayState = (stays, allIds) => {
  const state = Object.fromEntries(allIds.map((id) => [id, { inactive: "true" }]));
  stays.forEach((stay, index) => {
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
      order: String(index + 1),
      inactive: ""
    };
  });
  return state;
};

const verifyAccommodationState = (days, state) => {
  const expected = expectedStays(days);
  const active = Object.entries(state || {})
    .filter(([, stay]) => stay && stay.inactive !== "true")
    .map(([id, stay]) => ({ id, ...stay, nightCount: Number(stay.nightCount || 0), order: Number(stay.order || 0) }))
    .sort((left, right) => left.order - right.order);
  if (active.length !== expected.length) {
    throw new Error(`Die Unterkunftskette enthält ${active.length} statt ${expected.length} Übernachtungsblöcken.`);
  }
  const practicalChecks = [];
  expected.forEach((stay, index) => {
    const actual = active[index];
    if (!placesMatch(actual.title, stay.title) || actual.startDate !== stay.startDate || actual.endDate !== stay.endDate || actual.nightCount !== stay.nightCount) {
      throw new Error(`Unterkunft ${index + 1} passt nicht zur Route: erwartet ${stay.title}, ${stay.startDate} bis ${stay.endDate}.`);
    }
    if (actual.id === "ferry" || /kabine|fahre/.test(placeKey(actual.title))) return;
    if (!cleanText(actual.firstChoice, 240) || !cleanText(actual.alternative, 240)) {
      practicalChecks.push(`${actual.title}: konkrete erste Wahl oder Alternative fehlt.`);
    }
    if (!/^https:\/\//i.test(actual.firstChoiceUrl || "") || !/^https:\/\//i.test(actual.alternativeUrl || "")) {
      practicalChecks.push(`${actual.title}: mindestens ein Unterkunftslink fehlt oder ist ungültig.`);
    }
    if (!/(garage|park|stell|abstell|hof)/i.test(actual.note || "")) {
      practicalChecks.push(`${actual.title}: sichere Motorradabstellung noch konkret anfragen.`);
    }
  });
  return {
    version: 1,
    summary: [`Automatisch abgeglichen: ${active.length} Übernachtungsblöcke stimmen in Ort, Reihenfolge, Datum und Nächtezahl mit der bestätigten Route überein.`],
    openItems: practicalChecks
  };
};

const preservedStay = (expected, current) => {
  const datesChanged = expected.startDate !== current.startDate || expected.endDate !== current.endDate;
  const longer = expected.startDate === current.startDate && expected.nightCount > Number(current.nightCount || 0);
  return {
    id: expected.slotId,
    title: expected.title,
    startDate: expected.startDate,
    endDate: expected.endDate,
    nightCount: expected.nightCount,
    booking: cleanText(current.booking, 30),
    firstChoice: cleanText(current.currentFirstChoice, 240),
    firstChoiceUrl: cleanText(current.currentFirstChoiceUrl, 500),
    alternative: cleanText(current.currentAlternative, 240),
    alternativeUrl: cleanText(current.currentAlternativeUrl, 500),
    note: datesChanged
      ? `Verfügbarkeit für ${expected.startDate} bis ${expected.endDate} prüfen${current.booking ? "; bestehende Buchung entsprechend anpassen" : ""}.`
      : cleanText(current.currentNote, 500),
    baseNote: "",
    hideBaseline: false,
    action: !datesChanged ? "behalten" : (longer ? "verlaengern" : (current.booking ? "umbuchen" : "pruefen"))
  };
};

const accommodationContextWithSlots = (expected, accommodationContext) => {
  const allSlotIds = accommodationContext.map((stay) => cleanText(stay.id, 80)).filter(Boolean);
  let generatedIndex = 1;
  while (allSlotIds.length < expected.length) {
    const id = `replanned-stop-${generatedIndex}`;
    generatedIndex += 1;
    if (!allSlotIds.includes(id)) allSlotIds.push(id);
  }
  const expandedContext = [
    ...accommodationContext,
    ...allSlotIds.filter((id) => !accommodationContext.some((stay) => stay.id === id)).map((id) => ({ id }))
  ];
  return { allSlotIds, expandedContext };
};

const createAccommodationPlan = async ({ draftDays, accommodationContext, routeSummary }) => {
  const expected = expectedStays(draftDays);
  const { allSlotIds, expandedContext } = accommodationContextWithSlots(expected, accommodationContext);
  const slotPlan = assignAccommodationSlots(expected, expandedContext);
  const currentById = new Map(expandedContext.map((stay) => [stay.id, stay]));
  const researchStays = slotPlan.assigned.filter((stay) => {
    const current = currentById.get(stay.slotId) || {};
    return stay.slotId !== "ferry" && (!placesMatch(stay.title, current.title) || !current.currentFirstChoice);
  });
  let researched = { summary: [], stays: [], openItems: [] };
  if (researchStays.length) {
    const accommodationStartedAt = Date.now();
    const researchChunks = [];
    for (let index = 0; index < researchStays.length; index += 6) {
      researchChunks.push(researchStays.slice(index, index + 6));
    }
    const researchResults = await Promise.all(researchChunks.map((expectedStays, chunkIndex) => createStructuredResponse({
      name: `roadbook_accommodation_draft_${chunkIndex + 1}`,
      schema: accommodationSchema,
      web: true,
      instructions: `Du planst nur die neuen oder unpassenden Unterkuenfte eines bereits validierten Motorrad-Roadbooks. Gib fuer jeden bereitgestellten Uebernachtungsblock genau einen Eintrag in gleicher Reihenfolge aus und verwende dafuer die bereitgestellte slotId. Suche eine konkrete erste Wahl und Alternative und liefere fuer beide einen direkten HTTPS-Link zur offiziellen Unterkunftsseite oder einer serioesen Buchungsseite. Wichtig sind sichere Abstellung fuer zwei beladene Motorraeder, einfache asphaltierte Zufahrt, keine problematische Altstadt- oder ZBE-Zufahrt und moeglichst stornierbare Tarife. Verfuegbarkeit und Preis gelten immer als zu pruefen. Gib ausschliesslich das strukturierte Ergebnis aus.`,
      input: JSON.stringify({ expectedStays, routeChanges: routeSummary })
    })));
    researchResults.forEach((result, index) => {
      if (result.stays.length !== researchChunks[index].length) {
        throw new Error(`ChatGPT hat in Unterkunftsgruppe ${index + 1} ${result.stays.length} statt ${researchChunks[index].length} Stopps geliefert.`);
      }
    });
    researched = {
      summary: researchResults.flatMap((result) => result.summary),
      stays: researchResults.flatMap((result) => result.stays),
      openItems: researchResults.flatMap((result) => result.openItems)
    };
    console.log(JSON.stringify({ level: "info", message: "hotel research completed", ms: Date.now() - accommodationStartedAt, count: researchStays.length, chunks: researchChunks.length }));
  }
  const researchedById = new Map(researched.stays.map((stay) => [stay.id, stay]));
  const accommodationStays = slotPlan.assigned.map((stay, index) => {
    const researchedStay = researchedById.get(stay.slotId);
    if (researchedStay) {
      if (researchedStay.startDate !== stay.startDate || researchedStay.endDate !== stay.endDate || researchedStay.nightCount !== stay.nightCount) {
        throw new Error(`Unterkunftsstopp ${index + 1} stimmt nicht mit dem Roadbook überein.`);
      }
      return researchedStay;
    }
    return preservedStay(stay, currentById.get(stay.slotId) || {});
  });
  const accommodationOpenItems = accommodationStays
    .filter((stay) => stay.action !== "behalten")
    .map((stay) => `${stay.title}: ${stay.note}`);
  const researchedLabel = researchStays.length === 1 ? "1 neuer Stopp" : `${researchStays.length} neue Stopps`;
  return {
    accommodations: normalizeStayState(accommodationStays, allSlotIds),
    summary: researchStays.length
      ? [`Unterkünfte an die bestätigte Route angepasst; ${researchedLabel} recherchiert.`, ...researched.summary]
      : ["Bestehende Unterkunftsvorschläge übernommen und auf die bestätigte Route abgestimmt."],
    openItems: [...accommodationOpenItems, ...researched.openItems]
  };
};

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    json(response, 405, { error: "Nur POST ist erlaubt." });
    return;
  }

  try {
    const startedAt = Date.now();
    console.log(JSON.stringify({ level: "info", message: "plan draft started" }));
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

    if (payload.stage === "accommodations") {
      if (payload.routeVerified !== true || Number(payload.routeVerificationVersion) < 2) {
        throw new Error("Die Route muss vor der Unterkunftsplanung mit der aktuellen Prüfung kontrolliert werden.");
      }
      const continuityIssue = routeContinuityIssue(currentDays, 1, ferryIndex);
      if (continuityIssue) throw new Error(`Der bestätigte Routenentwurf ist nicht durchgängig: ${continuityIssue}`);
      const accommodationContext = Array.isArray(payload.accommodations) ? payload.accommodations.slice(0, 30) : [];
      const routeSummary = Array.isArray(payload.routeSummary)
        ? payload.routeSummary.slice(0, 30).map((item) => cleanText(item, 800)).filter(Boolean)
        : [];
      const accommodationPlan = await createAccommodationPlan({ draftDays: currentDays, accommodationContext, routeSummary });
      const accommodationAudit = verifyAccommodationState(currentDays, accommodationPlan.accommodations);
      json(response, 200, { ok: true, accommodationPlan, accommodationAudit });
      console.log(JSON.stringify({ level: "info", message: "accommodation draft completed", ms: Date.now() - startedAt }));
      return;
    }

    if (payload.stage === "verify-accommodations") {
      const accommodationAudit = verifyAccommodationState(currentDays, payload.accommodations || {});
      json(response, 200, { ok: true, accommodationAudit });
      console.log(JSON.stringify({ level: "info", message: "accommodation verification completed", ms: Date.now() - startedAt }));
      return;
    }

    if (payload.stage === "verify-route") {
      const replaceFromDay = Math.max(1, Math.min(ferryIndex, Number(payload.replaceFromDay) || 1));
      const startIndex = replaceFromDay - 1;
      const routeStyleOnly = payload.change?.scope === "route-style";
      const replaceCount = routeStyleOnly ? 1 : ferryIndex - startIndex;
      const endIndex = startIndex + replaceCount;
      const verificationStartedAt = Date.now();
      const verificationInstructions = `Du bist die unabhaengige Qualitaetspruefung fuer ein Motorrad-Roadbook. Pruefe den Kandidaten mit Websuche und korrigiere ihn direkt, bevor der Nutzer ihn sieht. Start, Ziel und Uebernachtung jedes bereitgestellten Tages sind feste Grenzen und duerfen nicht veraendert werden. ${routeStyleOnly ? "Pruefe ausschliesslich die einzelne ausgewaehlte Tagesetappe. Halte die in routeStyle verlangte Routenart ein: direct bedeutet eine nachvollziehbare direkte Strassenverbindung ohne landschaftliche Umwege; scenic bedeutet eine kurvige, asphaltierte Motorradroute mit konkreten sinnvollen Wegpunkten." : "Pruefe jeden bereitgestellten Fahrtag vollstaendig."} Verifiziere die geografisch zusammenhaengende Strassenfolge, die Reihenfolge der Wegpunkte, plausible Kilometer und Fahrzeit sowie asphaltierte, fuer zwei beladene Motorraeder geeignete Strassen. Behandle roads als lueckenlose, geordnete Kette: Jede genannte Strasse muss an die naechste anschliessen, jeden Wegpunkt tatsaechlich erreichen und bis zum Ziel fuehren. Ergaenze alle fehlenden Anschluss- und Rueckwegstrassen. Verwende keine unbestimmten Angaben wie lokale Verbindungen, nach Tagesform oder Strasse A / Strasse B. Pruefe Rundtouren besonders streng: Die Strassenfolge muss am Uebernachtungsort beginnen, alle Wegpunkte in der angegebenen Reihenfolge erreichen und mit einer konkret genannten Rueckfahrt wieder am selben Ort enden; bei einer Stichfahrt kennzeichne dieselbe Strasse ausdruecklich als Hin- und Rueckweg. Hochpaesse und anspruchsvolle Schluchten muessen realistisch benannt sein. Fuer wetterkritische Hochgebirgsetappen braucht es eine geografisch korrekte Alternative mit vollstaendiger geordneter Strassenfolge auf tieferen Hauptstrassen, die am selben Start beginnt und am selben Tagesziel endet. Eine Etappe ueber die C-28 nach Vielha muss Poert dera Bonaigua mit Hoehe benennen und als tiefere Schlechtwetteralternative die Verbindung ueber N-230 und Vielha-Tunnel konkret ausweisen. Eine Runde ueber Puerto de San Glorio muss eine geografisch geschlossene, tiefere Alternative ab demselben Uebernachtungsort nennen. Keine Offroad-, Pisten-, Strand-, Wald- oder unnoetig schmalen Abenteuerstrassen. Bevorzuge offizielle Strassen-, Verkehrs- und Tourismusquellen; Foren, Wikipedia und Motorradblogs duerfen keine alleinige Grundlage fuer Befahrbarkeit oder Sperrlage sein. Schreibe keine Quellenlinks, Zitate oder Markdown in die Roadbook-Felder. Behaupte keine ganzjaehrige Oeffnung, wenn sie nicht offiziell belegt ist. Der erste Tag beginnt am Uebernachtungsort von previousDay; jeder Folgetag beginnt am Uebernachtungsort des Vortags. Wenn nextDay vorhanden ist, muss der letzte gepruefte Tag weiterhin lueckenlos an dessen Start anschliessen. Der Faehren-Fixpunkt bleibt unveraendert. Gib den vollstaendig korrigierten Abschnitt mit exakt replaceFromDay, replaceCount und gleich vielen Tagen aus. Jeder Fahrtag braucht konkrete Strassen, eine auswertbare Kilometerangabe und Fahrzeit. Arbeite vor der Ausgabe fuer jeden Fahrtag intern die Checkliste Start, geordnete Strassenkette, Wegpunkte, Ziel, Kilometer, Zeit und gegebenenfalls vollstaendige Alternative ab. decision ist immer 'Vorgeschlagene Planaenderung'. Gib ausschliesslich das strukturierte Ergebnis aus.`;
      const chunkSize = routeStyleOnly ? 1 : 4;
      const chunks = [];
      for (let chunkStart = startIndex; chunkStart < endIndex; chunkStart += chunkSize) {
        const chunkEnd = Math.min(endIndex, chunkStart + chunkSize);
        chunks.push({ chunkStart, chunkEnd });
      }
      const verifiedChunks = await Promise.all(chunks.map(({ chunkStart, chunkEnd }, index) => createStructuredResponse({
        name: `roadbook_verified_route_${index + 1}`,
        schema: routeSchema,
        web: true,
        reasoningEffort: routeStyleOnly ? "low" : "medium",
        instructions: `${verificationInstructions} requestedChange enthaelt die Nutzerpraeferenzen und ist verbindlich. Wenn dort ein Kilometerbereich oder ein ruhiger Rhythmus gefordert wird, muss die korrigierte Etappe diesen einhalten; entferne dafuer optionale Wegpunkte oder Umwege, ohne Start, Tagesziel oder Uebernachtung zu aendern.`,
        input: JSON.stringify({
          requestedChange: payload.change || {},
          replaceFromDay: chunkStart + 1,
          replaceCount: chunkEnd - chunkStart,
          previousDay: currentDays[chunkStart - 1] || null,
          fixedFerry: { day: ferryIndex + 1, date: FERRY_DATE, checkIn: "08:30", dayData: currentDays[ferryIndex] },
          nextDay: currentDays[chunkEnd] || null,
          candidateSegment: currentDays.slice(chunkStart, chunkEnd)
        })
      })));
      verifiedChunks.forEach((plan, index) => {
        const { chunkStart, chunkEnd } = chunks[index];
        if (plan.replaceFromDay !== chunkStart + 1 || plan.replaceCount !== chunkEnd - chunkStart || plan.days.length !== chunkEnd - chunkStart) {
          throw new Error(`Die automatische Routenpruefung hat in Teil ${index + 1} nicht alle benoetigten Reisetage zurueckgegeben.`);
        }
        plan.days.forEach((day, dayIndex) => {
          const candidate = currentDays[chunkStart + dayIndex];
          const checked = normalizeInputDay(day);
          const movedBoundary = !placesMatch(candidate.overnight, checked.overnight)
            || ["origin", "destination"].some((field) => candidate[field] && !placesMatch(candidate[field], checked[field]));
          if (movedBoundary || candidate.rest !== checked.rest) {
            throw new Error(`Die automatische Routenpruefung hat in Teil ${index + 1} Start, Ziel oder Uebernachtung veraendert.`);
          }
        });
      });
      const verifiedPlan = {
        replaceFromDay,
        replaceCount,
        days: verifiedChunks.flatMap((plan) => plan.days),
        openItems: verifiedChunks.flatMap((plan) => plan.openItems || [])
      };
      if (verifiedPlan.replaceFromDay !== replaceFromDay || verifiedPlan.replaceCount !== replaceCount || verifiedPlan.days.length !== replaceCount) {
        throw new Error("Die automatische Routenprüfung hat nicht alle benötigten Reisetage zurückgegeben.");
      }
      if (routeStyleOnly) {
        const candidate = currentDays[startIndex];
        const verified = normalizeInputDay(verifiedPlan.days[0]);
        const fixedFields = ["origin", "destination", "overnight"];
        if (fixedFields.some((field) => !placesMatch(candidate[field], verified[field])) || candidate.rest !== verified.rest) {
          throw new Error("Die automatische Routenprüfung hat Start, Ziel oder Übernachtung der ausgewählten Etappe verändert.");
        }
        if (candidate.routeStyle && verified.routeStyle !== candidate.routeStyle) {
          throw new Error("Die automatische Routenprüfung hat die gewählte Routenart nicht beibehalten.");
        }
      }
      const verifiedDays = [
        ...currentDays.slice(0, startIndex),
        ...verifiedPlan.days.map(normalizeInputDay),
        ...currentDays.slice(endIndex)
      ];
      const verifiedFerryIndex = ferryIndexOf(verifiedDays);
      if (verifiedDays.length !== currentDays.length || verifiedFerryIndex !== ferryIndex || isoForDay(verifiedFerryIndex) !== FERRY_DATE) {
        throw new Error("Die automatisch geprüfte Route verletzt den festen Fährtermin.");
      }
      const lockedStart = payload.lockedStart && typeof payload.lockedStart === "object" ? payload.lockedStart : null;
      const startIssue = protectedStartIssue(verifiedDays, lockedStart);
      if (startIssue) throw new Error(`Die automatische Routenprüfung verletzt einen Fixpunkt: ${startIssue}`);
      const continuityEndIndex = routeStyleOnly ? endIndex : ferryIndex;
      let continuityIssue = routeContinuityIssue(verifiedDays, startIndex, continuityEndIndex);
      if (!continuityIssue && routeStyleOnly && verifiedDays[endIndex]) {
        const nextDeparture = cleanText(verifiedDays[endIndex].origin || verifiedDays[endIndex].overnight, 180);
        if (nextDeparture && !placesMatch(verifiedDays[endIndex - 1].overnight, nextDeparture)) {
          continuityIssue = `Tag ${endIndex + 1} beginnt in ${nextDeparture}, obwohl Tag ${endIndex} in ${verifiedDays[endIndex - 1].overnight} endet.`;
        }
      }
      if (continuityIssue) throw new Error(`Die automatische Routenprüfung ist nicht durchgängig: ${continuityIssue}`);
      const detailIssue = routeDetailIssue(verifiedDays, startIndex, endIndex);
      if (detailIssue) throw new Error(`Die automatische Routenprüfung ist unvollständig: ${detailIssue}`);
      const lockedStay = payload.lockedStay && typeof payload.lockedStay === "object" ? payload.lockedStay : null;
      if (lockedStay?.place && Number.isInteger(Number(lockedStay.startIndex)) && Number.isInteger(Number(lockedStay.nights))) {
        const actualNights = contiguousPlaceNights(verifiedDays, Number(lockedStay.startIndex), cleanText(lockedStay.place, 160));
        if (actualNights !== Number(lockedStay.nights)) {
          throw new Error(`Die automatische Routenprüfung hat den bestätigten Aufenthalt in ${cleanText(lockedStay.place, 160)} verändert.`);
        }
      }
      const decision = "Vorgeschlagene Planänderung";
      json(response, 200, {
        ok: true,
        verifiedDraft: {
          createdAt: new Date().toISOString(),
          phase: "route",
          verified: true,
          verificationVersion: 2,
          replaceFromDay,
          replaceCount,
          lockedStay,
          lockedStart,
          request: payload.change || {},
          summary: routeVerificationSummary(verifiedDays, startIndex, endIndex, currentDays, ferryIndex),
          decision,
          openItems: verifiedPlan.openItems,
          days: verifiedDays
        }
      });
      console.log(JSON.stringify({ level: "info", message: "route verification completed", ms: Date.now() - verificationStartedAt, replaceCount }));
      return;
    }

    const requestedType = cleanText(payload.change?.type, 80);
    const requestedPlace = cleanText(payload.change?.place, 160);
    const requestedInstruction = cleanText(payload.change?.instruction, 1200);
    if (["reroute", "free"].includes(requestedType) && !requestedInstruction) {
      throw new Error("Bitte beschreibe die gewünschte Richtung oder Anpassung.");
    }
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
      free: "Weitere Anpassung"
    };
    const change = {
      type: changeTypes[requestedType] || requestedType,
      startDay,
      place: requestedPlace,
      nights: Math.max(0, Math.min(7, Number(payload.change?.nights) || 0)),
      instruction: requestedInstruction
    };
    const currentPlaceNights = placeBased ? contiguousPlaceNights(currentDays, placeIndex, requestedPlace) : null;
    const targetPlaceNights = requestedType === "extend"
      ? currentPlaceNights + change.nights
      : (requestedType === "shorten" ? Math.max(0, currentPlaceNights - change.nights) : null);
    const requestedChange = {
      ...change,
      currentNightsAtPlace: currentPlaceNights,
      targetNightsAtPlace: targetPlaceNights
    };
    const lockedStart = startIndex === 0 ? { place: departurePlace(currentDays[0]) } : null;

    const routeStartedAt = Date.now();
    const changeScopeInstruction = requestedType === "reroute"
      ? "Der Nutzer will den Reiseverlauf ab replaceFromDay bewusst neu ausrichten. Behandle instruction als Zielbild fuer Richtung, Regionen und Wunschorte. Du darfst alle Tage ab dort bis zur Faehre neu aufbauen."
      : (requestedType === "free"
        ? "Setze die beschriebene Anpassung ab replaceFromDay um. Behalte nicht betroffene Orte, Etappen und Ruhetage moeglichst unveraendert und aendere nur, was zur konsistenten Umsetzung notwendig ist."
        : "Setze die konkrete Aenderung um und halte den uebrigen Verlauf so stabil wie sinnvoll.");
    const routeInstructions = `Du planst eine reale Motorradreise fuer zwei Personen auf zwei beladenen Triumph-Motorraedern. Durchsuche fuer jede geaenderte Fahrtetappe aktuelle Websites, bevor du die Route festlegst. Bevorzuge offizielle Strassenbehoerden, Pass- und Verkehrsstellen, Faehrenbetreiber sowie serioese lokale Tourismus- und Kartenquellen. Pruefe Strassenverlauf, Asphaltierung, saisonale Passrisiken, dauerhafte Beschraenkungen, Umweltzonen und problematische Altstadtzufahrten. Unterscheide klar zwischen strukturellen oder saisonalen Risiken und einer nur heute bestehenden temporaeren Sperrung; eine aktuelle Tagesmeldung darf nicht ungeprueft als Zustand fuer September oder Oktober 2026 behandelt werden. Plane ruhig, sicher und motorradfreundlich, nicht als Kurvenmaximierung. Keine Offroad-Strecken, Pisten, Strand- oder Waldwege. Historische Ortskerne vermeiden. Die Faehre Barcelona-Genua am 21.10.2026 mit Check-in 08:30 ist ein unverrueckbarer Fixpunkt. Der Reiseplan muss gleich viele Kalendertage behalten. ${changeScopeInstruction} Wenn previousDay vorhanden ist, muss der erste neue Tag an dessen Uebernachtungsort beginnen. Danach muss jede Etappe am Uebernachtungsort des Vortags beginnen und am eigenen Uebernachtungsort enden; es darf keine Ortsluecken oder gedanklichen Transfers geben. Verwende nur tatsaechlich zusammenhaengende Strassen und plausible Distanzen. Bewerte Hochpaesse in den Pyrenaeen und Picos Anfang Oktober realistisch: Paesse ueber 1.800 m muessen in note ausdruecklich benannt werden und eine konkrete Schlechtwetteralternative auf tieferen Hauptstrassen erhalten. Bezeichne solche Etappen nicht als passfrei oder harmlos. Jede Rundtour braucht konkrete asphaltierte Wegpunkte in sinnvoller Reihenfolge, damit der Google-Maps-Export die beabsichtigte Strecke abbildet. Bei Verlaengern oder Verkuerzen ist targetNightsAtPlace eine harte Vorgabe fuer die gesamte Anzahl aufeinanderfolgender Uebernachtungen am gewuenschten Ort; nights bezeichnet nur die hinzukommenden oder wegfallenden Naechte. Zusaetzliche Aufenthaltsnaechte muessen vor der Faehre durch Weglassen optionaler Rundfahrten oder Reservetage, Zusammenlegen oder direktere Etappen ausgeglichen werden. Entscheide pragmatisch und erklaere den Ausgleich in summary. Bereits gefahrene Tage vor replaceFromDay werden nie geaendert. Gib ausschliesslich das geforderte strukturierte Ergebnis aus.`;
    const routeInput = {
      requestedChange,
      replaceFromDay: startDay,
      replaceCount,
      previousDay: currentDays[startIndex - 1] || null,
      fixedFerry: { day: ferryIndex + 1, date: FERRY_DATE, checkIn: "08:30", dayData: currentDays[ferryIndex] },
      currentSegment: currentDays.slice(startIndex, ferryIndex)
    };
    const requestRoutePlan = (input, instructions = routeInstructions) => createStructuredResponse({
      name: "roadbook_route_draft",
      schema: routeSchema,
      web: true,
      instructions,
      input: JSON.stringify(input)
    });
    const assembleDraftDays = (plan) => {
      if (plan.replaceFromDay !== startDay || plan.replaceCount !== replaceCount || plan.days.length !== replaceCount) {
        throw new Error(`ChatGPT hat ${plan.days.length} statt ${replaceCount} benötigten Tagen geliefert.`);
      }
      const days = [
        ...currentDays.slice(0, startIndex),
        ...plan.days.map(normalizeInputDay),
        ...currentDays.slice(ferryIndex)
      ];
      const draftFerryIndex = ferryIndexOf(days);
      if (days.length !== currentDays.length || draftFerryIndex !== ferryIndex || isoForDay(draftFerryIndex) !== FERRY_DATE) {
        throw new Error("Der Routenvorschlag verletzt den festen Fährtermin.");
      }
      return days;
    };

    let routePlan = await requestRoutePlan(routeInput);
    let draftDays = assembleDraftDays(routePlan);
    const initialStartIssue = protectedStartIssue(draftDays, lockedStart);
    if (initialStartIssue) {
      throw new Error(`${initialStartIssue} Der aktuelle Plan wurde nicht verändert.`);
    }
    if (targetPlaceNights !== null) {
      let actualNights = contiguousPlaceNights(draftDays, placeIndex, requestedPlace);
      if (actualNights !== targetPlaceNights) {
        routePlan = await requestRoutePlan({
          ...routeInput,
          previousInvalidPlan: routePlan,
          correction: `Der vorherige Vorschlag enthielt ${actualNights} statt exakt ${targetPlaceNights} aufeinanderfolgende Uebernachtungen in ${requestedPlace}. Korrigiere dies und halte alle anderen Vorgaben ein.`
        }, `${routeInstructions} Der vorherige Vorschlag hat die harte Zielzahl der Uebernachtungen verletzt. Korrigiere ihn exakt; targetNightsAtPlace darf weder ueber- noch unterschritten werden.`);
        draftDays = assembleDraftDays(routePlan);
        actualNights = contiguousPlaceNights(draftDays, placeIndex, requestedPlace);
        if (actualNights !== targetPlaceNights) {
          throw new Error(`Der Entwurf enthält ${actualNights} statt exakt ${targetPlaceNights} Nächten in ${requestedPlace}. Der aktuelle Plan wurde nicht verändert.`);
        }
      }
    }
    let continuityIssue = routeContinuityIssue(draftDays, startIndex, ferryIndex);
    if (continuityIssue) {
      routePlan = await requestRoutePlan({
        ...routeInput,
        previousInvalidPlan: routePlan,
        correction: `Der vorherige Vorschlag hat eine unzulaessige Ortsluecke: ${continuityIssue} Korrigiere alle Tagesuebergaenge. Der erste neue Tag beginnt zwingend am Uebernachtungsort von previousDay.`
      }, `${routeInstructions} Der vorherige Vorschlag war geografisch nicht durchgaengig. Korrigiere die genannte Ortsluecke und pruefe danach jeden weiteren Tagesuebergang.`);
      draftDays = assembleDraftDays(routePlan);
      continuityIssue = routeContinuityIssue(draftDays, startIndex, ferryIndex);
      if (continuityIssue) {
        throw new Error(`Der Routenvorschlag ist nicht durchgängig: ${continuityIssue} Der aktuelle Plan wurde nicht verändert.`);
      }
      if (targetPlaceNights !== null) {
        const actualNights = contiguousPlaceNights(draftDays, placeIndex, requestedPlace);
        if (actualNights !== targetPlaceNights) {
          throw new Error(`Der korrigierte Entwurf enthält ${actualNights} statt exakt ${targetPlaceNights} Nächten in ${requestedPlace}. Der aktuelle Plan wurde nicht verändert.`);
        }
      }
    }
    console.log(JSON.stringify({ level: "info", message: "route draft completed", ms: Date.now() - routeStartedAt, replaceCount }));

    const decision = "Vorgeschlagene Planänderung";
    if (payload.stage === "route") {
      json(response, 200, {
        ok: true,
        draft: {
          createdAt: new Date().toISOString(),
          phase: "route",
          verified: false,
          replaceFromDay: startDay,
          replaceCount,
          lockedStay: targetPlaceNights === null ? null : { place: requestedPlace, startIndex: placeIndex, nights: targetPlaceNights },
          lockedStart,
          request: change,
          summary: routePlan.summary,
          decision,
          openItems: routePlan.openItems,
          days: draftDays
        }
      });
      console.log(JSON.stringify({ level: "info", message: "route-only draft completed", ms: Date.now() - startedAt }));
      return;
    }

    const accommodationContext = Array.isArray(payload.accommodations) ? payload.accommodations.slice(0, 30) : [];
    const accommodationPlan = await createAccommodationPlan({ draftDays, accommodationContext, routeSummary: routePlan.summary });

    json(response, 200, {
      ok: true,
      draft: {
        createdAt: new Date().toISOString(),
        phase: "complete",
        request: change,
        summary: [...routePlan.summary, ...accommodationPlan.summary],
        decision,
        openItems: [...routePlan.openItems, ...accommodationPlan.openItems],
        days: draftDays,
        accommodations: accommodationPlan.accommodations
      }
    });
    console.log(JSON.stringify({ level: "info", message: "plan draft completed", ms: Date.now() - startedAt }));
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "plan draft failed", error: error.message || String(error) }));
    json(response, error.status || 500, { error: error.message || "Der Entwurf konnte nicht erstellt werden." });
  }
};

module.exports._test = { accommodationContextWithSlots, contiguousPlaceNights, expectedStays, ferryIndexOf, isoForDay, maximumDistance, normalizeInputDay, placeIndexOf, placesMatch, protectedStartIssue, routeAuditSummary, routeContinuityIssue, routeDetailIssue, routeVerificationSummary, verifyAccommodationState };
