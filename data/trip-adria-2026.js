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
    ride(1, "Berikon – Innsbruck", "Innsbruck", "ca. 330 km", "ca. 4 h", "A3 · A13 · A14 · A12", "Berikon, Switzerland", "Innsbruck, Austria", ["Feldkirch, Austria"], "Bewusster Anreisetag auf grossen Achsen; keine Passjagd.", "Anreise / Transfer"),
    ride(2, "Innsbruck – Villach", "Villach", "ca. 295 km", "ca. 3 h 30", "A12 · A13 · A22 · SS49 · A23", "Innsbruck, Austria", "Villach, Austria", ["Brenner, Italy", "Brunico, Italy"], "Nur bei guter Lage über den Pustertal-Korridor; bei Wetter die verlässlichste Hauptachsenvariante wählen.", "Transfer"),
    ride(3, "Villach – Ljubljana – Rijeka – Senj", "Senj", "ca. 285 km", "ca. 4 h", "A11 · A2 · A1 · A7 · D8", "Villach, Austria", "Senj, Croatia", ["Ljubljana, Slovenia", "Rijeka, Croatia"], "Zügig ans Meer. Ljubljana und Rijeka sind Pausenpunkte, kein Stadtprogramm.", "Transfer zur Adria"),
    ride(4, "Senj – Karlobag – Starigrad – Zadar", "Zadar", "ca. 190 km", "ca. 3 h 30", "D8", "Senj, Croatia", "Zadar, Croatia", ["Karlobag, Croatia", "Starigrad, Croatia"], "Senj–Karlobag ist auch im offiziellen kroatischen Motorradführer als eigene Panoramastrecke ausgewiesen. Sehr bura-exponiert: Wind- und Sperrlage am Fahrtag bei HAK prüfen und bei Sturm nicht erzwingen."),
    rest(5, "Zadar", "Zadar", "Altstadt, Meer und Erholung. Motorräder dürfen vollständig stehen bleiben."),
    rest(6, "Zadar / Nin oder Pag optional", "Zadar", "Kurzer asphaltierter Ausflug nur bei Lust und gutem Wetter."),
    rest(7, "Zadar / Wetterreserve", "Zadar", "Bewusster vierter Übernachtungstag ohne Programmzwang."),
    ride(8, "Zadar – Biograd – Vodice – Šibenik", "Šibenik", "ca. 105 km", "ca. 2 h", "D8", "Zadar, Croatia", "Šibenik, Croatia", ["Biograd na Moru, Croatia", "Vodice, Croatia"], "Kurze D8-Etappe mit Zeit für Fotostopps."),
    rest(9, "Šibenik", "Šibenik", "Altstadt und Hafen; nicht in enge Gassen navigieren."),
    rest(10, "Šibenik / Krka optional", "Šibenik", "Krka als Tagesausflug oder vollständiger Ruhetag."),
    ride(11, "Šibenik – Primošten – Trogir – Makarska", "Makarska", "ca. 155 km", "ca. 3 h 15", "D8", "Šibenik, Croatia", "Makarska, Croatia", ["Primošten, Croatia", "Trogir, Croatia"], "Trogir–Split–Makarska ist laut HAK ein häufiger Staukorridor. Trogir nur mit gut erreichbarem Parkplatz; bei dichtem Verkehr vor Trogir eine A1-Umfahrung via Dugopolje/Šestanovac prüfen."),
    rest(12, "Makarska", "Makarska", "Meer-und-Berge-Basis; Promenade und Erholung."),
    rest(13, "Makarska / Küstentag", "Makarska", "Kurzer Küstenausflug optional, kein Pflichtprogramm."),
    ride(14, "Makarska – Ploče – Pelješac-Brücke – Ston – Dubrovnik", "Dubrovnik (Aussenbasis)", "ca. 185 km", "ca. 3 h 30", "D8 · D425 · D414 · D8", "Makarska, Croatia", "Dubrovnik, Croatia", ["Ploče, Croatia", "Pelješac Bridge, Croatia", "Ston, Croatia"], "Unterkunft ausserhalb der engen Altstadt mit sicherer Motorradabstellung wählen."),
    rest(15, "Dubrovnik", "Dubrovnik (Aussenbasis)", "Stadttag ohne Motorradlogistik."),
    rest(16, "Dubrovnik / Reserve", "Dubrovnik (Aussenbasis)", "Zweiter voller Tag für Erholung, Wetter oder einen ruhigen Küstentag."),
    ride(17, "Dubrovnik – Karasovići – Bucht von Kotor", "Kotor oder Perast", "ca. 105 km", "ca. 2 h 30 plus Grenze", "D8 · M1", "Dubrovnik, Croatia", "Kotor, Montenegro", ["Karasovići Border Crossing", "Herceg Novi, Montenegro", "Perast, Montenegro"], "Grenztag mit EES- und Verkehrspuffer; nicht mit weiterem Programm überladen."),
    rest(18, "Kotor und Perast", "Kotor oder Perast", "Die vollständige Buchtrunde misst nur etwa 50–60 km, braucht auf der schmalen Uferstrasse aber Zeit. Perast und Risan ruhig angehen; die Fähre Kamenari–Lepetane ist eine mögliche Abkürzung."),
    rest(19, "Bucht von Kotor", "Kotor oder Perast", "Ruhetag oder kurze Buchtrunde auf Hauptstrassen. Altstadt- und Uferverkehr nicht unterschätzen; Motorrad ausserhalb der engen Kerne abstellen."),
    rest(20, "Kotor / Wetter- und Entscheidungstag", "Kotor oder Perast", "Lovćen nur trocken, windarm und nach Tagesprüfung: Bis 15.10.2026 ist die R-1 Richtung Njeguši/Krstac nach Kotor täglich 08:00–15:00 gesperrt. Keine spontane Hin-und-zurück-Fahrt; alternativ Ruhetag und Entscheidung über die Rückfahrt."),
    ride(21, "Kotor – Dubrovnik – Ploče – Makarska", "Makarska", "ca. 250 km", "ca. 4 h 45 plus Grenze", "M1 · D8", "Kotor, Montenegro", "Makarska, Croatia", ["Karasovići Border Crossing", "Dubrovnik, Croatia", "Ploče, Croatia"], "Bewusste Rücketappe mit grosszügigem Grenz- und Pausenpuffer.", "Rückfahrt"),
    ride(22, "Makarska – A1 – Plitvice", "Plitvice", "ca. 300 km", "ca. 4 h", "D76 · A1 · D1", "Makarska, Croatia", "Plitvice Lakes, Croatia", ["Šestanovac, Croatia", "Gornja Ploča, Croatia"], "Wetterrobuster Nordtransfer; nicht auf kleine Inlandstrassen abkürzen.", "Transfer"),
    rest(23, "Plitvice", "Plitvice", "Nationalpark und Wetterreserve; nur markierte Wege benutzen."),
    ride(24, "Plitvice – Rijeka/Opatija – Rovinj", "Rovinj", "ca. 255 km", "ca. 4 h", "D1 · A6 · A7 · A8/A9", "Plitvice Lakes, Croatia", "Rovinj, Croatia", ["Rijeka, Croatia", "Učka Tunnel, Croatia"], "Bei Regen Autobahn und Učka-Tunnel; keine erzwungene Küstennebenroute.", "Transfer nach Istrien"),
    rest(25, "Rovinj", "Rovinj", "Altstadt und Meer; Motorräder ausserhalb des historischen Kerns abstellen."),
    rest(26, "Rovinj / Istrien", "Rovinj", "Letzter echter Reserve- und Genusstag in Kroatien."),
    ride(27, "Rovinj – Triest – Verona", "Verona", "ca. 380 km", "ca. 4 h 30", "A9 · A1 · A4", "Rovinj, Croatia", "Verona, Italy", ["Trieste, Italy"], "Bewusster Autobahn-Transfertag.", "Heimweg / Transfer"),
    rest(28, "Verona", "Verona", "Kultur-, Erholungs- und Schlechtwetterpuffer."),
    ride(29, "Verona – Como", "Como", "ca. 180 km", "ca. 2 h 15", "A4 · A9", "Verona, Italy", "Como, Italy", [], "Kurzer, wetterrobuster Rückfahrtstag.", "Heimweg"),
    ride(30, "Como – Gotthardtunnel – Berikon", "Berikon", "ca. 235 km", "ca. 3 h 15", "A9 · A2 · A1", "Como, Italy", "Berikon, Switzerland", ["Gotthard Road Tunnel, Switzerland"], "Keine hohen Alpenpässe nötig; Gotthardverkehr vor Abfahrt prüfen.", "Heimfahrt")
  ];

  const placeCoordinates = {
    "Berikon": { latitude: 47.351, longitude: 8.372, countryCode: "CH" },
    "Innsbruck": { latitude: 47.269, longitude: 11.405, countryCode: "AT" },
    "Villach": { latitude: 46.614, longitude: 13.846, countryCode: "AT" },
    "Senj": { latitude: 44.989, longitude: 14.905, countryCode: "HR" },
    "Zadar": { latitude: 44.119, longitude: 15.232, countryCode: "HR" },
    "Šibenik": { latitude: 43.735, longitude: 15.895, countryCode: "HR" },
    "Makarska": { latitude: 43.296, longitude: 17.017, countryCode: "HR" },
    "Dubrovnik (Aussenbasis)": { latitude: 42.651, longitude: 18.094, countryCode: "HR" },
    "Kotor oder Perast": { latitude: 42.486, longitude: 18.699, countryCode: "ME" },
    "Plitvice": { latitude: 44.88, longitude: 15.616, countryCode: "HR" },
    "Rovinj": { latitude: 45.081, longitude: 13.638, countryCode: "HR" },
    "Verona": { latitude: 45.438, longitude: 10.992, countryCode: "IT" },
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
      dataVersion: "2026-08-28.1",
      characterTitle: "Die D8 langsam nach Süden",
      characterText: "Eine ruhige Adriarunde mit kurzen Küstenetappen und längeren Aufenthalten in Zadar, Šibenik, Makarska, Dubrovnik, Kotor und Rovinj. Die Kilometerzahl ist kein Ziel; Wettertage und Nichtfahrtage gehören ausdrücklich zur Reise.",
      startDate: "2026-09-24",
      startPlace: "Berikon",
      endPlace: "Berikon",
      timezone: "Europe/Zurich",
      utcOffset: "+02:00",
      participantCount: 2,
      motorcycleCount: 2,
      routeGeometryUrl: "/assets/adria-routes.geojson",
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
          "Bura an der Velebitküste und auf der D8",
          "Stau im Korridor Trogir–Split–Makarska",
          "Grenzwartezeiten Kroatien–Montenegro",
          "saisonale Verkehrsanordnungen am Lovćen",
          "Oktoberwetter in Plitvice, Istrien und am Gotthard"
        ]
      },
      placeAliases: {
        "Dubrovnik, Croatia": "Dubrovnik (Aussenbasis)",
        "Kotor, Montenegro": "Kotor oder Perast",
        "Plitvice Lakes, Croatia": "Plitvice"
      },
      fixPoints: [
        { id: "fix_adria_start", kind: "start", title: "Start in Berikon", place: "Berikon", startsAt: "2026-09-24T08:00:00+02:00", locks: ["date", "origin"], source: "draft" },
        { id: "fix_adria_end", kind: "end", title: "Rückkehr nach Berikon", place: "Berikon", startsAt: "2026-10-23T18:00:00+02:00", locks: ["date", "destination", "overnight"], source: "draft" }
      ],
      narrativeSegments: [
        { title: "Zügig ans Meer.", text: "Drei verlässliche Anreisetage führen bis Senj; danach beginnt die D8 unter dem Velebit.", fromDay: 1, toDay: 4, mapGroup: 0 },
        { title: "Dalmatien ohne Eile.", text: "Zadar, Šibenik und Makarska werden zu echten Basen statt blossen Übernachtungsorten.", fromDay: 5, toDay: 13, mapGroup: 1 },
        { title: "Dubrovnik und die Bucht von Kotor.", text: "Der südliche Schwerpunkt erhält sieben Nächte und einen klaren Wetter- und Entscheidungstag.", fromDay: 14, toDay: 20, mapGroup: 2 },
        { title: "Wetterrobust nach Hause.", text: "Über Plitvice und Rovinj geht es auf grossen Achsen durch Norditalien und den Gotthardtunnel zurück.", fromDay: 21, toDay: 30, mapGroup: 3 }
      ]
    }
  };

  root.__TRIP_ADRIA_DATA__ = Object.freeze(snapshot);
})(typeof globalThis !== "undefined" ? globalThis : this);
