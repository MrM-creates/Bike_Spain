(function (root) {
  "use strict";

  const maps = (origin, destination, waypoints = []) => {
    const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
    if (waypoints.length) params.set("waypoints", waypoints.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const rest = (day, title, overnight, note) => ({
    id: `adria-${day}`,
    day,
    title,
    type: "Ruhetag / Basis",
    overnight,
    km: "",
    time: "",
    roads: "Keine feste Fahrroute",
    points: "Erholung · Wetterreserve · kurzer Ausflug optional",
    note,
    rest: true,
    origin: "",
    destination: "",
    waypoints: [],
    status: "planned"
  });

  const ride = (day, title, overnight, km, time, roads, origin, destination, waypoints, note, type = "Fahrtag") => ({
    id: `adria-${day}`,
    day,
    title,
    type,
    overnight,
    km,
    time,
    roads,
    points: waypoints.join(" · "),
    note,
    rest: false,
    origin,
    destination,
    waypoints,
    main: maps(origin, destination, waypoints),
    status: "planned",
    routeStyle: /transfer|anreise|heim/i.test(type) ? "direct" : "scenic"
  });

  const days = [
    ride(1, "Berikon – Arlberg – Innsbruck", "Innsbruck", "ca. 330 km", "ca. 4 h 30", "A3 · A13 · A14 · S16 · A12", "Berikon, Switzerland", "Innsbruck, Austria", ["Feldkirch, Austria", "Arlberg Road Tunnel, Austria"], "Alpenauftakt auf verlässlichen Hauptachsen. Bei schönem Wetter kurze Pausen am Arlberg; keine zusätzliche Passjagd.", "Alpenauftakt"),
    ride(2, "Innsbruck – Pustertal – Lienz", "Lienz", "ca. 190 km", "ca. 3 h", "A13 · A22 · SS49 · B100", "Innsbruck, Austria", "Lienz, Austria", ["Brenner, Italy", "Brunico, Italy"], "Ruhige Ost-West-Etappe durch das Pustertal; bei früher Kälte die Hauptstrassenlinie beibehalten.", "Alpenauftakt"),
    ride(3, "Lienz – Nockalmstraße – Murau – Graz", "Graz", "ca. 350 km", "ca. 6 h 30", "B100 · A10 · B99 · Nockalmstraße · B96 · S36 · A2", "Lienz, Austria", "Graz, Austria", ["Spittal an der Drau, Austria", "Nockalm Road, Austria", "Murau, Austria"], "Die Nockalmstraße ist die landschaftliche Hauptvariante und wird nur bei trockener, offener Strecke gefahren. Wetteralternative über A10/A2 ohne Hochlagen.", "Alpenauftakt / Panoramastrasse"),
    ride(4, "Graz – Maribor – Ljubljana", "Ljubljana", "ca. 195 km", "ca. 2 h 45", "A9 · A1 · A4 · A1", "Graz, Austria", "Ljubljana, Slovenia", ["Maribor, Slovenia"], "Kurzer grenzüberschreitender Fahrtag mit Zeit für Ljubljana. Slowenien ist Übernachtungsort und nicht bloss Transitland.", "Slowenien"),
    ride(5, "Ljubljana – Postojna – Rijeka – Senj", "Senj", "ca. 190 km", "ca. 3 h 15", "A1 · A7 · D8", "Ljubljana, Slovenia", "Senj, Croatia", ["Postojna, Slovenia", "Rijeka, Croatia"], "Zügig ans Meer; ab Rijeka beginnt die kroatische Küstenlinie.", "Transfer zur Adria"),
    ride(6, "Senj – Karlobag – Starigrad – Zadar", "Zadar", "ca. 190 km", "ca. 3 h 30", "D8", "Senj, Croatia", "Zadar, Croatia", ["Karlobag, Croatia", "Starigrad, Croatia"], "Senj–Karlobag ist im offiziellen kroatischen Motorradführer als Panoramastrecke ausgewiesen. Sehr bura-exponiert: Wind- und Sperrlage am Fahrtag bei HAK prüfen."),
    rest(7, "Zadar", "Zadar", "Altstadt, Meer und Erholung. Nin oder Pag nur als kurzer, asphaltierter Ausflug bei Lust und gutem Wetter."),
    ride(8, "Zadar – Biograd – Vodice – Šibenik", "Šibenik", "ca. 105 km", "ca. 2 h", "D8", "Zadar, Croatia", "Šibenik, Croatia", ["Biograd na Moru, Croatia", "Vodice, Croatia"], "Kurze D8-Etappe mit Zeit für Fotostopps."),
    rest(9, "Šibenik / Krka", "Šibenik", "Altstadt, Hafen und optional Krka; kein Programmzwang und nicht in enge Gassen navigieren."),
    ride(10, "Šibenik – Primošten – Trogir – Makarska", "Makarska", "ca. 155 km", "ca. 3 h 15", "D8", "Šibenik, Croatia", "Makarska, Croatia", ["Primošten, Croatia", "Trogir, Croatia"], "Trogir–Split–Makarska ist laut HAK ein häufiger Staukorridor. Bei dichtem Verkehr die A1-Umfahrung via Dugopolje/Šestanovac prüfen."),
    rest(11, "Makarska", "Makarska", "Meer-und-Berge-Basis; Promenade und Erholung."),
    rest(12, "Makarska / Küstentag", "Makarska", "Kurzer Küstenausflug oder vollständiger Ruhetag; zugleich Wetterreserve."),
    ride(13, "Makarska – Ploče – Pelješac-Brücke – Ston – Dubrovnik", "Dubrovnik (Aussenbasis)", "ca. 185 km", "ca. 3 h 30", "D8 · D425 · D414 · D8", "Makarska, Croatia", "Dubrovnik, Croatia", ["Ploče, Croatia", "Pelješac Bridge, Croatia", "Ston, Croatia"], "Unterkunft ausserhalb der engen Altstadt mit sicherer Motorradabstellung wählen."),
    rest(14, "Dubrovnik", "Dubrovnik (Aussenbasis)", "Stadttag ohne Motorradlogistik."),
    rest(15, "Dubrovnik / Reserve", "Dubrovnik (Aussenbasis)", "Zweiter voller Tag für Erholung, Wetter oder einen ruhigen Küstentag."),
    ride(16, "Dubrovnik – Karasovići – Bucht von Kotor", "Kotor oder Perast", "ca. 105 km", "ca. 2 h 30 plus Grenze", "D8 · M1", "Dubrovnik, Croatia", "Kotor, Montenegro", ["Karasovići Border Crossing", "Herceg Novi, Montenegro", "Perast, Montenegro"], "Grenztag mit EES- und Verkehrspuffer; nicht mit weiterem Programm überladen."),
    rest(17, "Kotor und Perast", "Kotor oder Perast", "Die vollständige Buchtrunde misst nur etwa 50–60 km, braucht auf der schmalen Uferstrasse aber Zeit. Perast und Risan ruhig angehen."),
    rest(18, "Bucht von Kotor", "Kotor oder Perast", "Ruhetag oder kurze Buchtrunde auf Hauptstrassen. Motorrad ausserhalb der engen Kerne abstellen."),
    rest(19, "Kotor / Wetter- und Entscheidungstag", "Kotor oder Perast", "Lovćen nur trocken, windarm und nach Tagesprüfung. Keine spontane Hin-und-zurück-Fahrt; alternativ ein weiterer ruhiger Tag an der Bucht."),
    ride(20, "Kotor – Dubrovnik – Ploče – Makarska", "Makarska", "ca. 250 km", "ca. 4 h 45 plus Grenze", "M1 · D8", "Kotor, Montenegro", "Makarska, Croatia", ["Karasovići Border Crossing", "Dubrovnik, Croatia", "Ploče, Croatia"], "Vier Nächte Montenegro bleiben erhalten. Grosszügigen Grenz- und Pausenpuffer vorsehen.", "Rückfahrt zur Fähre"),
    ride(21, "Makarska – Split / Nachtfähre nach Ancona", "Ancona", "ca. 90 km plus Nachtfähre", "ca. 1 h 45 plus Check-in und Überfahrt", "D8 · A1 · Fährlinie 53", "Makarska, Croatia", "Ancona, Italy", ["Split Ferry Port, Croatia"], "Kurze Anfahrt zum Hafen. Check-in spätestens 18:00, planmässige Abfahrt 20:00 und Ankunft in Ancona am Folgetag um 07:00. Fahrplan und Motorradplatz vor Buchung nochmals bestätigen.", "Fährtag"),
    ride(22, "Ancona – Fano – Furlo-Schlucht – Urbino", "Urbino", "ca. 175 km", "ca. 3 h 30", "SS16 · SS73bis · SP3", "Ancona, Italy", "Urbino, Italy", ["Fano, Italy", "Gola del Furlo, Italy"], "Nach der Ausschiffung bewusst kurze Marken-Etappe. Furlo nur bei geöffneter, trockener Strecke; Urbino-Unterkunft mit gut erreichbarer Garage wählen.", "Italien / Genussfahrt"),
    rest(23, "Urbino und Montefeltro", "Urbino", "Renaissance-Stadt, Erholung und optional eine kurze Runde durch die sanften Hügel des Montefeltro."),
    ride(24, "Urbino – San Marino – Rimini – Ravenna", "Ravenna", "ca. 170 km", "ca. 3 h 30", "SS73bis · SS72 · SS16", "Urbino, Italy", "Ravenna, Italy", ["San Marino", "Rimini, Italy"], "San Marino und Rimini als flexible Stopps; bei Regen direkt auf gut ausgebauten Strassen nach Ravenna."),
    ride(25, "Ravenna – Comacchio – Chioggia – Colli Euganei", "Arquà Petrarca", "ca. 225 km", "ca. 4 h", "SS309 · SR104 · SP89", "Ravenna, Italy", "Arquà Petrarca, Italy", ["Comacchio, Italy", "Chioggia, Italy"], "Flache, wetterrobuste Linie durch Lagunen- und Po-Landschaft; Altstadtzufahrten und ZTL vermeiden."),
    rest(26, "Colli Euganei", "Arquà Petrarca", "Ruhiger Hügeltag, Therme oder vollständige Erholung. Keine Pflichtkilometer."),
    ride(27, "Colli Euganei – Valeggio – Lago d’Iseo", "Lago d’Iseo", "ca. 240 km", "ca. 4 h", "SR10 · A4 · SP510", "Arquà Petrarca, Italy", "Iseo, Italy", ["Valeggio sul Mincio, Italy"], "Norditalienische Übergangsetappe mit Autobahnreserve bei Regen; Seeuferverkehr nicht unterschätzen."),
    rest(28, "Lago d’Iseo", "Lago d’Iseo", "Letzter echter Genuss- und Wettertag vor der Heimreise."),
    ride(29, "Lago d’Iseo – Bergamo – Como", "Como", "ca. 130 km", "ca. 2 h 30", "SP510 · A4 · A9", "Iseo, Italy", "Como, Italy", ["Bergamo, Italy"], "Kurzer, tiefer und wetterrobuster Rückfahrtstag; Stadtzufahrten und ZTL beachten.", "Heimweg"),
    ride(30, "Como – Gotthardtunnel – Berikon", "Berikon", "ca. 235 km", "ca. 3 h 15", "A9 · A2 · A1", "Como, Italy", "Berikon, Switzerland", ["Gotthard Road Tunnel, Switzerland"], "Keine hohen Alpenpässe: Splügen und Engadin bleiben ausgeschlossen. Gotthardverkehr vor Abfahrt prüfen.", "Heimfahrt")
  ];

  const placeCoordinates = {
    "Berikon": { latitude: 47.351, longitude: 8.372, countryCode: "CH" },
    "Innsbruck": { latitude: 47.269, longitude: 11.405, countryCode: "AT" },
    "Lienz": { latitude: 46.829, longitude: 12.769, countryCode: "AT" },
    "Graz": { latitude: 47.071, longitude: 15.439, countryCode: "AT" },
    "Ljubljana": { latitude: 46.056, longitude: 14.506, countryCode: "SI" },
    "Senj": { latitude: 44.989, longitude: 14.905, countryCode: "HR" },
    "Zadar": { latitude: 44.119, longitude: 15.232, countryCode: "HR" },
    "Šibenik": { latitude: 43.735, longitude: 15.895, countryCode: "HR" },
    "Makarska": { latitude: 43.296, longitude: 17.017, countryCode: "HR" },
    "Dubrovnik (Aussenbasis)": { latitude: 42.651, longitude: 18.094, countryCode: "HR" },
    "Kotor oder Perast": { latitude: 42.486, longitude: 18.699, countryCode: "ME" },
    "Ancona": { latitude: 43.615, longitude: 13.51, countryCode: "IT" },
    "Urbino": { latitude: 43.726, longitude: 12.636, countryCode: "IT" },
    "Ravenna": { latitude: 44.418, longitude: 12.204, countryCode: "IT" },
    "Arquà Petrarca": { latitude: 45.27, longitude: 11.718, countryCode: "IT" },
    "Lago d’Iseo": { latitude: 45.659, longitude: 10.05, countryCode: "IT" },
    "Como": { latitude: 45.808, longitude: 9.086, countryCode: "IT" }
  };

  const snapshot = {
    publishedVersion: "2026-08-28T12:00:00.000Z",
    planKind: "draft",
    originalDays: days,
    days,
    accommodations: [],
    trip: {
      id: "trip_adria_2026",
      name: "Adria & Balkan 2026",
      dataVersion: "2026-08-28.2",
      characterTitle: "Adriawind, Küstenkurven und stille Buchten",
      characterText: "Ein schöner Alpenauftakt über Lienz, die Nockalmstraße und Graz führt nach Slowenien. Danach folgen die D8, lange Aufenthalte an der dalmatinischen Küste und vier Nächte in der Bucht von Kotor. Die Nachtfähre nach Ancona öffnet einen eigenständigen Rückweg durch die Marken und Norditalien.",
      startDate: "2026-09-24",
      startPlace: "Berikon",
      endPlace: "Berikon",
      timezone: "Europe/Zurich",
      utcOffset: "+02:00",
      participantCount: 2,
      motorcycleCount: 2,
      routeGeometryUrl: "/assets/adria-routes.geojson",
      transportMatchers: ["Fährtag", "Nachtfähre.*Split.*Ancona", "Nachtfähre nach Ancona"],
      capabilities: { storage: "local", fullReplanning: true, originalPlan: false, downloads: false, mapNarrativeSource: "stages" },
      placeCoordinates,
      preferences: {
        routeStyle: "mixed",
        ridingRhythm: "slow",
        accommodationStyle: "Motorradfreundlich mit sicherer Abstellung",
        preferGoodWeather: true,
        asphaltOnly: true
      },
      planningProfile: {
        countries: ["Schweiz", "Österreich", "Italien", "Slowenien", "Kroatien", "Montenegro"],
        seasonalRisks: [
          "spätherbstliches Alpenwetter am Arlberg, im Pustertal und auf der Nockalmstraße",
          "Bura an der Velebitküste und auf der D8",
          "Stau im Korridor Trogir–Split–Makarska",
          "Grenzwartezeiten Kroatien–Montenegro",
          "saisonale Verkehrsanordnungen am Lovćen",
          "fester Fahrplantag und begrenzte Motorradplätze auf der Fähre Split–Ancona",
          "ZTL und Stadtverkehr in italienischen Altstädten",
          "Oktoberwetter und Verkehr am Gotthard"
        ]
      },
      placeAliases: {
        "Dubrovnik, Croatia": "Dubrovnik (Aussenbasis)",
        "Kotor, Montenegro": "Kotor oder Perast"
      },
      planningAlternatives: [
        {
          id: "nightjet-feldkirch-graz",
          title: "Schlechtwetter-Alternative: Nightjet Feldkirch–Graz",
          status: "reserve",
          summary: "Bei einer ungünstigen Alpenlage können die Motorräder in Feldkirch verladen werden. Graz bleibt damit Ausgangspunkt für Slowenien, ohne die Hauptplanung über Lienz und die Nockalmstraße zu ersetzen.",
          replacesDays: [1, 2, 3, 4],
          steps: [
            "Tag 1: Berikon–Feldkirch und Motorräder verladen",
            "Über Nacht mit dem ÖBB Nightjet nach Graz",
            "Am Folgetag Graz–Ljubljana",
            "Die gewonnenen Tage bleiben als Wetter- und Slowenienpuffer; Anschluss an Tag 5 nach Senj"
          ],
          decision: "Etwa 5–7 Tage vor Abreise anhand Alpenprognose und verfügbarer Motorradplätze entscheiden.",
          sourceUrl: "https://www.nightjet.com/de/angebote/automotorrad"
        }
      ],
      fixPoints: [
        { id: "fix_adria_start", kind: "start", title: "Start in Berikon", place: "Berikon", startsAt: "2026-09-24T08:00:00+02:00", locks: ["date", "origin"], source: "draft" },
        { id: "fix_adria_ferry_split_ancona", kind: "transport", title: "Nachtfähre Split → Ancona", stageDay: 21, place: "Split", startsAt: "2026-10-14T20:00:00+02:00", endsAt: "2026-10-15T07:00:00+02:00", locks: ["date", "time", "place", "stage", "route"], source: "official-timetable" },
        { id: "fix_adria_end", kind: "end", title: "Rückkehr nach Berikon", place: "Berikon", startsAt: "2026-10-23T18:00:00+02:00", locks: ["date", "destination", "overnight"], source: "draft" }
      ],
      narrativeSegments: [
        { title: "Über die Alpen nach Slowenien.", text: "Arlberg, Pustertal, Nockalmstraße und Murau bilden die schöne Hauptstrecke nach Graz; Ljubljana bekommt eine eigene Nacht.", fromDay: 1, toDay: 5, mapGroup: 0 },
        { title: "Dalmatien ohne Eile.", text: "Ab Senj folgt die Reise der D8. Zadar, Šibenik und Makarska werden zu echten Basen statt blossen Übernachtungsorten.", fromDay: 6, toDay: 12, mapGroup: 1 },
        { title: "Dubrovnik und die Bucht von Kotor.", text: "Der südliche Schwerpunkt bleibt unangetastet: Dubrovnik erhält drei, Kotor und Perast vier Nächte.", fromDay: 13, toDay: 19, mapGroup: 2 },
        { title: "Mit der Nachtfähre über die Adria.", text: "Von Kotor geht es mit einer Zwischenübernachtung in Makarska nach Split und über Nacht nach Ancona.", fromDay: 20, toDay: 21, mapGroup: 3 },
        { title: "Durch die Marken und Norditalien nach Hause.", text: "Furlo, Urbino, Ravenna, die Colli Euganei und der Lago d’Iseo bilden einen eigenständigen Rückweg bis Como und durch den Gotthardtunnel.", fromDay: 22, toDay: 30, mapGroup: 4 }
      ]
    }
  };

  root.__TRIP_ADRIA_DATA__ = Object.freeze(snapshot);
})(typeof globalThis !== "undefined" ? globalThis : this);
