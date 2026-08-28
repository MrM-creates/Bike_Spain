# Technische Spezifikation: generisches Motorrad-Reise- und Versionsmodell

Status: Aktiver Architekturvertrag. Der generische Planungskern und der Reisekatalog sind integriert; die serverseitige revisionsbasierte Persistenz bleibt der nächste Ausbauschritt.

## 1. Ziel und Grenzen

Das System plant ausschliesslich Motorrad-Reisen. Aus Rahmenbedingungen, Fixpunkten und Praeferenzen entsteht ein gepruefter Routenentwurf. Erst nach der Routenbestaetigung werden Aufenthalte und Unterkuenfte erzeugt oder abgeglichen. Eine explizite Gesamtfreigabe erzeugt eine unveraenderliche veroeffentlichte Planrevision und das daraus abgeleitete Roadbook.

Nicht Teil der ersten Integration:

- andere Reisearten wie Auto, Fahrrad oder OeV;
- Buchung oder Bezahlung bei Hotel- und Transportanbietern;
- soziale Reiseverzeichnisse oder oeffentliche Vorlagen;
- gleichzeitige Bearbeitung durch mehrere Nutzer.

## 2. Zentrale Begriffe

| Begriff | Bedeutung |
| --- | --- |
| Reise | Dauerhafter Container mit Name, Teilnehmern, Rahmen und Revisionen. |
| Reisebriefing | Eingaben des Users: Zeitraum, Start, Ende, Fixpunkte und Praeferenzen. |
| Ort | Normalisierter geografischer Punkt mit stabiler ID und Koordinaten. |
| Etappe | Bewegung oder Aktivitaet zwischen Orten. Eine Rundfahrt darf am selben Ort enden. |
| Aufenthalt | Zusammenhaengender Zeitraum an einem Ort, unabhaengig von einzelnen Tagesnummern. |
| Unterkunft | Option oder Buchung, die einem Aufenthalt zugeordnet ist. |
| Fixpunkt | Harte, geschuetzte Bedingung fuer Ort, Zeit, Transport, Aufenthalt oder Termin. |
| Planrevision | Unveraenderlicher Snapshot eines vollstaendigen Reiseplans. |
| Aenderungsentwurf | Neue Revision auf Basis einer bestehenden Revision. |
| Veroeffentlichung | Explizite Freigabe einer Revision als aktueller gemeinsamer Plan. |
| Roadbook | Aus einer veroeffentlichten Revision erzeugte Unterwegs-Ansicht. |

## 3. Aggregat und Beziehungen

```text
Trip
├── TripBrief
├── Places
├── FixPoints
├── PlanRevisions
│   ├── Stages
│   ├── Stays
│   │   └── AccommodationOptions / Booking
│   ├── VerificationEvidence
│   ├── NarrativeSegments
│   └── ImpactReport
└── PublishedRelease -> genau eine PlanRevision
```

`Stage`, `Stay` und `FixPoint` besitzen stabile IDs. `Tag 12` ist nur eine berechnete Anzeige aus Datum und Reihenfolge und darf nie als Fremdschluessel dienen.

## 4. Identitaet, Zeit und Geografie

- IDs sind opake UUIDs oder ULIDs, zum Beispiel `trip_...`, `stage_...`, `stay_...`.
- Alle Zeitpunkte werden intern als ISO-8601 mit Zeitzone gespeichert.
- Reisetage verwenden lokale Kalenderdaten der Reise, nicht einen fest codierten Starttag.
- `Stay.startDate` ist inklusiv, `Stay.endDate` exklusiv; `nightCount` wird berechnet.
- Orte enthalten Koordinaten und optional Provider-IDs. Anzeigenamen sind keine Identitaet.
- Etappen referenzieren `originPlaceId` und `destinationPlaceId`.
- Routen-Geometrien werden als GeoJSON oder codierte Polyline gespeichert, nie als primaere Wahrheit eines Orts.

## 5. Kernobjekte

Die folgenden Typen sind ein logischer Vertrag. Die konkrete Persistenztechnik wird spaeter separat entschieden.

```ts
type Trip = {
  id: string;
  name: string;
  mode: "motorcycle";
  timezone: string;
  participantCount: number;
  motorcycleCount: number;
  brief: TripBrief;
  publishedRevisionId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TripBrief = {
  startDate: string;
  durationDays: number;
  startPlaceId: string;
  endPlaceId: string;
  desiredPlaceIds: string[];
  surpriseSuggestions: boolean;
  preferences: {
    routeStyle: "direct" | "scenic" | "mixed";
    ridingRhythm: "relaxed" | "balanced" | "intense";
    accommodationStyle: string;
    preferGoodWeather: boolean;
  };
  hardConstraints: {
    asphaltOnly: boolean;
  };
};

type Place = {
  id: string;
  name: string;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  providerRefs: Record<string, string>;
};
```

### 5.1 Fixpunkte

```ts
type FixPoint = {
  id: string;
  tripId: string;
  kind: "start" | "end" | "place" | "transport" | "stay" | "appointment";
  title: string;
  placeId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  targetRef: { type: "stage" | "stay" | "booking"; id: string } | null;
  source: "user" | "booking" | "import";
  lockState: "locked" | "unlocked";
  confirmationRequired: boolean;
  bookingRef: string | null;
};
```

Start und Ende werden automatisch als Fixpunkte angelegt. Gebuchte Unterkuenfte und Transporte werden nicht aufgrund ihres Namens erkannt, sondern explizit als Fixpunkte modelliert.

### 5.2 Etappen und Routenvarianten

```ts
type Stage = {
  id: string;
  date: string;
  kind: "ride" | "loop" | "rest" | "transport" | "flex";
  title: string;
  originPlaceId: string;
  destinationPlaceId: string;
  activeRouteVariantId: string | null;
  status: "planned" | "changed" | "done" | "skipped";
  notes: string[];
};

type RouteVariant = {
  id: string;
  stageId: string;
  style: "direct" | "scenic" | "custom";
  distanceMeters: number;
  durationSeconds: number;
  geometry: GeoJSON.LineString | string;
  waypointPlaceIds: string[];
  roadSummary: string[];
  provider: string;
  providerRouteRef: string | null;
  checkedAt: string | null;
};
```

Eine Umschaltung `Direkt` / `Kurvig & schoen` erzeugt nur eine neue `RouteVariant`, solange Start, Ziel und Aufenthalt unveraendert bleiben.

### 5.3 Aufenthalte und Unterkuenfte

```ts
type Stay = {
  id: string;
  placeId: string;
  startDate: string;
  endDate: string;
  accommodationOptionIds: string[];
  selectedAccommodationId: string | null;
};

type AccommodationOption = {
  id: string;
  stayId: string;
  name: string;
  url: string | null;
  latitude: number | null;
  longitude: number | null;
  motorcycleParking: "confirmed" | "unknown" | "unavailable";
  availability: "available" | "requested" | "unavailable" | "unknown";
  source: string;
  checkedAt: string | null;
};

type Booking = {
  id: string;
  stayId: string;
  accommodationOptionId: string | null;
  status: "requested" | "booked" | "cancelled";
  confirmationRef: string | null;
  protected: boolean;
};
```

Unterkuenfte gehoeren zu einem Aufenthalt, nicht zu einer Tagesnummer. Eine zusaetzliche Nacht veraendert primaer `Stay.endDate`. Erst wenn sich der Ort aendert, muessen angrenzende Etappen neu berechnet werden.

## 6. Planrevisionen

```ts
type PlanRevision = {
  id: string;
  tripId: string;
  baseRevisionId: string | null;
  sequence: number;
  phase:
    | "brief"
    | "route_generated"
    | "route_verified"
    | "route_confirmed"
    | "accommodations_generated"
    | "accommodations_verified"
    | "ready";
  stages: Stage[];
  routeVariants: RouteVariant[];
  stays: Stay[];
  accommodationOptions: AccommodationOption[];
  bookings: Booking[];
  fixPoints: FixPoint[];
  verificationEvidence: VerificationEvidence[];
  impactReport: ImpactReport;
  narrativeSegments: NarrativeSegment[];
  createdAt: string;
  createdBy: string;
};
```

Regeln:

1. Revisionen sind nach ihrer Erstellung unveraenderlich.
2. Jede Aenderung erzeugt eine neue Revision mit `baseRevisionId`.
3. Jeder Phasenuebergang erzeugt eine neue Revision; die vorherige Revision wird nicht mutiert.
4. Nur eine Revision mit Phase `ready` darf veroeffentlicht werden.
5. Veroeffentlichen erzeugt einen `PublishedRelease`, aendert `Trip.publishedRevisionId` atomar und erzeugt einen Audit-Eintrag.
6. Die bisher veroeffentlichte Revision bleibt lesbar und kann erneut aktiviert werden.
7. Ein Entwurf darf niemals stillschweigend den veroeffentlichten Plan ueberschreiben.

```ts
type PublishedRelease = {
  id: string;
  tripId: string;
  revisionId: string;
  replacesReleaseId: string | null;
  publishedAt: string;
  publishedBy: string;
};
```

## 7. Aenderungswuensche und Auswirkungen

```ts
type ChangeRequest = {
  id: string;
  tripId: string;
  baseRevisionId: string;
  intent: "freeform" | "route_style" | "reroute" | "waypoint" | "stay" | "accommodation" | "fixpoint";
  instruction: string;
  scopeRefs: Array<{ type: "stage" | "stay" | "fixpoint"; id: string }>;
  requestedAt: string;
};

type ImpactReport = {
  changedStageIds: string[];
  changedStayIds: string[];
  changedFixPointIds: string[];
  preservedBookingIds: string[];
  warnings: string[];
  requiresExplicitFixPointConfirmation: boolean;
};
```

Minimale Neuberechnung:

| Aenderung | Neu berechnen |
| --- | --- |
| Direkt / kurvig | Nur Routenvariante der Etappe. |
| Neues Zwischenziel | Betroffene Etappe; Aufenthalt nur bei neuem Zielort. |
| Andere Unterkunft am gleichen Ort | Nur Unterkunftspruefung. |
| Unterkunft an anderem Ort | Aufenthalt sowie vorherige und folgende Etappe. |
| Nacht verlaengern | Aufenthalt und Kalenderfolge; nachfolgende Datumsabhaengigkeiten pruefen. |
| Ab hier neu planen | Alle abhaengigen Etappen bis zum naechsten geschuetzten Fixpunkt. |
| Fixpunkt aendern | Abhaengigen Bereich analysieren; erst nach separater Bestaetigung mutieren. |

## 8. Pruefungen und Quellen

```ts
type VerificationEvidence = {
  id: string;
  scopeRef: { type: "revision" | "stage" | "stay" | "fixpoint"; id: string };
  kind: "route" | "closure" | "weather" | "asphalt" | "accommodation" | "booking";
  status: "passed" | "warning" | "failed" | "unknown";
  summary: string;
  sourceUrl: string | null;
  provider: string;
  checkedAt: string;
  expiresAt: string | null;
};
```

- Web- und Provider-Ergebnisse benoetigen Quelle und Pruefzeitpunkt.
- Eine Route kann nur bestaetigt werden, wenn die aktuelle Routenpruefung erfolgreich oder vom User mit sichtbarer Warnung akzeptiert wurde.
- Unterkunftsplanung darf nur auf einer bestaetigten Routenrevision aufbauen.
- Ein Sprachmodell darf Entwuerfe erzeugen, aber niemals direkt veroeffentlichen.

## 9. Karte und Reiseerzaehlung

```ts
type NarrativeSegment = {
  id: string;
  revisionId: string;
  title: string;
  text: string;
  stageIds: string[];
  stayIds: string[];
  fixPointIds: string[];
  order: number;
};
```

Die Reiseerzaehlung wird aus der Planrevision erzeugt. Sie ist keine zweite Datenquelle. Klicks zwischen Karte und Text werden ueber `stageIds`, `stayIds` und `fixPointIds` synchronisiert. Nach jeder relevanten Revision wird die Erzaehlung neu erzeugt oder gezielt aktualisiert.

## 10. Provider-Schnittstellen

Die Domaene kennt keine Google-, Hotel- oder Karten-spezifischen Felder ausser neutralen Provider-Referenzen.

```ts
interface Geocoder { resolve(query: string): Promise<Place[]> }
interface MapRenderer { render(places: Place[], variants: RouteVariant[]): unknown }
interface RouteProvider { calculate(input: RouteRequest): Promise<RouteVariant[]> }
interface RouteVerifier { verify(revision: PlanRevision): Promise<VerificationEvidence[]> }
interface WeatherProvider { inspect(input: WeatherRequest): Promise<VerificationEvidence[]> }
interface AccommodationProvider { search(stay: Stay): Promise<AccommodationOption[]> }
interface ExportProvider { create(format: "google-maps" | "gpx" | "kml", revision: PlanRevision): Promise<string> }
```

Provider-Ausfaelle duerfen den veroeffentlichten Plan nicht beschaedigen. Die letzte gepruefte Revision bleibt lesbar.

## 11. API-Grenzen

Vorgesehene logische Operationen:

```text
POST /api/trips
GET  /api/trips/:tripId
POST /api/trips/:tripId/revisions
POST /api/revisions/:revisionId/generate-route
POST /api/revisions/:revisionId/verify-route
POST /api/revisions/:revisionId/confirm-route
POST /api/revisions/:revisionId/generate-accommodations
POST /api/revisions/:revisionId/verify-accommodations
POST /api/revisions/:revisionId/publish
```

Jede schreibende Operation benoetigt:

- `tripId` und erwartete `baseRevisionId`;
- Idempotency-Key;
- serverseitige Schema- und Berechtigungspruefung;
- Audit-Eintrag;
- Konfliktantwort statt Ueberschreiben bei veralteter Basisrevision.

## 12. Domaenen-Invarianten

Vor `ready` oder `published` muessen mindestens folgende Regeln gelten:

1. Start- und End-Fixpunkt existieren.
2. Jede Ortsreferenz zeigt auf einen vorhandenen `Place`.
3. Die Etappenkette ist zeitlich und geografisch kontinuierlich.
4. Rundfahrten haben mindestens zwei sinnvolle Zwischenpunkte.
5. Aufenthalte haben positive Dauer und ueberlappen sich nicht unerklaert.
6. Jede Uebernachtung ist genau einem Aufenthalt zugeordnet.
7. Geschuetzte Fixpunkte sind erhalten oder explizit bestaetigt geaendert.
8. Die Revision verwendet aktuelle Routenpruefungen.
9. Unterkuenfte basieren auf der bestaetigten Routenrevision.
10. Die veroeffentlichte Revision ist unveraenderlich.

## 13. Migration der Spanienreise

Der bestehende Production-Code bleibt in der ersten Migrationsphase unveraendert. Ein Importer liest ihn in das neue Modell ein.

| Heutiger Stand | Zielmodell |
| --- | --- |
| `currentDays[]` | `Stage[]` mit deterministisch erzeugten stabilen IDs. |
| Arrayindex / Tagesnummer | Berechnete Anzeige aus `Stage.date`; nie Identitaet. |
| `overnight` pro Tag | Zusammengefuehrte `Stay`-Bloecke. |
| `publishedAccommodationState` | `AccommodationOption[]` und `Booking[]` je `Stay`. |
| Erkennung der Faehre per Text | Expliziter `FixPoint(kind="transport")`. |
| Fest codiertes `FERRY_DATE` | Entfernt; Zeitfenster liegt ausschliesslich am beliebigen Transport-Fixpunkt der betreffenden Reise. |
| `isoForDay()` mit festem Datum | `TripBrief.startDate` plus lokale Kalenderlogik. |
| Spanien-spezifischer Storage-Key | `tripId` plus `revisionId`. |
| HTML-Datei als Planstand | Compatibility-Renderer einer veroeffentlichten Revision. |
| Direktes Ersetzen von Arrays im HTML | Atomare Veroeffentlichung einer Revision; Renderer erzeugt HTML. |

Migrationsreihenfolge:

1. Read-only-Importer und Datenvalidierung bauen.
2. Spanienreise importieren und gegen heutige Tages-, Unterkunfts- und Fixpunktdaten vergleichen.
3. Neue IDs und Revisionen nur intern speichern; bestehende Seiten weiter ausliefern.
4. Neuen Renderer im Shadow-Modus erzeugen und Ausgaben vergleichen.
5. Neue UI hinter Feature-Schalter lesen lassen; Publishing bleibt zunaechst beim bisherigen Adapter.
6. Erst nach expliziter Freigabe atomare Revision-Publikation aktivieren.

## 14. Bereits im Mockup angeglichene UX

- `Zur Reiseuebersicht` ist Navigation und nicht Teil von `Weitere Aktionen`.
- Der stabile `Trip.title` erscheint als Reisename im globalen Header. Dynamische Routenbeschreibungen gehoeren zur jeweiligen `PlanRevision` und werden in der Reiseuebersicht angezeigt, nicht als zweiter Titel.
- Innerhalb einer Reise trennen `Uebersicht` und `Roadbook` das Gesamtbild von der operativen Tagesplanung. Beide lesen dieselbe aktive Revision.
- `Reise anpassen` startet freie, reiseweite Aenderungen.
- Etappen-, Unterkunfts- und Fixpunkt-Aenderungen bleiben kontextuell beim Objekt.
- Neue Reisen entstehen nur in der Reiseuebersicht.
- Karte, Liste, Inspector und Reiseerzaehlung referenzieren dieselben Planobjekte.
- Der erste Plan ist ein Entwurf; Route und Unterkuenfte werden in getrennten Phasen bestaetigt.
- Fixpunkte sind explizit typisiert und nur nach separater Bestaetigung aenderbar.

## 15. Freigabekriterien fuer den Production-Start

Vor der ersten schreibenden Production-Migration muessen folgende Punkte nachweisbar sein:

1. Der Import der Spanienreise ist verlustfrei und wiederholbar.
2. Alle heutigen Tages- und Unterkunftsdaten haben stabile IDs.
3. Faehre, Start, Ende und Buchungen sind explizite Fixpunkte.
4. Alte und neue Ausgabe stimmen in Datum, Reihenfolge, Route und Buchungsstand ueberein.
5. Revisionserzeugung, Verifikation, Konflikterkennung und Rollback sind automatisiert getestet.
6. Publishing kann keine ungepruefte oder nicht bestaetigte Revision aktivieren.
7. Die neue UI ist hinter einem abschaltbaren Feature-Schalter.
8. Der User hat die Production-Integration ausdruecklich freigegeben.
