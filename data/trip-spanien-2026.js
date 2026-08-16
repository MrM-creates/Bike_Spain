window.__TRIP_DATA__ = Object.freeze({
  "schemaVersion": 1,
  "publishedVersion": "2026-08-12T16:32:07.603Z",
  "planKind": "published",
  "trip": {
    "id": "trip_spanien_2026",
    "name": "Spanien 2026",
    "startDate": "2026-09-24",
    "endDate": "2026-10-23",
    "startPlace": "Berikon",
    "endPlace": "Berikon",
    "timezone": "Europe/Zurich",
    "utcOffset": "+02:00",
    "participantCount": 2,
    "motorcycleCount": 2
  },
  "places": {
    "berikon": {
      "name": "Berikon",
      "latitude": 47.3507,
      "longitude": 8.3722
    },
    "laPatacona": {
      "name": "La Patacona",
      "latitude": 39.4953,
      "longitude": -0.3525
    },
    "monachil": {
      "name": "Monachil",
      "latitude": 37.1322,
      "longitude": -3.5398
    },
    "castelldefels": {
      "name": "Castelldefels",
      "latitude": 41.2787,
      "longitude": 1.9794
    },
    "barcelonaFerry": {
      "name": "Fährterminal Barcelona",
      "latitude": 41.3523,
      "longitude": 2.1677
    },
    "genoaFerry": {
      "name": "Fährterminal Genua",
      "latitude": 44.4107,
      "longitude": 8.9088
    }
  },
  "fixPoints": [
    {
      "id": "fix_start_berikon",
      "kind": "start",
      "title": "Start in Berikon",
      "stageDay": 1,
      "place": "Berikon",
      "startsAt": "2026-09-24T08:00:00+02:00",
      "source": "import"
    },
    {
      "id": "fix_ferry_barcelona_genoa",
      "kind": "transport",
      "title": "Fähre Barcelona → Genua",
      "stageDay": 28,
      "place": "Barcelona",
      "startsAt": "2026-10-21T08:30:00+02:00",
      "endsAt": "2026-10-22T09:00:00+02:00",
      "source": "booking",
      "bookingRef": "legacy-ferry-booking"
    },
    {
      "id": "fix_end_berikon",
      "kind": "end",
      "title": "Rückkehr nach Berikon",
      "stageDay": 30,
      "place": "Berikon",
      "startsAt": "2026-10-23T18:00:00+02:00",
      "source": "import"
    }
  ],
  "narrativeSegments": [
    {
      "title": "Über die Alpen in den Süden.",
      "text": "Von Berikon geht es über Grenoble und die Route Napoléon durch die Provence bis an die katalanische Küste.",
      "fromDay": 1,
      "toDay": 6,
      "mapGroup": 0
    },
    {
      "title": "Zwischen Küste und Hinterland.",
      "text": "Priorat, Albarracín, La Patacona und die Costa Blanca verbinden kurvige Fahrtage mit bewussten Pausen.",
      "fromDay": 7,
      "toDay": 14,
      "mapGroup": 1
    },
    {
      "title": "Andalusische Höhepunkte.",
      "text": "Monachil, die Alpujarras, Ronda und die weißen Dörfer bilden den südlichen Schwerpunkt der Reise.",
      "fromDay": 15,
      "toDay": 22,
      "mapGroup": 2
    },
    {
      "title": "Über das Inland zurück zur Fähre.",
      "text": "Úbeda, Cuenca und Zaragoza führen zurück nach Castelldefels. Die gebuchte Fähre nach Genua bleibt der geschützte Fixpunkt für den Heimweg.",
      "fromDay": 23,
      "toDay": 30,
      "mapGroup": 3
    }
  ],
  "baselineDays": [
    {
      "id": "day-1",
      "day": 1,
      "title": "Berikon – Grenoble",
      "type": "Anreise",
      "overnight": "Grenoble",
      "km": "404 km",
      "time": "4 h 20",
      "roads": "A1 und A41",
      "points": "Direkte Route ohne Innenstadt-Zwischenziele",
      "note": "Autobahnen nicht vermeiden. Französische Umweltplakette Crit’Air und Hotelgarage in Grenoble vorab klären.",
      "origin": "Berikon, Switzerland",
      "destination": "Grenoble, France",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Annecy Park-and-Ride Périaz",
          "meta": "303 km · 3 h 25",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Berikon%2C+Switzerland&destination=Parking+Relais+P%C3%A9riaz%2C+74600+Annecy%2C+France&travelmode=driving"
        },
        {
          "label": "Nur bis Chambéry",
          "meta": "349 km · 3 h 50",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Berikon%2C+Switzerland&destination=Chamb%C3%A9ry%2C+France&travelmode=driving"
        }
      ]
    },
    {
      "id": "day-2",
      "day": 2,
      "title": "Grenoble – Sisteron",
      "type": "Route Napoléon",
      "overnight": "Sisteron",
      "km": "153 km",
      "time": "3 h 05",
      "roads": "N85",
      "points": "Vizille · Laffrey · La Mure · Corps · Gap",
      "note": "N85 halten; keine kleinen Seitenpässe bei schlechtem Wetter.",
      "alert": "Google meldet derzeit eine lokale Sperrung in Gap und umfährt sie automatisch. Vor der Fahrt erneut prüfen.",
      "origin": "Grenoble, France",
      "destination": "Sisteron, France",
      "waypoints": [
        "Vizille, France",
        "Laffrey, France",
        "La Mure, France",
        "Corps, France",
        "Gap, France"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Méouge-Zusatzrunde",
          "meta": "66 km · 1 h 35",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Sisteron%2C+France&destination=Sisteron%2C+France&travelmode=driving&waypoints=Laragne-Mont%C3%A9glin%2C+France%7CCh%C3%A2teauneuf-de-Chabre%2C+France%7CGorges+de+la+M%C3%A9ouge%2C+France%7CBarret-sur-M%C3%A9ouge%2C+France%7CCh%C3%A2teauneuf-de-Chabre%2C+France"
        }
      ]
    },
    {
      "id": "day-3",
      "day": 3,
      "title": "Sisteron – Lourmarin",
      "type": "Provence / Luberon",
      "overnight": "Lourmarin",
      "km": "119 km",
      "time": "2 h 25",
      "roads": "D4085/N85 und regionale Hauptstrassen",
      "points": "Château-Arnoux · Malijai · Forcalquier · Céreste · Apt · Parkplatz Bonnieux",
      "note": "Digne ist kein Pflichtpunkt. In Bonnieux und Lourmarin am Ortsrand parkieren.",
      "origin": "Sisteron, France",
      "destination": "Lourmarin, France",
      "waypoints": [
        "Château-Arnoux-Saint-Auban, France",
        "Malijai, France",
        "Forcalquier, France",
        "Céreste, France",
        "Apt, France",
        "Parking Bonnieux, France"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Variante Manosque",
          "meta": "128 km · 2 h 35",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Sisteron%2C+France&destination=Lourmarin%2C+France&travelmode=driving&waypoints=Ch%C3%A2teau-Arnoux-Saint-Auban%2C+France%7CForcalquier%2C+France%7CManosque%2C+France%7CC%C3%A9reste%2C+France%7CApt%2C+France"
        }
      ]
    },
    {
      "id": "day-4",
      "day": 4,
      "title": "Lourmarin – Camargue – Nîmes",
      "type": "Camargue",
      "overnight": "Nîmes",
      "km": "197 km",
      "time": "3 h 20",
      "roads": "A54 · D570 · D38 · D58 · D979",
      "points": "Arles · Pont de Gau · Saintes-Maries-de-la-Mer · Aigues-Mortes",
      "note": "Nicht auf den schmalen Meerdeich Digue à la Mer fahren. Auch keine Salinenpisten, Schutzgebiets- oder Strandwege verwenden.",
      "origin": "Lourmarin, France",
      "destination": "Nîmes, France",
      "waypoints": [
        "Arles, France",
        "Parc ornithologique du Pont de Gau, France",
        "Saintes-Maries-de-la-Mer, France",
        "Aigues-Mortes, France"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-5",
      "day": 5,
      "title": "Nîmes – Carcassonne",
      "type": "Languedoc",
      "overnight": "Carcassonne",
      "km": "223 km",
      "time": "3 h 45",
      "roads": "D40 und regionale Hauptstrassen; A9/A61 als Schlechtwetteroption",
      "points": "Sommières · Pézenas · Béziers · Capestang",
      "note": "Bei Verkehr, Wind oder Regen abschnittsweise A9/A61 wählen.",
      "origin": "Nîmes, France",
      "destination": "Carcassonne, France",
      "waypoints": [
        "Sommières, France",
        "Pézenas, France",
        "Béziers, France",
        "Capestang, France"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-6",
      "day": 6,
      "title": "Carcassonne – Castelldefels",
      "type": "Transfer",
      "overnight": "Castelldefels",
      "km": "ca. 330 km",
      "time": "ca. 3 h 45",
      "roads": "A61 · A9 · AP-7 · B-23/C-32",
      "points": "Direkte Hauptstrecke; Collioure separat",
      "note": "Keine kleinen Pyrenäenpässe. Hotel nahe R2-Bahnhof und mit geschlossener Garage wählen; für Barcelona die Motorräder stehen lassen.",
      "origin": "Carcassonne, France",
      "destination": "Castelldefels, Spain",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Via Collioure",
          "meta": "ca. 370 km · 4 h 30",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Carcassonne%2C+France&destination=Castelldefels%2C+Spain&travelmode=driving&waypoints=Collioure%2C+France"
        }
      ]
    },
    {
      "id": "day-7",
      "day": 7,
      "title": "Castelldefels / Barcelona",
      "type": "Ruhetag / Stadt optional",
      "overnight": "Castelldefels",
      "roads": "Keine Fahrroute",
      "points": "Strand · R2-Bahn nach Barcelona · Wartung · sichere Garage",
      "note": "Motorräder beim Hotel lassen. Barcelona nur besuchen, wenn Energie und Lust passen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-8",
      "day": 8,
      "title": "Castelldefels – Falset",
      "type": "Küste / Priorat",
      "overnight": "Falset",
      "km": "ca. 135 km",
      "time": "ca. 2 h 20",
      "roads": "C-31/C-32 · T-11 · N-420",
      "points": "Sitges · Tarragona · Reus",
      "note": "Küstenabschnitt bei dichtem Verkehr auslassen und direkt Richtung Tarragona/Reus fahren.",
      "origin": "Castelldefels, Spain",
      "destination": "Falset, Spain",
      "waypoints": [
        "Sitges, Spain",
        "Tarragona, Spain",
        "Reus, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-9",
      "day": 9,
      "title": "Priorat-Runde",
      "type": "Kurventag",
      "overnight": "Falset",
      "km": "58 km",
      "time": "1 h 35",
      "roads": "T-710 und asphaltierte Regionalstrassen",
      "points": "Gratallops · La Vilella Baixa · Escaladei · Cornudella · Porrera",
      "note": "Langsam und kurvig. Siurana nur als bewusste zusätzliche Stichstrasse.",
      "origin": "Falset, Spain",
      "destination": "Falset, Spain",
      "waypoints": [
        "Gratallops, Spain",
        "La Vilella Baixa, Spain",
        "Escaladei, Spain",
        "Cornudella de Montsant, Spain",
        "Porrera, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-10",
      "day": 10,
      "title": "Falset – Albarracín",
      "type": "Inland",
      "overnight": "Albarracín",
      "km": "287 km",
      "time": "3 h 50",
      "roads": "N-420 · A-1512",
      "points": "Gandesa · Alcañiz · Teruel · Gea de Albarracín",
      "note": "N-420 bis Teruel und A-1512 nach Albarracín halten. Nicht in die Altstadt routen.",
      "origin": "Falset, Spain",
      "destination": "Albarracín, Spain",
      "waypoints": [
        "Gandesa, Spain",
        "Alcañiz, Spain",
        "Teruel, Spain",
        "Gea de Albarracín, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-11",
      "day": 11,
      "title": "Albarracín-Runde",
      "type": "Flex / Kurventag",
      "overnight": "Albarracín",
      "km": "78 km",
      "time": "1 h 30",
      "roads": "A-1512 und markierte Regionalstrassen",
      "points": "Orihuela del Tremedal · Bronchales · Noguera · Tramacastilla",
      "note": "Nur fahren, wenn Google klar auf Asphalt führt; sonst Ruhetag.",
      "origin": "Albarracín, Spain",
      "destination": "Albarracín, Spain",
      "waypoints": [
        "Orihuela del Tremedal, Spain",
        "Bronchales, Spain",
        "Noguera de Albarracín, Spain",
        "Tramacastilla, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-12",
      "day": 12,
      "title": "Albarracín – La Patacona",
      "type": "Transfer",
      "overnight": "La Patacona",
      "km": "ca. 190 km",
      "time": "ca. 2 h 25",
      "roads": "A-1512 · N-234/A-23 · nördliche Stadtumfahrung",
      "points": "Teruel · Segorbe",
      "note": "Bei gutem Wetter N-234-Abschnitte, sonst A-23. Ziel ist das Olympia Hotel in Alboraya; sichere Abstellung für zwei Motorräder vor der Buchung bestätigen.",
      "origin": "Albarracín, Spain",
      "destination": "Olympia Hotel, Events & Spa, Alboraya, Spain",
      "waypoints": [
        "Teruel, Spain",
        "Segorbe, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-13",
      "day": 13,
      "title": "La Patacona / Valencia",
      "type": "Ruhetag / Stadt optional",
      "overnight": "La Patacona",
      "roads": "Keine Fahrroute",
      "points": "Strand · Valencia optional · Wartung · Wäsche",
      "note": "Motorräder beim Hotel lassen und je nach Energie Strandtag oder Stadtbesuch wählen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-14",
      "day": 14,
      "title": "La Patacona – Altea",
      "type": "Costa-Blanca-Hinterland",
      "overnight": "Altea",
      "km": "ca. 200 km",
      "time": "ca. 3 h 50",
      "roads": "A-7 · CV-81 · CV-70",
      "points": "Xàtiva · Bocairent · Alcoy · Guadalest",
      "note": "Kurviger Tag. Nur eine Nacht in Altea; der frühere Altea-Flex-/Ruhetag ist gestrichen, um den späteren Start ohne Stress einzuholen.",
      "origin": "Olympia Hotel, Events & Spa, Alboraya, Spain",
      "destination": "Altea, Spain",
      "waypoints": [
        "Xàtiva, Spain",
        "Bocairent, Spain",
        "Alcoy, Spain",
        "Guadalest, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-15",
      "day": 15,
      "title": "Altea – Monachil",
      "type": "Transfer",
      "overnight": "Monachil",
      "km": "ca. 415 km",
      "time": "ca. 4 h 25",
      "roads": "A-7 · A-92N · GR-30",
      "points": "Direkte Hauptstrecke; die Route führt an Murcia, Lorca und Guadix vorbei",
      "note": "Granada-Zentrum vermeiden. Unterkunft in Monachil mit bestätigter Garage und einfacher Zufahrt wählen.",
      "origin": "Altea, Spain",
      "destination": "Monachil, Granada, Spain",
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-16",
      "day": 16,
      "title": "Monachil / Granada",
      "type": "Ruhetag / Stadt optional",
      "overnight": "Monachil",
      "roads": "Keine Fahrroute",
      "points": "Granada oder Alhambra optional · Wartung · Reserve",
      "note": "Motorräder beim Hotel lassen und für Granada Taxi oder Bus verwenden.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-17",
      "day": 17,
      "title": "Alpujarras-Runde ab Monachil",
      "type": "Kurventag",
      "overnight": "Monachil",
      "km": "ca. 150 km",
      "time": "ca. 3 h 10",
      "roads": "GR-30/N-323a · A-348 · A-4132",
      "points": "Lanjarón · Órgiva · Pampaneira",
      "note": "Pampaneira reicht als Wendepunkt; Trevélez nicht erzwingen.",
      "alert": "Google meldet derzeit Sperrungen auf der A-348 und berechnet eine Umfahrung. Kurz vor der Reise neu prüfen.",
      "origin": "Monachil, Granada, Spain",
      "destination": "Monachil, Granada, Spain",
      "waypoints": [
        "Lanjarón, Spain",
        "Órgiva, Spain",
        "Pampaneira, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-18",
      "day": 18,
      "title": "Monachil – Ronda",
      "type": "Transfer",
      "overnight": "Ronda",
      "km": "ca. 200 km",
      "time": "ca. 2 h 45",
      "roads": "GR-30 · A-92 · A-384 · A-367",
      "points": "Antequera · Campillos",
      "note": "Campillos ist die verlässliche Hauptlinie. El Burgo nur trocken und ausgeruht.",
      "origin": "Monachil, Granada, Spain",
      "destination": "Ronda, Spain",
      "waypoints": [
        "Antequera, Spain",
        "Campillos, Spain"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Variante El Burgo",
          "meta": "ca. 210 km · 3 h 10",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Monachil%2C+Granada%2C+Spain&destination=Ronda%2C+Spain&travelmode=driving&waypoints=Antequera%2C+Spain%7CEl+Burgo%2C+Spain"
        }
      ]
    },
    {
      "id": "day-19",
      "day": 19,
      "title": "Grazalema-Runde",
      "type": "Kurventag",
      "overnight": "Ronda",
      "km": "138 km",
      "time": "3 h 10",
      "roads": "A-374 · A-372 · CA-9104",
      "points": "Grazalema · Puerto de las Palomas · Zahara · El Bosque · Ubrique",
      "note": "CA-9104 nur offen, trocken und bei guter Sicht fahren.",
      "origin": "Ronda, Spain",
      "destination": "Ronda, Spain",
      "waypoints": [
        "Grazalema, Spain",
        "Puerto de las Palomas, Spain",
        "Zahara de la Sierra, Spain",
        "El Bosque, Spain",
        "Ubrique, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-20",
      "day": 20,
      "title": "Ronda",
      "type": "Wetter- und Erholungstag",
      "overnight": "Ronda",
      "roads": "Keine feste Fahrroute",
      "points": "Erholung · Wäsche · Wetterreserve · optionale kurze Runde",
      "note": "Bewusster Puffertag. Nur eine kurze Zusatzrunde fahren, wenn Wetter und Energie passen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-21",
      "day": 21,
      "title": "Ronda – Úbeda",
      "type": "Inland / Rückweg",
      "overnight": "Úbeda",
      "km": "290 km",
      "time": "3 h 45",
      "roads": "A-367 · A-384 · A-92 · A-44 · A-316",
      "points": "Antequera · Jaén · Baeza",
      "note": "Ruhiger Inlandtag; Baeza als kurzer Stopp, Úbeda als Basis.",
      "origin": "Ronda, Spain",
      "destination": "Úbeda, Spain",
      "waypoints": [
        "Antequera, Spain",
        "Jaén, Spain",
        "Baeza, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-22",
      "day": 22,
      "title": "Úbeda und Baeza",
      "type": "Ruhetag / Kultur",
      "overnight": "Úbeda",
      "roads": "Optional A-316",
      "points": "Baeza",
      "note": "Kurzer Kultur- und Puffertag.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Baeza-Runde",
          "meta": "22 km · 35 min",
          "url": "https://www.google.com/maps/dir/?api=1&origin=%C3%9Abeda%2C+Spain&destination=%C3%9Abeda%2C+Spain&travelmode=driving&waypoints=Baeza%2C+Spain"
        }
      ]
    },
    {
      "id": "day-23",
      "day": 23,
      "title": "Úbeda – Cuenca",
      "type": "Inland",
      "overnight": "Cuenca",
      "km": "406 km",
      "time": "4 h 55",
      "roads": "N-322 und regionale Hauptverbindungen",
      "points": "Alcalá del Júcar",
      "note": "Albacete wird nicht mehr als Stadtziel angefahren. In Alcalá del Júcar am Ortsrand parkieren.",
      "origin": "Úbeda, Spain",
      "destination": "Cuenca, Spain",
      "waypoints": [
        "Alcalá del Júcar, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-24",
      "day": 24,
      "title": "Cuenca",
      "type": "Ruhetag / Wetterreserve",
      "overnight": "Cuenca",
      "roads": "Keine feste Fahrroute",
      "points": "Altstadt · Erholung · Wetterreserve",
      "note": "Der zusätzliche Tag entschärft den langen Vortag und hält den Rückweg zur Fähre flexibel.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-25",
      "day": 25,
      "title": "Cuenca – Zaragoza",
      "type": "Rückverbindung",
      "overnight": "Zaragoza",
      "km": "291 km",
      "time": "4 h 10",
      "roads": "CM-210 · N-211 · A-2",
      "points": "Molina de Aragón · Calatayud",
      "note": "Landschaftlich, aber nicht auf kleinere Abkürzungen wechseln. Bei Wetter direkter fahren.",
      "origin": "Cuenca, Spain",
      "destination": "Zaragoza, Spain",
      "waypoints": [
        "Molina de Aragón, Spain",
        "Calatayud, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-26",
      "day": 26,
      "title": "Zaragoza – Castelldefels",
      "type": "Transfer",
      "overnight": "Castelldefels",
      "km": "ca. 335 km",
      "time": "ca. 3 h 45",
      "roads": "AP-2/A-2 · B-23/C-32",
      "points": "Lleida · Montblanc",
      "note": "Montblanc nur als kurzer Stopp. In Castelldefels Garage für zwei Nächte und frühe Abfahrt zum Fährterminal vorsehen.",
      "origin": "Zaragoza, Spain",
      "destination": "Castelldefels, Spain",
      "waypoints": [
        "Lleida, Spain",
        "Montblanc, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-27",
      "day": 27,
      "title": "Castelldefels / Fährvorbereitung",
      "type": "Reservetag für die Fähre",
      "overnight": "Castelldefels",
      "roads": "Keine feste Fahrroute",
      "points": "Tanken · Verpflegung · Gepäck · Dokumente · Terminalzufahrt prüfen",
      "note": "Motorräder stehen lassen und den Tag ruhig halten. Wecker, Check-in-Unterlagen und Zufahrt zum Terminal für den frühen nächsten Morgen vorbereiten.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-28",
      "day": 28,
      "title": "Fähre Barcelona – Genua",
      "type": "Fährtag",
      "overnight": "Kabine an Bord",
      "roads": "Direkte Zufahrt zum bestätigten Fährterminal",
      "points": "Check-in 08:30 · Abfahrt 10:30 · zwei Motorräder · Ankunft Genua am Folgetag 09:00",
      "note": "Frühstück und Tankstopp vorziehen. Mindestens den bestätigten Check-in-Puffer einhalten und die Terminalangabe auf dem Ticket verwenden.",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "origin": "Barcelona Ferry Terminal, Spain",
      "destination": "Genoa Ferry Terminal, Italy"
    },
    {
      "id": "day-29",
      "day": 29,
      "title": "Genua – Aosta",
      "type": "Heimweg",
      "overnight": "Aosta",
      "km": "246 km",
      "time": "2 h 40",
      "roads": "Ab Genua über A7/A26 und A5 nach Aosta",
      "points": "Ankunft Fähre 09:00 · Ausschiffung · direkte Autobahnroute",
      "note": "Zeit für die Ausschiffung lassen und danach direkt nach Aosta fahren.",
      "origin": "Genoa, Italy",
      "destination": "Aosta, Italy",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "mainLabel": "Genua – Aosta",
      "mainMeta": "246 km · 2 h 40"
    },
    {
      "id": "day-30",
      "day": 30,
      "title": "Aosta – Berikon",
      "type": "Heimfahrt",
      "overnight": "Berikon",
      "km": "359 km",
      "time": "ca. 4 h 50",
      "roads": "Ab Aosta über den Grossen St. Bernhard, Martigny und Lausanne nach Berikon",
      "points": "Alpenquerung nach Startort und Wetter",
      "note": "Alpenwetter und Passstatus vor der Abfahrt prüfen; bei Sperrung muss die Heimroute als Reiseänderung neu geplant werden.",
      "origin": "Aosta, Italy",
      "destination": "Berikon, Switzerland",
      "waypoints": [
        "Martigny, Switzerland",
        "Lausanne, Switzerland"
      ],
      "status": "planned",
      "custom": false,
      "mainLabel": "Aosta – Berikon",
      "mainMeta": "359 km · ca. 4 h 50"
    }
  ],
  "publishedDays": [
    {
      "id": "day-1",
      "day": 1,
      "title": "Berikon – Grenoble",
      "type": "Anreise",
      "overnight": "Grenoble",
      "km": "404 km",
      "time": "4 h 20",
      "roads": "A1 und A41",
      "points": "Direkte Route ohne Innenstadt-Zwischenziele",
      "note": "Autobahnen nicht vermeiden. Französische Umweltplakette Crit’Air und Hotelgarage in Grenoble vorab klären.",
      "origin": "Berikon, Switzerland",
      "destination": "Grenoble, France",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Annecy Park-and-Ride Périaz",
          "meta": "303 km · 3 h 25",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Berikon%2C+Switzerland&destination=Parking+Relais+P%C3%A9riaz%2C+74600+Annecy%2C+France&travelmode=driving"
        },
        {
          "label": "Nur bis Chambéry",
          "meta": "349 km · 3 h 50",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Berikon%2C+Switzerland&destination=Chamb%C3%A9ry%2C+France&travelmode=driving"
        }
      ]
    },
    {
      "id": "day-2",
      "day": 2,
      "title": "Grenoble – Sisteron",
      "type": "Route Napoléon",
      "overnight": "Sisteron",
      "km": "153 km",
      "time": "3 h 05",
      "roads": "N85",
      "points": "Vizille · Laffrey · La Mure · Corps · Gap",
      "note": "N85 halten; keine kleinen Seitenpässe bei schlechtem Wetter.",
      "alert": "Google meldet derzeit eine lokale Sperrung in Gap und umfährt sie automatisch. Vor der Fahrt erneut prüfen.",
      "origin": "Grenoble, France",
      "destination": "Sisteron, France",
      "waypoints": [
        "Vizille, France",
        "Laffrey, France",
        "La Mure, France",
        "Corps, France",
        "Gap, France"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Méouge-Zusatzrunde",
          "meta": "66 km · 1 h 35",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Sisteron%2C+France&destination=Sisteron%2C+France&travelmode=driving&waypoints=Laragne-Mont%C3%A9glin%2C+France%7CCh%C3%A2teauneuf-de-Chabre%2C+France%7CGorges+de+la+M%C3%A9ouge%2C+France%7CBarret-sur-M%C3%A9ouge%2C+France%7CCh%C3%A2teauneuf-de-Chabre%2C+France"
        }
      ]
    },
    {
      "id": "day-3",
      "day": 3,
      "title": "Sisteron – Lourmarin",
      "type": "Provence / Luberon",
      "overnight": "Lourmarin",
      "km": "119 km",
      "time": "2 h 25",
      "roads": "D4085/N85 und regionale Hauptstrassen",
      "points": "Château-Arnoux · Malijai · Forcalquier · Céreste · Apt · Parkplatz Bonnieux",
      "note": "Digne ist kein Pflichtpunkt. In Bonnieux und Lourmarin am Ortsrand parkieren.",
      "origin": "Sisteron, France",
      "destination": "Lourmarin, France",
      "waypoints": [
        "Château-Arnoux-Saint-Auban, France",
        "Malijai, France",
        "Forcalquier, France",
        "Céreste, France",
        "Apt, France",
        "Parking Bonnieux, France"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Variante Manosque",
          "meta": "128 km · 2 h 35",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Sisteron%2C+France&destination=Lourmarin%2C+France&travelmode=driving&waypoints=Ch%C3%A2teau-Arnoux-Saint-Auban%2C+France%7CForcalquier%2C+France%7CManosque%2C+France%7CC%C3%A9reste%2C+France%7CApt%2C+France"
        }
      ]
    },
    {
      "id": "day-4",
      "day": 4,
      "title": "Lourmarin – Camargue – Nîmes",
      "type": "Camargue",
      "overnight": "Nîmes",
      "km": "197 km",
      "time": "3 h 20",
      "roads": "A54 · D570 · D38 · D58 · D979",
      "points": "Arles · Pont de Gau · Saintes-Maries-de-la-Mer · Aigues-Mortes",
      "note": "Nicht auf den schmalen Meerdeich Digue à la Mer fahren. Auch keine Salinenpisten, Schutzgebiets- oder Strandwege verwenden.",
      "origin": "Lourmarin, France",
      "destination": "Nîmes, France",
      "waypoints": [
        "Arles, France",
        "Parc ornithologique du Pont de Gau, France",
        "Saintes-Maries-de-la-Mer, France",
        "Aigues-Mortes, France"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-5",
      "day": 5,
      "title": "Nîmes – Carcassonne",
      "type": "Languedoc",
      "overnight": "Carcassonne",
      "km": "223 km",
      "time": "3 h 45",
      "roads": "D40 und regionale Hauptstrassen; A9/A61 als Schlechtwetteroption",
      "points": "Sommières · Pézenas · Béziers · Capestang",
      "note": "Bei Verkehr, Wind oder Regen abschnittsweise A9/A61 wählen.",
      "origin": "Nîmes, France",
      "destination": "Carcassonne, France",
      "waypoints": [
        "Sommières, France",
        "Pézenas, France",
        "Béziers, France",
        "Capestang, France"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-6",
      "day": 6,
      "title": "Carcassonne – Castelldefels",
      "type": "Transfer",
      "overnight": "Castelldefels",
      "km": "ca. 330 km",
      "time": "ca. 3 h 45",
      "roads": "A61 · A9 · AP-7 · B-23/C-32",
      "points": "Direkte Hauptstrecke; Collioure separat",
      "note": "Keine kleinen Pyrenäenpässe. Hotel nahe R2-Bahnhof und mit geschlossener Garage wählen; für Barcelona die Motorräder stehen lassen.",
      "origin": "Carcassonne, France",
      "destination": "Castelldefels, Spain",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Via Collioure",
          "meta": "ca. 370 km · 4 h 30",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Carcassonne%2C+France&destination=Castelldefels%2C+Spain&travelmode=driving&waypoints=Collioure%2C+France"
        }
      ]
    },
    {
      "id": "day-7",
      "day": 7,
      "title": "Castelldefels / Barcelona",
      "type": "Ruhetag / Stadt optional",
      "overnight": "Castelldefels",
      "roads": "Keine Fahrroute",
      "points": "Strand · R2-Bahn nach Barcelona · Wartung · sichere Garage",
      "note": "Motorräder beim Hotel lassen. Barcelona nur besuchen, wenn Energie und Lust passen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-8",
      "day": 8,
      "title": "Castelldefels – Falset",
      "type": "Küste / Priorat",
      "overnight": "Falset",
      "km": "ca. 135 km",
      "time": "ca. 2 h 20",
      "roads": "C-31/C-32 · T-11 · N-420",
      "points": "Sitges · Tarragona · Reus",
      "note": "Küstenabschnitt bei dichtem Verkehr auslassen und direkt Richtung Tarragona/Reus fahren.",
      "origin": "Castelldefels, Spain",
      "destination": "Falset, Spain",
      "waypoints": [
        "Sitges, Spain",
        "Tarragona, Spain",
        "Reus, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-9",
      "day": 9,
      "title": "Priorat-Runde",
      "type": "Kurventag",
      "overnight": "Falset",
      "km": "58 km",
      "time": "1 h 35",
      "roads": "T-710 und asphaltierte Regionalstrassen",
      "points": "Gratallops · La Vilella Baixa · Escaladei · Cornudella · Porrera",
      "note": "Langsam und kurvig. Siurana nur als bewusste zusätzliche Stichstrasse.",
      "origin": "Falset, Spain",
      "destination": "Falset, Spain",
      "waypoints": [
        "Gratallops, Spain",
        "La Vilella Baixa, Spain",
        "Escaladei, Spain",
        "Cornudella de Montsant, Spain",
        "Porrera, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-10",
      "day": 10,
      "title": "Falset – Albarracín",
      "type": "Inland",
      "overnight": "Albarracín",
      "km": "287 km",
      "time": "3 h 50",
      "roads": "N-420 · A-1512",
      "points": "Gandesa · Alcañiz · Teruel · Gea de Albarracín",
      "note": "N-420 bis Teruel und A-1512 nach Albarracín halten. Nicht in die Altstadt routen.",
      "origin": "Falset, Spain",
      "destination": "Albarracín, Spain",
      "waypoints": [
        "Gandesa, Spain",
        "Alcañiz, Spain",
        "Teruel, Spain",
        "Gea de Albarracín, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-11",
      "day": 11,
      "title": "Albarracín-Runde",
      "type": "Flex / Kurventag",
      "overnight": "Albarracín",
      "km": "78 km",
      "time": "1 h 30",
      "roads": "A-1512 und markierte Regionalstrassen",
      "points": "Orihuela del Tremedal · Bronchales · Noguera · Tramacastilla",
      "note": "Nur fahren, wenn Google klar auf Asphalt führt; sonst Ruhetag.",
      "origin": "Albarracín, Spain",
      "destination": "Albarracín, Spain",
      "waypoints": [
        "Orihuela del Tremedal, Spain",
        "Bronchales, Spain",
        "Noguera de Albarracín, Spain",
        "Tramacastilla, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-12",
      "day": 12,
      "title": "Albarracín – La Patacona",
      "type": "Transfer",
      "overnight": "La Patacona",
      "km": "ca. 190 km",
      "time": "ca. 2 h 25",
      "roads": "A-1512 · N-234/A-23 · nördliche Stadtumfahrung",
      "points": "Teruel · Segorbe",
      "note": "Bei gutem Wetter N-234-Abschnitte, sonst A-23. Ziel ist das Olympia Hotel in Alboraya; sichere Abstellung für zwei Motorräder vor der Buchung bestätigen.",
      "origin": "Albarracín, Spain",
      "destination": "Olympia Hotel, Events & Spa, Alboraya, Spain",
      "waypoints": [
        "Teruel, Spain",
        "Segorbe, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-13",
      "day": 13,
      "title": "La Patacona / Valencia",
      "type": "Ruhetag / Stadt optional",
      "overnight": "La Patacona",
      "roads": "Keine Fahrroute",
      "points": "Strand · Valencia optional · Wartung · Wäsche",
      "note": "Motorräder beim Hotel lassen und je nach Energie Strandtag oder Stadtbesuch wählen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-14",
      "day": 14,
      "title": "La Patacona – Altea",
      "type": "Costa-Blanca-Hinterland",
      "overnight": "Altea",
      "km": "ca. 200 km",
      "time": "ca. 3 h 50",
      "roads": "A-7 · CV-81 · CV-70",
      "points": "Xàtiva · Bocairent · Alcoy · Guadalest",
      "note": "Kurviger Tag. Nur eine Nacht in Altea; der frühere Altea-Flex-/Ruhetag ist gestrichen, um den späteren Start ohne Stress einzuholen.",
      "origin": "Olympia Hotel, Events & Spa, Alboraya, Spain",
      "destination": "Altea, Spain",
      "waypoints": [
        "Xàtiva, Spain",
        "Bocairent, Spain",
        "Alcoy, Spain",
        "Guadalest, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-15",
      "day": 15,
      "title": "Altea – Monachil",
      "type": "Transfer",
      "overnight": "Monachil",
      "km": "ca. 415 km",
      "time": "ca. 4 h 25",
      "roads": "A-7 · A-92N · GR-30",
      "points": "Direkte Hauptstrecke; die Route führt an Murcia, Lorca und Guadix vorbei",
      "note": "Granada-Zentrum vermeiden. Unterkunft in Monachil mit bestätigter Garage und einfacher Zufahrt wählen.",
      "origin": "Altea, Spain",
      "destination": "Monachil, Granada, Spain",
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-16",
      "day": 16,
      "title": "Monachil / Granada",
      "type": "Ruhetag / Stadt optional",
      "overnight": "Monachil",
      "roads": "Keine Fahrroute",
      "points": "Granada oder Alhambra optional · Wartung · Reserve",
      "note": "Motorräder beim Hotel lassen und für Granada Taxi oder Bus verwenden.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-17",
      "day": 17,
      "title": "Alpujarras-Runde ab Monachil",
      "type": "Kurventag",
      "overnight": "Monachil",
      "km": "ca. 150 km",
      "time": "ca. 3 h 10",
      "roads": "GR-30/N-323a · A-348 · A-4132",
      "points": "Lanjarón · Órgiva · Pampaneira",
      "note": "Pampaneira reicht als Wendepunkt; Trevélez nicht erzwingen.",
      "alert": "Google meldet derzeit Sperrungen auf der A-348 und berechnet eine Umfahrung. Kurz vor der Reise neu prüfen.",
      "origin": "Monachil, Granada, Spain",
      "destination": "Monachil, Granada, Spain",
      "waypoints": [
        "Lanjarón, Spain",
        "Órgiva, Spain",
        "Pampaneira, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-18",
      "day": 18,
      "title": "Monachil – Ronda",
      "type": "Transfer",
      "overnight": "Ronda",
      "km": "ca. 200 km",
      "time": "ca. 2 h 45",
      "roads": "GR-30 · A-92 · A-384 · A-367",
      "points": "Antequera · Campillos",
      "note": "Campillos ist die verlässliche Hauptlinie. El Burgo nur trocken und ausgeruht.",
      "origin": "Monachil, Granada, Spain",
      "destination": "Ronda, Spain",
      "waypoints": [
        "Antequera, Spain",
        "Campillos, Spain"
      ],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Variante El Burgo",
          "meta": "ca. 210 km · 3 h 10",
          "url": "https://www.google.com/maps/dir/?api=1&origin=Monachil%2C+Granada%2C+Spain&destination=Ronda%2C+Spain&travelmode=driving&waypoints=Antequera%2C+Spain%7CEl+Burgo%2C+Spain"
        }
      ]
    },
    {
      "id": "day-19",
      "day": 19,
      "title": "Grazalema-Runde",
      "type": "Kurventag",
      "overnight": "Ronda",
      "km": "138 km",
      "time": "3 h 10",
      "roads": "A-374 · A-372 · CA-9104",
      "points": "Grazalema · Puerto de las Palomas · Zahara · El Bosque · Ubrique",
      "note": "CA-9104 nur offen, trocken und bei guter Sicht fahren.",
      "origin": "Ronda, Spain",
      "destination": "Ronda, Spain",
      "waypoints": [
        "Grazalema, Spain",
        "Puerto de las Palomas, Spain",
        "Zahara de la Sierra, Spain",
        "El Bosque, Spain",
        "Ubrique, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-20",
      "day": 20,
      "title": "Ronda",
      "type": "Wetter- und Erholungstag",
      "overnight": "Ronda",
      "roads": "Keine feste Fahrroute",
      "points": "Erholung · Wäsche · Wetterreserve · optionale kurze Runde",
      "note": "Bewusster Puffertag. Nur eine kurze Zusatzrunde fahren, wenn Wetter und Energie passen.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-21",
      "day": 21,
      "title": "Ronda – Úbeda",
      "type": "Inland / Rückweg",
      "overnight": "Úbeda",
      "km": "290 km",
      "time": "3 h 45",
      "roads": "A-367 · A-384 · A-92 · A-44 · A-316",
      "points": "Antequera · Jaén · Baeza",
      "note": "Ruhiger Inlandtag; Baeza als kurzer Stopp, Úbeda als Basis.",
      "origin": "Ronda, Spain",
      "destination": "Úbeda, Spain",
      "waypoints": [
        "Antequera, Spain",
        "Jaén, Spain",
        "Baeza, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-22",
      "day": 22,
      "title": "Úbeda und Baeza",
      "type": "Ruhetag / Kultur",
      "overnight": "Úbeda",
      "roads": "Optional A-316",
      "points": "Baeza",
      "note": "Kurzer Kultur- und Puffertag.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "alt": [
        {
          "label": "Baeza-Runde",
          "meta": "22 km · 35 min",
          "url": "https://www.google.com/maps/dir/?api=1&origin=%C3%9Abeda%2C+Spain&destination=%C3%9Abeda%2C+Spain&travelmode=driving&waypoints=Baeza%2C+Spain"
        }
      ]
    },
    {
      "id": "day-23",
      "day": 23,
      "title": "Úbeda – Cuenca",
      "type": "Inland",
      "overnight": "Cuenca",
      "km": "406 km",
      "time": "4 h 55",
      "roads": "N-322 und regionale Hauptverbindungen",
      "points": "Alcalá del Júcar",
      "note": "Albacete wird nicht mehr als Stadtziel angefahren. In Alcalá del Júcar am Ortsrand parkieren.",
      "origin": "Úbeda, Spain",
      "destination": "Cuenca, Spain",
      "waypoints": [
        "Alcalá del Júcar, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-24",
      "day": 24,
      "title": "Cuenca",
      "type": "Ruhetag / Wetterreserve",
      "overnight": "Cuenca",
      "roads": "Keine feste Fahrroute",
      "points": "Altstadt · Erholung · Wetterreserve",
      "note": "Der zusätzliche Tag entschärft den langen Vortag und hält den Rückweg zur Fähre flexibel.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-25",
      "day": 25,
      "title": "Cuenca – Zaragoza",
      "type": "Rückverbindung",
      "overnight": "Zaragoza",
      "km": "291 km",
      "time": "4 h 10",
      "roads": "CM-210 · N-211 · A-2",
      "points": "Molina de Aragón · Calatayud",
      "note": "Landschaftlich, aber nicht auf kleinere Abkürzungen wechseln. Bei Wetter direkter fahren.",
      "origin": "Cuenca, Spain",
      "destination": "Zaragoza, Spain",
      "waypoints": [
        "Molina de Aragón, Spain",
        "Calatayud, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-26",
      "day": 26,
      "title": "Zaragoza – Castelldefels",
      "type": "Transfer",
      "overnight": "Castelldefels",
      "km": "ca. 335 km",
      "time": "ca. 3 h 45",
      "roads": "AP-2/A-2 · B-23/C-32",
      "points": "Lleida · Montblanc",
      "note": "Montblanc nur als kurzer Stopp. In Castelldefels Garage für zwei Nächte und frühe Abfahrt zum Fährterminal vorsehen.",
      "origin": "Zaragoza, Spain",
      "destination": "Castelldefels, Spain",
      "waypoints": [
        "Lleida, Spain",
        "Montblanc, Spain"
      ],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-27",
      "day": 27,
      "title": "Castelldefels / Fährvorbereitung",
      "type": "Reservetag für die Fähre",
      "overnight": "Castelldefels",
      "roads": "Keine feste Fahrroute",
      "points": "Tanken · Verpflegung · Gepäck · Dokumente · Terminalzufahrt prüfen",
      "note": "Motorräder stehen lassen und den Tag ruhig halten. Wecker, Check-in-Unterlagen und Zufahrt zum Terminal für den frühen nächsten Morgen vorbereiten.",
      "rest": true,
      "waypoints": [],
      "status": "planned",
      "custom": false
    },
    {
      "id": "day-28",
      "day": 28,
      "title": "Fähre Barcelona – Genua",
      "type": "Fährtag",
      "overnight": "Kabine an Bord",
      "roads": "Direkte Zufahrt zum bestätigten Fährterminal",
      "points": "Check-in 08:30 · Abfahrt 10:30 · zwei Motorräder · Ankunft Genua am Folgetag 09:00",
      "note": "Frühstück und Tankstopp vorziehen. Mindestens den bestätigten Check-in-Puffer einhalten und die Terminalangabe auf dem Ticket verwenden.",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "origin": "Barcelona Ferry Terminal, Spain",
      "destination": "Genoa Ferry Terminal, Italy"
    },
    {
      "id": "day-29",
      "day": 29,
      "title": "Genua – Aosta",
      "type": "Heimweg",
      "overnight": "Aosta",
      "km": "246 km",
      "time": "2 h 40",
      "roads": "Ab Genua über A7/A26 und A5 nach Aosta",
      "points": "Ankunft Fähre 09:00 · Ausschiffung · direkte Autobahnroute",
      "note": "Zeit für die Ausschiffung lassen und danach direkt nach Aosta fahren.",
      "origin": "Genoa, Italy",
      "destination": "Aosta, Italy",
      "waypoints": [],
      "status": "planned",
      "custom": false,
      "mainLabel": "Genua – Aosta",
      "mainMeta": "246 km · 2 h 40"
    },
    {
      "id": "day-30",
      "day": 30,
      "title": "Aosta – Berikon",
      "type": "Heimfahrt",
      "overnight": "Berikon",
      "km": "359 km",
      "time": "ca. 4 h 50",
      "roads": "Ab Aosta über den Grossen St. Bernhard, Martigny und Lausanne nach Berikon",
      "points": "Alpenquerung nach Startort und Wetter",
      "note": "Alpenwetter und Passstatus vor der Abfahrt prüfen; bei Sperrung muss die Heimroute als Reiseänderung neu geplant werden.",
      "origin": "Aosta, Italy",
      "destination": "Berikon, Switzerland",
      "waypoints": [
        "Martigny, Switzerland",
        "Lausanne, Switzerland"
      ],
      "status": "planned",
      "custom": false,
      "mainLabel": "Aosta – Berikon",
      "mainMeta": "359 km · ca. 4 h 50"
    }
  ],
  "accommodations": {
    "grenoble": {
      "startDate": "2026-09-24",
      "endDate": "2026-09-25",
      "nightCount": "1",
      "title": "Grenoble",
      "firstChoice": "Logis Hôtel Le Néron",
      "firstChoiceUrl": "https://www.hotel-grenoble-nord.fr/",
      "alternative": "Maison Barbillon",
      "alternativeUrl": "https://maisonbarbillon.com/en/planning-your-stay-faq/"
    },
    "sisteron": {
      "startDate": "2026-09-25",
      "endDate": "2026-09-26",
      "nightCount": "1",
      "title": "Sisteron",
      "firstChoice": "Hôtel Les Chênes",
      "firstChoiceUrl": "https://www.hotel-les-chenes.com/",
      "alternative": "Hôtel Tivoli",
      "alternativeUrl": "https://www.hoteltivoli-sisteron.fr/fr/hotel"
    },
    "lourmarin": {
      "startDate": "2026-09-26",
      "endDate": "2026-09-27",
      "nightCount": "1",
      "title": "Lourmarin",
      "firstChoice": "Le Moulin, Beaumier",
      "firstChoiceUrl": "https://www.beaumier.com/en/properties/le-moulin-hotel/faq/",
      "hideBaseline": "true"
    },
    "nimes": {
      "startDate": "2026-09-27",
      "endDate": "2026-09-28",
      "nightCount": "1",
      "title": "Nîmes",
      "firstChoice": "Nimotel",
      "firstChoiceUrl": "https://www.nimotel.com/",
      "alternative": "Royal Hôtel",
      "alternativeUrl": "https://www.royalhotel-nimes.com/en/services"
    },
    "carcassonne": {
      "startDate": "2026-09-28",
      "endDate": "2026-09-29",
      "nightCount": "1",
      "title": "Carcassonne",
      "firstChoice": "Hôtel Montségur",
      "firstChoiceUrl": "https://hotelmontsegur.com/parking.html",
      "alternative": "Hôtel Espace Cité",
      "alternativeUrl": "https://www.tourisme-carcassonne.fr/en/accomodation/hotel-espace-cite/"
    },
    "castelldefels-1": {
      "startDate": "2026-09-29",
      "endDate": "2026-10-01",
      "nightCount": "2",
      "title": "Castelldefels",
      "firstChoice": "ibis Barcelona Castelldefels",
      "firstChoiceUrl": "https://all.accor.com/hotel/3208/index.es.shtml",
      "alternative": "Hotel nach Wahl + Central Park",
      "alternativeUrl": "https://www.centralparkcastelldefels.com/"
    },
    "falset": {
      "startDate": "2026-10-01",
      "endDate": "2026-10-03",
      "nightCount": "2",
      "title": "Falset",
      "firstChoice": "Hotel-Hostal Sport",
      "firstChoiceUrl": "https://www.hotelpriorat-hostalsport.com/en/hotel-hostal-sport-your-hotel-priorat",
      "alternative": "Priorat Aparthotel",
      "alternativeUrl": "https://www.theoriginhotels.com/es/priorat-aparthotel"
    },
    "albarracin": {
      "startDate": "2026-10-03",
      "endDate": "2026-10-05",
      "nightCount": "2",
      "title": "Albarracín",
      "firstChoice": "Hotel Doña Blanca",
      "firstChoiceUrl": "https://www.albarracindonablanca.com/",
      "alternative": "Hotel Albarrán",
      "alternativeUrl": "https://hotelalbarran.es/"
    },
    "alboraya": {
      "startDate": "2026-10-05",
      "endDate": "2026-10-07",
      "nightCount": "2",
      "title": "La Patacona",
      "firstChoice": "Olympia Hotel, Events & Spa · Alboraya",
      "firstChoiceUrl": "https://www.olympiahotelvalencia.com/",
      "alternative": "La Mozaira · Alboraya",
      "alternativeUrl": "https://www.lamozaira.com/",
      "note": "Hotelparkplatz vorhanden; sichere Abstellung für zwei Motorräder vor der Buchung bestätigen.",
      "hideBaseline": "true"
    },
    "altea": {
      "startDate": "2026-10-07",
      "endDate": "2026-10-08",
      "nightCount": "1",
      "title": "Altea",
      "firstChoice": "Hotel Cap Negret",
      "firstChoiceUrl": "https://www.hotelcapnegret.es/servicios/",
      "alternative": "Hotel Altaia",
      "alternativeUrl": "https://hotelaltaia.es/"
    },
    "monachil": {
      "startDate": "2026-10-08",
      "endDate": "2026-10-11",
      "nightCount": "3",
      "title": "Monachil",
      "firstChoice": "La Almunia del Valle",
      "firstChoiceUrl": "https://www.laalmuniadelvalle.com/en/service/parking-2/",
      "alternative": "Hotel Rural Huerta del Laurel",
      "alternativeUrl": "https://monachil.es/donde-dormir"
    },
    "ronda": {
      "startDate": "2026-10-11",
      "endDate": "2026-10-14",
      "nightCount": "3",
      "title": "Ronda",
      "firstChoice": "Hotel San Francisco",
      "firstChoiceUrl": "https://hotelsanfrancisco-ronda.com/en/services/",
      "alternative": "Hotel Andalucía",
      "alternativeUrl": "https://www.hotel-andalucia.net/en/"
    },
    "ubeda": {
      "startDate": "2026-10-14",
      "endDate": "2026-10-16",
      "nightCount": "2",
      "title": "Úbeda",
      "firstChoice": "La Posada Boutique Hotel",
      "firstChoiceUrl": "https://www.laposadaubeda.es/en",
      "alternative": "Hotel Rosaleda de Don Pedro",
      "alternativeUrl": "https://www.hotelrosaledadonpedro.com/"
    },
    "cuenca": {
      "startDate": "2026-10-16",
      "endDate": "2026-10-18",
      "nightCount": "2",
      "title": "Cuenca / Arcas",
      "firstChoice": "Isis de Cuenca",
      "firstChoiceUrl": "https://www.booking.com/hotel/es/hostal-isis.html",
      "alternative": "Hotel Torremangana",
      "alternativeUrl": "https://www.hoteltorremangana.com/"
    },
    "zaragoza": {
      "startDate": "2026-10-18",
      "endDate": "2026-10-19",
      "nightCount": "1",
      "title": "Zaragoza",
      "firstChoice": "Hotel Sauce",
      "firstChoiceUrl": "https://www.hotelsauce.com/en/information/faqs/hotel-sauce-saragossa/parking-en/",
      "alternative": "Hotel Río Arga",
      "alternativeUrl": "https://www.hotelrioarga.es/"
    },
    "castelldefels-2": {
      "startDate": "2026-10-19",
      "endDate": "2026-10-21",
      "nightCount": "2",
      "title": "Castelldefels",
      "firstChoice": "ibis Barcelona Castelldefels",
      "firstChoiceUrl": "https://all.accor.com/hotel/3208/index.es.shtml",
      "alternative": "Central Park Castelldefels",
      "alternativeUrl": "https://www.centralparkcastelldefels.com/"
    },
    "ferry": {
      "startDate": "2026-10-21",
      "endDate": "2026-10-22",
      "nightCount": "1",
      "title": "Fähre Barcelona–Genua",
      "firstChoice": "Kabine an Bord",
      "hideBaseline": "true"
    },
    "aosta": {
      "startDate": "2026-10-22",
      "endDate": "2026-10-23",
      "nightCount": "1",
      "title": "Aosta",
      "firstChoice": "Hotel Le Pageot",
      "firstChoiceUrl": "https://www.lepageot.it/en/services-2/",
      "hideBaseline": "true"
    }
  },
  "originalPlanVersion": "2026-08-12T16:32:07.603Z",
  "baselineAccommodations": {
    "grenoble": {
      "startDate": "2026-09-24",
      "endDate": "2026-09-25",
      "nightCount": "1",
      "title": "Grenoble",
      "firstChoice": "Logis Hôtel Le Néron",
      "firstChoiceUrl": "https://www.hotel-grenoble-nord.fr/",
      "alternative": "Maison Barbillon",
      "alternativeUrl": "https://maisonbarbillon.com/en/planning-your-stay-faq/"
    },
    "sisteron": {
      "startDate": "2026-09-25",
      "endDate": "2026-09-26",
      "nightCount": "1",
      "title": "Sisteron",
      "firstChoice": "Hôtel Les Chênes",
      "firstChoiceUrl": "https://www.hotel-les-chenes.com/",
      "alternative": "Hôtel Tivoli",
      "alternativeUrl": "https://www.hoteltivoli-sisteron.fr/fr/hotel"
    },
    "lourmarin": {
      "startDate": "2026-09-26",
      "endDate": "2026-09-27",
      "nightCount": "1",
      "title": "Lourmarin",
      "firstChoice": "Le Moulin, Beaumier",
      "firstChoiceUrl": "https://www.beaumier.com/en/properties/le-moulin-hotel/faq/",
      "hideBaseline": "true"
    },
    "nimes": {
      "startDate": "2026-09-27",
      "endDate": "2026-09-28",
      "nightCount": "1",
      "title": "Nîmes",
      "firstChoice": "Nimotel",
      "firstChoiceUrl": "https://www.nimotel.com/",
      "alternative": "Royal Hôtel",
      "alternativeUrl": "https://www.royalhotel-nimes.com/en/services"
    },
    "carcassonne": {
      "startDate": "2026-09-28",
      "endDate": "2026-09-29",
      "nightCount": "1",
      "title": "Carcassonne",
      "firstChoice": "Hôtel Montségur",
      "firstChoiceUrl": "https://hotelmontsegur.com/parking.html",
      "alternative": "Hôtel Espace Cité",
      "alternativeUrl": "https://www.tourisme-carcassonne.fr/en/accomodation/hotel-espace-cite/"
    },
    "castelldefels-1": {
      "startDate": "2026-09-29",
      "endDate": "2026-10-01",
      "nightCount": "2",
      "title": "Castelldefels",
      "firstChoice": "ibis Barcelona Castelldefels",
      "firstChoiceUrl": "https://all.accor.com/hotel/3208/index.es.shtml",
      "alternative": "Hotel nach Wahl + Central Park",
      "alternativeUrl": "https://www.centralparkcastelldefels.com/"
    },
    "falset": {
      "startDate": "2026-10-01",
      "endDate": "2026-10-03",
      "nightCount": "2",
      "title": "Falset",
      "firstChoice": "Hotel-Hostal Sport",
      "firstChoiceUrl": "https://www.hotelpriorat-hostalsport.com/en/hotel-hostal-sport-your-hotel-priorat",
      "alternative": "Priorat Aparthotel",
      "alternativeUrl": "https://www.theoriginhotels.com/es/priorat-aparthotel"
    },
    "albarracin": {
      "startDate": "2026-10-03",
      "endDate": "2026-10-05",
      "nightCount": "2",
      "title": "Albarracín",
      "firstChoice": "Hotel Doña Blanca",
      "firstChoiceUrl": "https://www.albarracindonablanca.com/",
      "alternative": "Hotel Albarrán",
      "alternativeUrl": "https://hotelalbarran.es/"
    },
    "alboraya": {
      "startDate": "2026-10-05",
      "endDate": "2026-10-07",
      "nightCount": "2",
      "title": "La Patacona",
      "firstChoice": "Olympia Hotel, Events & Spa · Alboraya",
      "firstChoiceUrl": "https://www.olympiahotelvalencia.com/",
      "alternative": "La Mozaira · Alboraya",
      "alternativeUrl": "https://www.lamozaira.com/",
      "note": "Hotelparkplatz vorhanden; sichere Abstellung für zwei Motorräder vor der Buchung bestätigen.",
      "hideBaseline": "true"
    },
    "altea": {
      "startDate": "2026-10-07",
      "endDate": "2026-10-08",
      "nightCount": "1",
      "title": "Altea",
      "firstChoice": "Hotel Cap Negret",
      "firstChoiceUrl": "https://www.hotelcapnegret.es/servicios/",
      "alternative": "Hotel Altaia",
      "alternativeUrl": "https://hotelaltaia.es/"
    },
    "monachil": {
      "startDate": "2026-10-08",
      "endDate": "2026-10-11",
      "nightCount": "3",
      "title": "Monachil",
      "firstChoice": "La Almunia del Valle",
      "firstChoiceUrl": "https://www.laalmuniadelvalle.com/en/service/parking-2/",
      "alternative": "Hotel Rural Huerta del Laurel",
      "alternativeUrl": "https://monachil.es/donde-dormir"
    },
    "ronda": {
      "startDate": "2026-10-11",
      "endDate": "2026-10-14",
      "nightCount": "3",
      "title": "Ronda",
      "firstChoice": "Hotel San Francisco",
      "firstChoiceUrl": "https://hotelsanfrancisco-ronda.com/en/services/",
      "alternative": "Hotel Andalucía",
      "alternativeUrl": "https://www.hotel-andalucia.net/en/"
    },
    "ubeda": {
      "startDate": "2026-10-14",
      "endDate": "2026-10-16",
      "nightCount": "2",
      "title": "Úbeda",
      "firstChoice": "La Posada Boutique Hotel",
      "firstChoiceUrl": "https://www.laposadaubeda.es/en",
      "alternative": "Hotel Rosaleda de Don Pedro",
      "alternativeUrl": "https://www.hotelrosaledadonpedro.com/"
    },
    "cuenca": {
      "startDate": "2026-10-16",
      "endDate": "2026-10-18",
      "nightCount": "2",
      "title": "Cuenca / Arcas",
      "firstChoice": "Isis de Cuenca",
      "firstChoiceUrl": "https://www.booking.com/hotel/es/hostal-isis.html",
      "alternative": "Hotel Torremangana",
      "alternativeUrl": "https://www.hoteltorremangana.com/"
    },
    "zaragoza": {
      "startDate": "2026-10-18",
      "endDate": "2026-10-19",
      "nightCount": "1",
      "title": "Zaragoza",
      "firstChoice": "Hotel Sauce",
      "firstChoiceUrl": "https://www.hotelsauce.com/en/information/faqs/hotel-sauce-saragossa/parking-en/",
      "alternative": "Hotel Río Arga",
      "alternativeUrl": "https://www.hotelrioarga.es/"
    },
    "castelldefels-2": {
      "startDate": "2026-10-19",
      "endDate": "2026-10-21",
      "nightCount": "2",
      "title": "Castelldefels",
      "firstChoice": "ibis Barcelona Castelldefels",
      "firstChoiceUrl": "https://all.accor.com/hotel/3208/index.es.shtml",
      "alternative": "Central Park Castelldefels",
      "alternativeUrl": "https://www.centralparkcastelldefels.com/"
    },
    "ferry": {
      "startDate": "2026-10-21",
      "endDate": "2026-10-22",
      "nightCount": "1",
      "title": "Fähre Barcelona–Genua",
      "firstChoice": "Kabine an Bord",
      "hideBaseline": "true"
    },
    "aosta": {
      "startDate": "2026-10-22",
      "endDate": "2026-10-23",
      "nightCount": "1",
      "title": "Aosta",
      "firstChoice": "Hotel Le Pageot",
      "firstChoiceUrl": "https://www.lepageot.it/en/services-2/",
      "hideBaseline": "true"
    }
  }
});
