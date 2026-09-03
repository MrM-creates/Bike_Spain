(function (root) {
  "use strict";

  const maps = (origin, destination, waypoints = []) => {
    const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
    if (waypoints.length) params.set("waypoints", waypoints.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const booking = (country, slug, checkIn, checkOut) => `https://www.booking.com/hotel/${country}/${slug}.de.html?checkin=${checkIn}&checkout=${checkOut}&group_adults=2&no_rooms=1&group_children=0`;

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
    ride(1, "Berikon – Arlberg – Innsbruck", "Innsbruck", "ca. 310 km", "ca. 4 h 30", "A3 · A13 · A14 · S16 · A12", "Berikon, Switzerland", "Innsbruck, Austria", ["Feldkirch, Austria", "Arlberg Road Tunnel, Austria"], "Alpenauftakt auf verlässlichen Hauptachsen. Arlbergtunnel und Verkehrslage am Morgen bei ASFINAG prüfen; keine zusätzliche Passjagd.", "Alpenauftakt"),
    ride(2, "Innsbruck – Pustertal – Lienz", "Lienz", "ca. 180 km", "ca. 3 h 30", "A13 · A22 · SS49 · B100", "Innsbruck, Austria", "Lienz, Austria", ["Brenner, Italy", "Brunico, Italy"], "Ruhige Ost-West-Etappe durch das Pustertal. Die Luegbrücke ist 2026 im Regelfall einspurig; 30–45 Minuten Reserve einplanen und bei früher Kälte die Hauptstrassenlinie beibehalten.", "Alpenauftakt"),
    ride(3, "Lienz – Drautal – Wörthersee – Graz", "Graz", "ca. 285 km", "ca. 4 h 15", "B100 · A10 · B83 · A2 · A9 · B70", "Lienz, Austria", "Graz, Austria", ["Spittal an der Drau, Austria", "Velden am Wörther See, Austria"], "Durch das Drautal nach Spittal, danach überwiegend Autobahn mit Seepause in Velden. Rund 4¼ Stunden reine Fahrzeit als vorsichtiger Planwert; mit Pausen etwa 6–7 Stunden unterwegs, ohne grössere Verzögerungen. Nockalm und Murau entfallen wegen des Zeitbudgets vollständig. Vor Abfahrt Wetter und Baustellen auf A10/A2, insbesondere im Bereich Pack, bei ASFINAG prüfen; auch diese Strecke ist nicht wetterunabhängig.", "Transfer mit Seepause"),
    ride(4, "Graz – Maribor – Ljubljana", "Ljubljana", "ca. 195 km", "ca. 2 h 45", "A9 · A1 · A4 · A1", "Graz, Austria", "Ljubljana, Slovenia", ["Maribor, Slovenia"], "Kurzer grenzüberschreitender Fahrtag mit Zeit für Ljubljana. Slowenien ist Übernachtungsort und nicht bloss Transitland.", "Slowenien"),
    ride(5, "Ljubljana – Postojna – Rijeka – Senj", "Senj", "ca. 185 km", "ca. 3 h 15", "A1 · G6/E61 · A7 · D8", "Ljubljana, Slovenia", "Senj, Croatia", ["Postojna, Slovenia", "Rijeka, Croatia"], "Zügig ans Meer; ab Rijeka beginnt die kroatische Küstenlinie. Wegen der vielen slowenischen Autobahnbaustellen 2026 morgens Promet.si prüfen.", "Transfer zur Adria"),
    ride(6, "Senj – Karlobag – Starigrad – Zadar", "Zadar", "ca. 160 km", "ca. 3 h 30", "D8", "Senj, Croatia", "Zadar, Croatia", ["Karlobag, Croatia", "Starigrad, Croatia"], "Senj–Karlobag ist im offiziellen kroatischen Motorradführer als Panoramastrecke ausgewiesen und wird auch von aktuellen Motorradequellen als Höhepunkt bestätigt. Sehr bura-exponiert: Wind- und Sperrlage am Fahrtag bei HAK prüfen."),
    rest(7, "Zadar", "Zadar", "Altstadt, Meer und Erholung. Nin oder Pag nur als kurzer, asphaltierter Ausflug bei Lust und gutem Wetter."),
    ride(8, "Zadar – Biograd – Vodice – Šibenik", "Šibenik", "ca. 80 km", "ca. 1 h 45", "D8", "Zadar, Croatia", "Šibenik, Croatia", ["Biograd na Moru, Croatia", "Vodice, Croatia"], "Kurze D8-Etappe mit Zeit für Fotostopps."),
    rest(9, "Šibenik / Krka", "Šibenik", "Altstadt, Hafen und optional Krka; kein Programmzwang und nicht in enge Gassen navigieren."),
    ride(10, "Šibenik – Primošten – Trogir – Makarska", "Makarska", "ca. 165 km", "ca. 3 h 30", "D8", "Šibenik, Croatia", "Makarska, Croatia", ["Primošten, Croatia", "Trogir, Croatia"], "Trogir–Split ist der verkehrsreichste Abschnitt der D8. Ausserhalb der Spitzenzeit durchfahren; bei dichtem Verkehr ab Split die A1-Umfahrung via Dugopolje/Šestanovac prüfen. Omiš–Makarska bleibt als landschaftlicher Kern erhalten."),
    rest(11, "Makarska", "Makarska", "Meer-und-Berge-Basis; Promenade und Erholung."),
    rest(12, "Makarska / Küstentag", "Makarska", "Kurzer Küstenausflug oder vollständiger Ruhetag; zugleich Wetterreserve."),
    ride(13, "Makarska – Ploče – Pelješac-Brücke – Ston – Dubrovnik", "Dubrovnik (Aussenbasis)", "ca. 210 km", "ca. 3 h 45", "D8 · Pelješac-Brücke · Ston-Umfahrung", "Makarska, Croatia", "Dubrovnik, Croatia", ["Ploče, Croatia", "Pelješac Bridge, Croatia", "Ston, Croatia"], "Die heutige D8 führt über Pelješac-Brücke und Ston-Umfahrung vollständig durch Kroatien; die alten Karten mit zwei Neum-Grenzen sind überholt. Unterkunft ausserhalb der engen Altstadt mit sicherer Motorradabstellung wählen."),
    rest(14, "Dubrovnik", "Dubrovnik (Aussenbasis)", "Stadttag ohne Motorradlogistik."),
    rest(15, "Dubrovnik / Reserve", "Dubrovnik (Aussenbasis)", "Zweiter voller Tag für Erholung, Wetter oder einen ruhigen Küstentag."),
    ride(16, "Dubrovnik – Karasovići – Bucht von Kotor", "Kotor oder Perast", "ca. 100 km", "ca. 2 h 30 plus Grenze", "D8 · M1", "Dubrovnik, Croatia", "Kotor, Montenegro", ["Karasovići Border Crossing", "Herceg Novi, Montenegro", "Perast, Montenegro"], "Grenztag mit EES-Registrierung für Nicht-EU-Reisende und grosszügigem Verkehrspuffer; Karasovići kann stark schwanken. Die schöne Linie bleibt bewusst rund um die Bucht über Perast statt über die Kamenari-Fähre."),
    rest(17, "Kotor und Perast", "Kotor oder Perast", "Die vollständige Buchtrunde misst nur etwa 50–60 km, braucht auf der schmalen Uferstrasse aber Zeit. Perast und Risan ruhig angehen."),
    rest(18, "Bucht von Kotor", "Kotor oder Perast", "Ruhetag oder kurze Buchtrunde auf Hauptstrassen. Motorrad ausserhalb der engen Kerne abstellen."),
    rest(19, "Kotor / Wetter- und Entscheidungstag", "Kotor oder Perast", "Lovćen nur trocken, windarm und nach Tagesprüfung. Keine spontane Hin-und-zurück-Fahrt; alternativ ein weiterer ruhiger Tag an der Bucht."),
    ride(20, "Kotor – Perast – Dubrovnik-Umfahrung – Ston", "Ston / Mali Ston", "ca. 150 km", "ca. 4 h plus Grenze", "M1 · D8 · Zufahrt Ston", "Kotor, Montenegro", "Ston, Croatia", ["42.487161,18.699758", "Karasovići Border Crossing"], "Nach vier vollen Nächten Montenegro rund um die Bucht auf der Hauptstrasse oberhalb von Perast, ohne Kamenari-Fähre. Über Karasovići und die D8 an Dubrovnik vorbei, ohne Altstadtzufahrt, bis Ston. Rund 4 Stunden reine Fahrt einplanen; mit Pausen und Grenzpuffer etwa 6–7 Stunden unterwegs, bei langer Grenzwartezeit mehr. Unterkunft bevorzugt in Luka oder Hodilje ausserhalb der historischen Ortskerne; die letzten Kilometer und die Zufahrt zum gewählten Haus vor Buchung prüfen. Am Fahrtag AMSCG und HAK für Strassen, Wind und Grenze kontrollieren.", "Rückfahrt zur Fähre"),
    ride(21, "Ston – Pelješac-Brücke – Split / Nachtfähre nach Ancona", "Ancona", "ca. 185 km plus Nachtfähre", "ca. 3 h plus Check-in und Überfahrt", "D8 · D425 · A1 · D1 · D8 · D410 · Fährlinie 53", "Ston, Croatia", "Ancona, Italy", ["42.930204,17.534612", "Split Ferry Port, Croatia"], "Über die Pelješac-Brücke ohne Neum-Transit und ab Karamatići bewusst auf der A1 bis Dugopolje, dann zum Hafen Split. Rund 3 Stunden reine Fahrt; mit Pausen und Stadtverkehr etwa 4–5 Stunden bis zum Hafen. Morgens losfahren, am frühen Nachmittag ankommen; keine zusätzliche Küstenrunde. Check-in spätestens 18:00 als Planwert, verbindlich gelten Ticket und Reederei. Geplant: Abfahrt 14.10. um 20:00, Ankunft 15.10. um 07:00. Die Kartenlinie folgt an Land den Strassen; die Seeverbindung ist schematisch, der Google-Maps-Link endet am Hafen Split. Jadrolinija nennt am 03.09. einen technischen Unterbruch bis 09.09.2026; Wiederaufnahme, Kabine und zwei Motorradplätze am 22.09. bestätigen. Nicht gebucht und noch nicht operativ gesichert.", "Fährtag"),
    ride(22, "Ancona – Fano – Furlo-Schlucht – Urbino", "Urbino", "ca. 130 km", "ca. 3 h", "SS16 · SS73bis · SP3", "Ancona, Italy", "Urbino, Italy", ["Fano, Italy", "Gola del Furlo, Italy"], "Nach der Ausschiffung bewusst kurze Marken-Etappe. Die alte Flaminia durch die Furlo-Schlucht wird von offiziellen italienischen und aktuellen Motorradquellen empfohlen; trotzdem nur bei geöffneter, trockener Strecke fahren. Urbino-Unterkunft ausserhalb der ZTL mit gut erreichbarer Abstellung wählen.", "Italien / Genussfahrt"),
    rest(23, "Urbino und Montefeltro", "Urbino", "Renaissance-Stadt, Erholung und optional eine kurze Runde durch die sanften Hügel des Montefeltro."),
    ride(24, "Urbino – San Marino – Rimini – Ravenna", "Ravenna", "ca. 125 km", "ca. 3 h", "SS73bis · SS72 · SS16", "Urbino, Italy", "Ravenna, Italy", ["San Marino", "Rimini, Italy"], "San Marino und Rimini als flexible Stopps; bei Regen direkt auf gut ausgebauten Strassen nach Ravenna."),
    ride(25, "Ravenna – Comacchio – Ferrara – Colli Euganei", "Arquà Petrarca", "ca. 150 km", "ca. 3 h", "SS309 · RA8 · SP1 · SS16 · A13 · SR10", "Ravenna, Italy", "Arquà Petrarca, Italy", ["Comacchio, Italy", "Ferrara, Italy"], "Nur der kurze landschaftliche Abschnitt bis Comacchio bleibt auf der SS309. Danach führt die Route über Ferrara ins Landesinnere und vermeidet den langen, verkehrs- und schwerlastreichen Romea-Abschnitt bis Chioggia. Altstadtzufahrten und ZTL vermeiden."),
    rest(26, "Colli Euganei", "Arquà Petrarca", "Ruhiger Hügeltag, Therme oder vollständige Erholung. Keine Pflichtkilometer."),
    ride(27, "Colli Euganei – Valeggio – Lago d’Iseo", "Lago d’Iseo", "ca. 180 km", "ca. 3 h 15", "SR10 · A4 · SP510", "Arquà Petrarca, Italy", "Iseo, Italy", ["Valeggio sul Mincio, Italy"], "Norditalienische Übergangsetappe mit Autobahnreserve bei Regen; Seeuferverkehr nicht unterschätzen."),
    rest(28, "Lago d’Iseo", "Lago d’Iseo", "Letzter echter Genuss- und Wettertag vor der Heimreise."),
    ride(29, "Lago d’Iseo – Bergamo – Como", "Como", "ca. 145 km", "ca. 2 h 30", "SP510 · A4 · A9", "Iseo, Italy", "Como, Italy", ["Bergamo, Italy"], "Kurzer, tiefer und wetterrobuster Rückfahrtstag; Stadtzufahrten und ZTL beachten.", "Heimweg"),
    ride(30, "Como – Gotthardtunnel – Berikon", "Berikon", "ca. 235 km", "ca. 3 h 15", "A9 · A2 · A1", "Como, Italy", "Berikon, Switzerland", ["Gotthard Road Tunnel, Switzerland"], "Keine hohen Alpenpässe: Splügen und Engadin bleiben ausgeschlossen. Gotthardverkehr vor Abfahrt prüfen.", "Heimfahrt")
  ];

  // Navigation on ferry days covers the road approach, never an inferred drive to Italy.
  days[20].main = maps(days[20].origin, "Split Ferry Port, Croatia", days[20].waypoints.slice(0, -1));
  days[19].points = "Perast (M1 oberhalb des Ortes) · Karasovići · Dubrovnik-Umfahrung";
  days[20].points = "Pelješac-Brücke · A1 · Hafen Split";

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
    "Ston / Mali Ston": { latitude: 42.838, longitude: 17.697, countryCode: "HR" },
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
    publishedVersion: "2026-09-03T08:20:00.000Z",
    planKind: "draft",
    originalDays: days,
    days,
    accommodations: [
      {
        id: "innsbruck-mutters",
        title: "Innsbruck",
        startDate: "2026-09-24",
        endDate: "2026-09-25",
        booking: "open",
        currentFirstChoice: "Hotel dasMEI · Mutters",
        currentFirstChoiceUrl: booking("at", "dasmei-medical-selfness", "2026-09-24", "2026-09-25"),
        currentAlternative: "Muttererhof · Mutters",
        currentAlternativeUrl: booking("at", "muttererhof", "2026-09-24", "2026-09-25"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "lienz",
        title: "Lienz",
        startDate: "2026-09-25",
        endDate: "2026-09-26",
        booking: "open",
        currentFirstChoice: "Hotel Holunderhof · Lienz",
        currentFirstChoiceUrl: booking("at", "holunderhof", "2026-09-25", "2026-09-26"),
        currentAlternative: "Gasthof Schlossberghof · Lienz",
        currentAlternativeUrl: booking("at", "gasthof-schlossberghof", "2026-09-25", "2026-09-26"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "graz-west",
        title: "Graz",
        startDate: "2026-09-26",
        endDate: "2026-09-27",
        booking: "open",
        currentFirstChoice: "Hotel Steiermarkhof · Graz-Wetzelsdorf",
        currentFirstChoiceUrl: booking("at", "steiermarkhof", "2026-09-26", "2026-09-27"),
        currentAlternative: "Hotel AT HOME · Graz-Südost",
        currentAlternativeUrl: booking("at", "athome", "2026-09-26", "2026-09-27"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "ljubljana-ring",
        title: "Ljubljana",
        startDate: "2026-09-27",
        endDate: "2026-09-28",
        booking: "open",
        currentFirstChoice: "Urban Ring Hotel · Ljubljana-Rudnik",
        currentFirstChoiceUrl: booking("si", "urban-ring", "2026-09-27", "2026-09-28"),
        currentAlternative: "B&B Pod vrbo · Ljubljana-Trnovo",
        currentAlternativeUrl: booking("si", "guesthouse-pod-vrbo", "2026-09-27", "2026-09-28"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "senj",
        title: "Senj",
        startDate: "2026-09-28",
        endDate: "2026-09-29",
        booking: "open",
        currentFirstChoice: "Zora · ruhiges Apartment in Senj",
        currentFirstChoiceUrl: booking("hr", "zora-senj", "2026-09-28", "2026-09-29"),
        currentAlternative: "Beautiful Sea View Studio Danijela · Senj",
        currentAlternativeUrl: booking("hr", "apartment-barbic", "2026-09-28", "2026-09-29"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "zadar",
        title: "Zadar",
        startDate: "2026-09-29",
        endDate: "2026-10-01",
        booking: "open",
        currentFirstChoice: "Sky & Sun Luxury Rooms · privater Garagenplatz",
        currentFirstChoiceUrl: booking("hr", "sky-amp-sun-lux-rooms", "2026-09-29", "2026-10-01"),
        currentAlternative: "Vila Siega · Zadar",
        currentAlternativeUrl: booking("hr", "vila-siega", "2026-09-29", "2026-10-01"),
        parking: "Den vorhandenen Innenstellplatz vor der Buchung schriftlich für zwei Maschinen bestätigen lassen"
      },
      {
        id: "sibenik",
        title: "Šibenik",
        startDate: "2026-10-01",
        endDate: "2026-10-03",
        booking: "open",
        currentFirstChoice: "Maja Apartment · Šibenik",
        currentFirstChoiceUrl: booking("hr", "maja-apartment-sibenik", "2026-10-01", "2026-10-03"),
        currentAlternative: "Šibenik Style Suites",
        currentAlternativeUrl: booking("hr", "sibenik-style-apartments", "2026-10-01", "2026-10-03"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "makarska-base",
        title: "Makarska",
        startDate: "2026-10-03",
        endDate: "2026-10-06",
        booking: "open",
        currentFirstChoice: "Villa Pehar · ruhige Wohnung mit Meer- und Biokovo-Blick",
        currentFirstChoiceUrl: "https://www.airbnb.ch/rooms/35830801?adults=2&check_in=2026-10-03&check_out=2026-10-06&locale=de",
        currentAlternative: "Der Blick · modernes Apartment mit zwei Schlafzimmern",
        currentAlternativeUrl: "https://www.airbnb.ch/rooms/1152154313065696835?adults=2&check_in=2026-10-03&check_out=2026-10-06&locale=de",
        parking: "Die private Abstellfläche vor der Buchung schriftlich für zwei Maschinen bestätigen lassen"
      },
      {
        id: "dubrovnik-lapad",
        title: "Dubrovnik (Aussenbasis)",
        startDate: "2026-10-06",
        endDate: "2026-10-09",
        booking: "open",
        currentFirstChoice: "OSCAR Suite · neues Apartment mit abgeschlossenem Stellplatz",
        currentFirstChoiceUrl: "https://www.airbnb.ch/rooms/648206203313909249?adults=2&check_in=2026-10-06&check_out=2026-10-09&locale=de",
        currentAlternative: "Miss Mia · Apartment mit Meerblick und Balkon",
        currentAlternativeUrl: "https://www.airbnb.ch/rooms/599181579397214439?adults=2&check_in=2026-10-06&check_out=2026-10-09&locale=de",
        parking: "Den vorhandenen Innenstellplatz vor der Buchung schriftlich für zwei Maschinen bestätigen lassen"
      },
      {
        id: "kotor-dobrota",
        title: "Kotor oder Perast",
        startDate: "2026-10-09",
        endDate: "2026-10-13",
        booking: "open",
        currentFirstChoice: "Wohnung mit sensationeller Aussicht · Sveti Stasije, Dobrota",
        currentFirstChoiceUrl: "https://www.airbnb.ch/rooms/906512978879018565?check_in=2026-10-09&check_out=2026-10-13&guests=2&adults=2&locale=de",
        currentAlternative: "Bright & Elegant Secret Vacation Home · Dobrota",
        currentAlternativeUrl: "https://www.airbnb.com/rooms/1138334092306069668?check_in=2026-10-09&check_out=2026-10-13&guests=2&adults=2",
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen"
      },
      {
        id: "ston-return",
        title: "Ston / Mali Ston",
        startDate: "2026-10-13",
        endDate: "2026-10-14",
        booking: "open",
        currentFirstChoice: "Apartman I&M · Luka bei Ston · Meerblick und Küche",
        currentFirstChoiceUrl: booking("hr", "i-amp-m", "2026-10-13", "2026-10-14"),
        currentAlternative: "Apartmani Mirjana · Hodilje · Apartment ausserhalb von Ston",
        currentAlternativeUrl: booking("hr", "apartmani-mirjana-hodilje", "2026-10-13", "2026-10-14"),
        parking: "Beide Inserate nennen private Parkplätze. Ebener, sicherer Stellplatz für zwei Maschinen, asphaltierte Zufahrt und Rangierfläche schriftlich bestätigen lassen. Kandidaten, nicht gebucht: Verfügbarkeit für 13.–14.10., Mindestaufenthalt, Gesamtpreis und kostenlose Stornofrist noch offen; beide Adressen nennen den 2. Stock."
      },
      {
        id: "split-ancona-cabin",
        title: "Ancona",
        startDate: "2026-10-14",
        endDate: "2026-10-15",
        booking: "open",
        currentFirstChoice: "Aussenkabine auf der Nachtfähre Split–Ancona",
        currentFirstChoiceUrl: "https://www.jadrolinija.hr/de/reise-buchen",
        currentAlternative: "Innenkabine auf der Nachtfähre Split–Ancona",
        currentAlternativeUrl: "https://www.jadrolinija.hr/de/reise-buchen",
        parking: "Kabine und Plätze für zwei Maschinen am 22. September gemeinsam bestätigen"
      },
      {
        id: "urbino-country",
        title: "Urbino",
        startDate: "2026-10-15",
        endDate: "2026-10-17",
        booking: "open",
        currentFirstChoice: "Country House Ca’ Balsomino · Urbino",
        currentFirstChoiceUrl: booking("it", "country-house-ca-39-balsomino", "2026-10-15", "2026-10-17"),
        currentAlternative: "Tenuta Santi Giacomo e Filippo · Urbino",
        currentAlternativeUrl: booking("it", "urbino-resort", "2026-10-15", "2026-10-17"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "ravenna",
        title: "Ravenna",
        startDate: "2026-10-17",
        endDate: "2026-10-18",
        booking: "open",
        currentFirstChoice: "Grand Hotel Mattei · Ravenna-Nord",
        currentFirstChoiceUrl: booking("it", "holiday-inn-ravenna", "2026-10-17", "2026-10-18"),
        currentAlternative: "Hotel Classicano · Ravenna-Süd",
        currentAlternativeUrl: booking("it", "classicano", "2026-10-17", "2026-10-18"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "arqua-petrarca",
        title: "Arquà Petrarca",
        startDate: "2026-10-18",
        endDate: "2026-10-20",
        booking: "open",
        currentFirstChoice: "La Giuggiola · Arquà Petrarca",
        currentFirstChoiceUrl: booking("it", "la-giuggiola-arqua-petrarca", "2026-10-18", "2026-10-20"),
        currentAlternative: "Borgo Petrarca · Arquà Petrarca",
        currentAlternativeUrl: booking("it", "borgo-petrarca-arqua-petrarca", "2026-10-18", "2026-10-20"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "iseo",
        title: "Lago d’Iseo",
        startDate: "2026-10-20",
        endDate: "2026-10-22",
        booking: "open",
        currentFirstChoice: "B&B La Castellina · Iseo",
        currentFirstChoiceUrl: booking("it", "b-amp-b-la-castellina-iseo", "2026-10-20", "2026-10-22"),
        currentAlternative: "Relais I Due Roccoli · Iseo",
        currentAlternativeUrl: booking("it", "relais-i-due-roccoli", "2026-10-20", "2026-10-22"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      },
      {
        id: "como-lazzago",
        title: "Como",
        startDate: "2026-10-22",
        endDate: "2026-10-23",
        booking: "open",
        currentFirstChoice: "L’Antica Corte Lazzago · Como-Süd",
        currentFirstChoiceUrl: booking("it", "l-39-antica-corte-lazzago", "2026-10-22", "2026-10-23"),
        currentAlternative: "SantAgata Bed & Breakfast · Como",
        currentAlternativeUrl: booking("it", "santagata-bed-amp-breakfast", "2026-10-22", "2026-10-23"),
        parking: "Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen lassen"
      }
    ],
    trip: {
      id: "trip_adria_2026",
      name: "Adria & Balkan 2026",
      dataVersion: "2026-09-03.1",
      characterTitle: "Adriawind, Küstenkurven und stille Buchten",
      characterText: "Durch das Pustertal und Drautal, mit einer Pause am Wörthersee, führt die Reise über Graz nach Slowenien. Danach folgen die D8, lange Aufenthalte an der dalmatinischen Küste und vier Nächte in der Bucht von Kotor. Die Nachtfähre nach Ancona öffnet einen eigenständigen Rückweg durch die Marken und Norditalien.",
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
        targetDailyRidingHours: 4,
        maxDailyRidingHours: 5,
        accommodationStyle: "Motorradfreundlich mit sicherer Abstellung",
        preferGoodWeather: true,
        asphaltOnly: true
      },
      planningProfile: {
        countries: ["Schweiz", "Österreich", "Italien", "Slowenien", "Kroatien", "Montenegro"],
        routeConstraints: [
          "Pro Fahrtag rund 4 Stunden reine Fahrzeit anstreben; 5 Stunden reine Fahrzeit sind die Obergrenze, kein tägliches Ziel.",
          "Pausen, Besichtigungen, Tanken, Verkehrspuffer sowie Grenz- und Fährwartezeiten zusätzlich ausweisen; 4–5 Stunden Fahrt können bereits 7 oder mehr Stunden unterwegs bedeuten.",
          "Nicht durch optimistisch verkürzte Zeitangaben passend rechnen: Überschreitungen offen melden und die Strecke vereinfachen. Übernachtungen oder Reisedaten nur nach Rücksprache verschieben.",
          "Nockalmstraße und Murau gehören nicht mehr zum Fahrtag Lienz–Graz, auch nicht als zusätzliche Schönwettervariante.",
          "Vier Nächte Montenegro sowie die vorhandenen Ruhetage erhalten. Rückweg am 13.10. nur bis Ston/Mali Ston, am 14.10. über Pelješac-Brücke und A1 zum Hafen Split. Keine zusätzliche Küstenrunde am Fährtag; Pausen, Grenzwartezeit und Check-in separat einplanen."
        ],
        seasonalRisks: [
          "spätherbstliches Alpenwetter am Arlberg, im Pustertal und auf der A2 im Bereich Pack",
          "Bura an der Velebitküste und auf der D8",
          "Stau im Korridor Trogir–Split–Makarska",
          "Grenzwartezeiten Kroatien–Montenegro",
          "saisonale Verkehrsanordnungen am Lovćen",
          "fester Fahrplantag und begrenzte Motorradplätze auf der Fähre Split–Ancona; laut Reedereimeldung am 03.09. technischer Betriebsunterbruch bis 09.09.2026, Wiederaufnahme noch bestätigen",
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
          summary: "Bei einer ungünstigen Alpenlage können die Motorräder in Feldkirch verladen werden. Graz bleibt damit Ausgangspunkt für Slowenien, ohne die Hauptplanung über Lienz und den Wörthersee zu ersetzen.",
          replacesDays: [1, 2, 3, 4],
          steps: [
            "Tag 1: Berikon–Feldkirch und Motorräder verladen",
            "Über Nacht mit dem ÖBB Nightjet nach Graz",
            "Am Folgetag Graz–Ljubljana",
            "Die gewonnenen Tage bleiben als Wetter- und Slowenienpuffer; Anschluss an Tag 5 nach Senj"
          ],
          decision: "Etwa 5–7 Tage vor Abreise anhand Alpenprognose und verfügbarer Motorradplätze entscheiden.",
          sourceUrl: "https://www.nightjet.com/de/angebote/automotorrad"
        },
        {
          id: "split-ancona-ferry-watch",
          title: "Fährkontrolle: Split–Ancona",
          status: "watch",
          summary: "Die Abfahrt am 14. Oktober steht im offiziellen Fahrplan. Die am 03.09. gelesene Reedereimeldung nennt einen technischen Unterbruch bis 09.09.2026. Wiederaufnahme und Verfügbarkeit sind noch zu bestätigen; die Oktoberfahrt ist nicht als operativ gesichert markiert.",
          replacesDays: [21],
          steps: [
            "Am 22. September offizielle Wiederaufnahme der Linie 53 kontrollieren",
            "Verfügbarkeit für zwei Personen, zwei Motorräder und eine Kabine prüfen",
            "Erst danach die Fähre verbindlich als gebucht markieren",
            "Falls die Linie nicht wieder aufgenommen wird, Rückweg ab Split über Slowenien und Norditalien neu planen"
          ],
          decision: "Kontrolltermin 22.09.2026; bis dahin nur flexibel stornierbare Unterkünfte buchen.",
          sourceUrl: "https://www.jadrolinija.hr/en/news/linije-u-prekidu_2"
        }
      ],
      fixPoints: [
        { id: "fix_adria_start", kind: "start", title: "Start in Berikon", place: "Berikon", startsAt: "2026-09-24T08:00:00+02:00", locks: ["date", "origin"], source: "draft" },
        { id: "fix_adria_ferry_split_ancona", kind: "transport", title: "Nachtfähre Split → Ancona", stageDay: 21, place: "Split", startsAt: "2026-10-14T20:00:00+02:00", endsAt: "2026-10-15T07:00:00+02:00", locks: ["date", "time", "place", "stage", "route"], source: "official-timetable" },
        { id: "fix_adria_end", kind: "end", title: "Rückkehr nach Berikon", place: "Berikon", startsAt: "2026-10-23T18:00:00+02:00", locks: ["date", "destination", "overnight"], source: "draft" }
      ],
      narrativeSegments: [
        { title: "Über die Alpen nach Slowenien.", text: "Über Arlberg und Pustertal nach Lienz, dann durchs Drautal mit Seepause am Wörthersee nach Graz. Ljubljana bekommt eine eigene Nacht; die Nockalm entfällt zugunsten kürzerer Fahrtage.", fromDay: 1, toDay: 5, mapGroup: 0 },
        { title: "Dalmatien ohne Eile.", text: "Ab Senj folgt die Reise der D8. Zadar, Šibenik und Makarska werden zu echten Basen statt blossen Übernachtungsorten.", fromDay: 6, toDay: 12, mapGroup: 1 },
        { title: "Dubrovnik und die Bucht von Kotor.", text: "Der südliche Schwerpunkt bleibt unangetastet: Dubrovnik erhält drei, Kotor und Perast vier Nächte.", fromDay: 13, toDay: 19, mapGroup: 2 },
        { title: "Mit der Nachtfähre über die Adria.", text: "Von Kotor geht es entspannt bis Ston, mit einer Nacht in der Umgebung von Mali Ston. Am nächsten Tag führen Pelješac-Brücke und Autobahn mit Zeitreserve zum Hafen Split; über Nacht geht es nach Ancona.", fromDay: 20, toDay: 21, mapGroup: 3 },
        { title: "Durch die Marken und Norditalien nach Hause.", text: "Furlo, Urbino, Ravenna, die Colli Euganei und der Lago d’Iseo bilden einen eigenständigen Rückweg bis Como und durch den Gotthardtunnel.", fromDay: 22, toDay: 30, mapGroup: 4 }
      ]
    }
  };

  root.__TRIP_ADRIA_DATA__ = Object.freeze(snapshot);
})(typeof globalThis !== "undefined" ? globalThis : this);
