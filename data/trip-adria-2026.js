(function (root) {
  "use strict";

  const maps = (origin, destination, waypoints = []) => {
    const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
    if (waypoints.length) params.set("waypoints", waypoints.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const booking = (country, slug, checkIn, checkOut) => `https://www.booking.com/hotel/${country}/${slug}.de.html?checkin=${checkIn}&checkout=${checkOut}&group_adults=2&no_rooms=1&group_children=0`;

  const apartmentReview = (firstChoiceNotes, alternativeNotes, sources = []) => ({
    reviewedAt: "2026-09-03",
    motorcycleParking: "unknown",
    currentFirstChoiceNotes: firstChoiceNotes,
    currentAlternativeNotes: alternativeNotes,
    reviewNote: "Kandidaten, nicht gebucht. Konkrete Wohnung, Verfügbarkeit, Mindestaufenthalt, Gesamtpreis und vollständige Stornobedingungen vor Buchung prüfen. Sichere Abstellung für zwei Maschinen, asphaltierte Zufahrt und Rangierfläche schriftlich bestätigen lassen. Kartenmarker und Tagesrouten zeigen noch den Reiseort, nicht die endgültige Hauszufahrt.",
    reviewSources: sources
  });

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
    ride(1, "Berikon – Arlbergtunnel – Innsbruck", "Innsbruck", "ca. 295 km", "ca. 4 h 30", "A3 · A13 · Verbindung Feldkirch · A14 · S16 · A12", "Berikon, Switzerland", "Innsbruck, Austria", ["47.126940,10.160801"], "Anreise über die S16 durch den Arlbergtunnel, nicht über L197/B197 und den Arlbergpass. Der präzise Tunnelanker ersetzt den falsch zugeordneten Suchpunkt; kein zusätzlicher Stopp im Zentrum von Feldkirch. Rund 4½ Stunden reine Fahrt planen, mit Pausen und Verkehrsreserve etwa 6–7 Stunden unterwegs. Vignette/Streckenmaut sowie Tunnel- und Verkehrslage bei ASFINAG vor Abfahrt prüfen. Bei einer Sperre nicht automatisch auf einen Alpenpass ausweichen.", "Alpenauftakt"),
    ride(2, "Innsbruck – Pustertal – Lienz", "Lienz", "ca. 180 km", "ca. 3 h 30", "A13 · A22 · SS49 · B100", "Innsbruck, Austria", "Lienz, Austria", ["Brenner, Italy", "Brunico, Italy"], "Ruhige Ost-West-Etappe durch das Pustertal. Die Luegbrücke ist 2026 im Regelfall einspurig; 30–45 Minuten Reserve einplanen und bei früher Kälte die Hauptstrassenlinie beibehalten.", "Alpenauftakt"),
    ride(3, "Lienz – Drautal – Wörthersee – Graz", "Graz", "ca. 285 km", "ca. 4 h 15", "B100 · A10 · B83 · A2 · A9 · B70", "Lienz, Austria", "Graz, Austria", ["Spittal an der Drau, Austria", "Velden am Wörther See, Austria"], "Durch das Drautal nach Spittal, danach überwiegend Autobahn mit Seepause in Velden. Rund 4¼ Stunden reine Fahrzeit als vorsichtiger Planwert; mit Pausen etwa 6–7 Stunden unterwegs, ohne grössere Verzögerungen. Nockalm und Murau entfallen wegen des Zeitbudgets vollständig. Vor Abfahrt Wetter und Baustellen auf A10/A2, insbesondere im Bereich Pack, bei ASFINAG prüfen; auch diese Strecke ist nicht wetterunabhängig.", "Transfer mit Seepause"),
    ride(4, "Graz – Maribor – Ljubljana", "Ljubljana", "ca. 195 km", "ca. 2 h 45", "A9 · A1 · A4 · A1", "Graz, Austria", "Ljubljana, Slovenia", ["Maribor, Slovenia"], "Kurzer grenzüberschreitender Fahrtag mit Zeit für Ljubljana. Slowenien ist Übernachtungsort und nicht bloss Transitland.", "Slowenien"),
    ride(5, "Ljubljana – Postojna – Rijeka – Senj", "Senj", "ca. 185 km", "ca. 3 h 15", "A1 · G6/E61 · A7 · D8", "Ljubljana, Slovenia", "Senj, Croatia", ["Postojna, Slovenia", "Rijeka, Croatia"], "Zügig ans Meer; ab Rijeka beginnt die kroatische Küstenlinie. Wegen der vielen slowenischen Autobahnbaustellen 2026 morgens Promet.si prüfen.", "Transfer zur Adria"),
    ride(6, "Senj – Karlobag – Starigrad – Zadar", "Zadar", "ca. 160 km", "ca. 3 h 30", "D8", "Senj, Croatia", "Zadar, Croatia", ["Karlobag, Croatia", "Starigrad, Croatia"], "Senj–Karlobag ist im offiziellen kroatischen Motorradführer als Panoramastrecke ausgewiesen und wird auch von aktuellen Motorradequellen als Höhepunkt bestätigt. Sehr bura-exponiert: Wind- und Sperrlage am Fahrtag bei HAK prüfen."),
    rest(7, "Zadar", "Zadar", "Altstadt, Meer und Erholung. Nin oder Pag nur als kurzer, asphaltierter Ausflug bei Lust und gutem Wetter."),
    ride(8, "Zadar – Biograd – Vodice – Šibenik", "Šibenik", "ca. 80 km", "ca. 1 h 45", "D8", "Zadar, Croatia", "Šibenik, Croatia", ["Biograd na Moru, Croatia", "Vodice, Croatia"], "Kurze D8-Etappe mit Zeit für Fotostopps."),
    rest(9, "Šibenik / Krka", "Šibenik", "Altstadt, Hafen und optional Krka; kein Programmzwang und nicht in enge Gassen navigieren."),
    ride(10, "Šibenik – Primošten – Trogir – Omiš – Makarska", "Makarska", "ca. 145 km", "ca. 4 h", "D8 · örtliche Zufahrten", "Šibenik, Croatia", "Makarska, Croatia", ["43.590954,15.926002", "43.523198,16.246941", "43.445972,16.637981"], "Küstenlinie über den Rand von Primošten und die Hauptstrasse nördlich der Altstadt von Trogir, dann auf der D8 über Dugi Rat und Omiš nach Makarska. Die Altstädte bei einem Stopp zu Fuss besuchen. Der zusätzliche Küstenanker verhindert die bisherige unbeabsichtigte A1-Abkürzung. Rund 4 Stunden reine Fahrt, mit Stopps und Stadtverkehr etwa 6–7 Stunden unterwegs. Trogir–Split und Omiš möglichst ausserhalb der Spitzenzeit passieren; bei Stau zuerst Besichtigungen kürzen. Eine Autobahnalternative wäre eine bewusste Routenänderung und lässt Teile der Küste aus. Vor Abfahrt HAK für Wind, Baustellen und Sperren prüfen."),
    rest(11, "Makarska", "Makarska", "Meer-und-Berge-Basis; Promenade und Erholung."),
    rest(12, "Makarska / Küstentag", "Makarska", "Kurzer Küstenausflug oder vollständiger Ruhetag; zugleich Wetterreserve."),
    ride(13, "Makarska – Drvenik – Pelješac-Brücke – Ston – Dubrovnik", "Dubrovnik (Aussenbasis)", "ca. 175 km", "ca. 4 h", "D8 · Pelješac-Brücke · Zufahrt Ston", "Makarska, Croatia", "Dubrovnik, Croatia", ["43.155966,17.248725", "42.930204,17.534612", "Ston, Croatia"], "Auf der D8 südwärts mit kurzem Küstenstopp in Drvenik, weiter im Raum Ploče zur Pelješac-Brücke und über Ston nach Dubrovnik. Keine A1-Abkürzung und kein Neum-Transit. Der Brückenanker liegt direkt auf der Fahrbahn. Rund 4 Stunden reine Fahrt; mit Küstenstopps und Pausen etwa 6–7 Stunden unterwegs. Wind und Brückenfreigabe bei HAK vor Abfahrt prüfen. Das Ziel ist vorläufig ein Ortsanker ausserhalb der Altstadt; die genaue Zufahrt zur gewählten Aussenbasis folgt mit der Unterkunftsentscheidung."),
    rest(14, "Dubrovnik", "Dubrovnik (Aussenbasis)", "Stadttag ohne Motorradlogistik."),
    rest(15, "Dubrovnik / Reserve", "Dubrovnik (Aussenbasis)", "Zweiter voller Tag für Erholung, Wetter oder einen ruhigen Küstentag."),
    ride(16, "Dubrovnik – Karasovići – Bucht von Kotor", "Kotor oder Perast", "ca. 100 km", "ca. 3 h plus Grenze", "D8 · M1", "Dubrovnik, Croatia", "Kotor, Montenegro", ["Karasovići Border Crossing", "Herceg Novi, Montenegro", "Perast, Montenegro"], "Grenztag: rund 3 Stunden reine Fahrt, Pausen und grosszügiger Grenzpuffer zusätzlich; Karasovići kann stark schwanken. EES gilt nicht für Schweizer Staatsangehörige und Inhaber gültiger Schengen-Aufenthaltstitel. Reisepass und gegebenenfalls Aufenthaltstitel im Original mitführen; Dokumentenprüfung und Wartezeiten bleiben bestehen. Montenegro hat eigene Einreiseregeln. Die schöne Linie bleibt bewusst rund um die Bucht über Perast statt über die Kamenari-Fähre. In Perast auf der Hauptstrasse bleiben, die historische Uferzone nur zu Fuss besuchen; Maps-Neuberechnung vor Abfahrt prüfen."),
    rest(17, "Kotor und Perast", "Kotor oder Perast", "Die vollständige Buchtrunde misst nur etwa 50–60 km, braucht auf der schmalen Uferstrasse aber Zeit. Perast und Risan ruhig angehen."),
    rest(18, "Bucht von Kotor", "Kotor oder Perast", "Ruhetag oder kurze Buchtrunde auf Hauptstrassen. Motorrad ausserhalb der engen Kerne abstellen."),
    rest(19, "Kotor / Wetter- und Entscheidungstag", "Kotor oder Perast", "Lovćen nur trocken, windarm und nach Tagesprüfung. Keine spontane Hin-und-zurück-Fahrt; alternativ ein weiterer ruhiger Tag an der Bucht."),
    ride(20, "Kotor – Perast – Dubrovnik-Umfahrung – Ston", "Ston / Mali Ston", "ca. 150 km", "ca. 4 h plus Grenze", "M1 · D8 · Zufahrt Ston", "Kotor, Montenegro", "Ston, Croatia", ["42.487161,18.699758", "Karasovići Border Crossing"], "Nach vier vollen Nächten Montenegro rund um die Bucht auf der Hauptstrasse oberhalb von Perast, ohne Kamenari-Fähre. Über Karasovići und die D8 an Dubrovnik vorbei, ohne Altstadtzufahrt, bis Ston. Rund 4 Stunden reine Fahrt einplanen; mit Pausen und Grenzpuffer etwa 6–7 Stunden unterwegs, bei langer Grenzwartezeit mehr. Unterkunft bevorzugt in Luka oder Hodilje ausserhalb der historischen Ortskerne; die letzten Kilometer und die Zufahrt zum gewählten Haus vor Buchung prüfen. Am Fahrtag AMSCG und HAK für Strassen, Wind und Grenze kontrollieren.", "Rückfahrt zur Fähre"),
    ride(21, "Ston – Pelješac-Brücke – Split / Nachtfähre nach Ancona", "Ancona", "ca. 185 km plus Nachtfähre", "ca. 3 h plus Check-in und Überfahrt", "D8 · D425 · A1 · D1 · D8 · D410 · Fährlinie 53", "Ston, Croatia", "Ancona, Italy", ["42.930204,17.534612", "Split Ferry Port, Croatia"], "Über die Pelješac-Brücke ohne Neum-Transit und ab Karamatići bewusst auf der A1 bis Dugopolje, dann zum Hafen Split. Rund 3 Stunden reine Fahrt; mit Pausen und Stadtverkehr etwa 4–5 Stunden bis zum Hafen. Morgens losfahren, am frühen Nachmittag ankommen; keine zusätzliche Küstenrunde. Check-in spätestens 18:00 als Planwert, verbindlich gelten Ticket und Reederei. Geplant: Abfahrt 14.10. um 20:00, Ankunft 15.10. um 07:00. Die Kartenlinie folgt an Land den Strassen; die Seeverbindung ist schematisch, der Google-Maps-Link endet am Hafen Split. Jadrolinija nennt am 03.09. einen technischen Unterbruch bis 09.09.2026; Wiederaufnahme, Kabine und zwei Motorradplätze am 22.09. bestätigen. Nicht gebucht und noch nicht operativ gesichert.", "Fährtag"),
    ride(22, "Ancona – Fano – Furlo-Schlucht – Urbino", "Urbino", "ca. 115 km", "ca. 3 h", "SS16 · SS76 · A14 · SS73bis · SS3 · Via Flaminia (Furlo) · SP43 · SS745", "Ancona, Italy", "Urbino, Italy", ["43.646917,12.726267"], "Nach der Ausschiffung zunächst bewusst rund 40 km A14 bis zum Anschluss Fano, ohne Altstadtdurchfahrt. Danach zur alten Via Flaminia: die Kartenlinie durchquert die Furlo-Schlucht von der Calmazzo-Seite nach Furlo und führt über die SP43 Richtung Fermignano/Urbino. Kein Abstecher auf die Bergstrasse Furlo Monte. Rund 3 Stunden reine Fahrt; mit Pausen und Schluchtstopp etwa 4–5 Stunden, Ausschiffung zusätzlich. Die offizielle Öffnungsmeldung stammt von 2022 und bestätigt den Reisetag nicht: vor der Fahrt bei der Reservatsverwaltung prüfen. Nur bei freigegebener, trockener Strasse durchfahren. Bei Sperre oder schlechtem Wetter Furlo auslassen und ab Fano auf SS73bis über Fossombrone Richtung Urbino bleiben, keine Bergumfahrung suchen. Start und Ziel sind vorläufige Ortsanker; genaue Hafen- und Unterkunftszufahrt ausserhalb der ZTL noch separat prüfen.", "Italien / Genussfahrt"),
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
  days[20].roadApproach = true;
  days[20].routeStyle = "direct";
  days[19].points = "Perast (M1 oberhalb des Ortes) · Karasovići · Dubrovnik-Umfahrung";
  days[20].points = "Pelješac-Brücke · A1 · Hafen Split";
  days[0].points = "Arlbergtunnel (S16) · Inntal";
  days[9].points = "Primošten · Trogir · Dugi Rat · Omiš · Makarska-Riviera";
  days[12].points = "Drvenik · Küstenkorridor Ploče · Pelješac-Brücke · Ston";
  days[21].points = "Fano · alte Via Flaminia durch Furlo · Fermignano";

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
    publishedVersion: "2026-09-03T08:57:32.000Z",
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
        currentFirstChoice: "Adria Concept Boutique Apartments · Diklo",
        currentFirstChoiceUrl: booking("hr", "adria-concept-boutique-apartments", "2026-09-29", "2026-10-01"),
        currentAlternative: "Diklo – Modern 2 bedroom apartments",
        currentAlternativeUrl: booking("hr", "diklo-modern-2-bedroom-apartments", "2026-09-29", "2026-10-01"),
        parking: "Erste Wahl: Garage laut Anbieter; Alternative: Privatparkplatz laut Inserat. Zugewiesenen Platz für zwei Maschinen schriftlich bestätigen lassen.",
        ...apartmentReview(
          "Wohnung in Diklo ausserhalb der Altstadt. Küche und Waschmaschine laut Anbieter; Garage für B4 beschrieben, nicht automatisch für jede Einheit. Am 03.09. für 29.09.–01.10. angezeigt: Standard-Erdgeschosswohnung, CHF 252 insgesamt, kostenlos stornierbar vor 22.09., ein Parkplatz inklusive. Garagenzuordnung und Waschmaschine dieser Einheit bestätigen.",
          "Ganze Erdgeschosswohnung in Diklo mit Küche, Waschmaschine und privatem Parkplatz laut Inserat; keine Garage zugesichert. Am 03.09. für 29.09.–01.10. angezeigt: CHF 349 insgesamt, kostenlos stornierbar vor 15.09. Diese frühe Frist beachten; Platz für beide Motorräder bestätigen.",
          ["https://booking.adria-concept.com/rentals/apartment-zadar-adria-concept-boutique-apartments-b4-summer-glamou-414473.html"]
        )
      },
      {
        id: "sibenik",
        title: "Šibenik",
        startDate: "2026-10-01",
        endDate: "2026-10-03",
        booking: "open",
        currentFirstChoice: "My Adriatic Place · Podsolarsko",
        currentFirstChoiceUrl: booking("hr", "my-adriatic-place", "2026-10-01", "2026-10-03"),
        currentAlternative: "Comfy apartment in a quiet neighborhood · Ražine",
        currentAlternativeUrl: booking("hr", "comfy-apartment-in-a-queit-neighborhood", "2026-10-01", "2026-10-03"),
        parking: "Erste Wahl: Garage im Inserat genannt; Alternative: Privatparkplatz. Sichere Abstellung für zwei Maschinen noch schriftlich bestätigen lassen.",
        ...apartmentReview(
          "Erdgeschosswohnung mit Garten in Podsolarsko, ausserhalb des Zentrums. Küche und Waschmaschine laut Inserat; Garage für zwei Motorräder bestätigen. Am 03.09. für 01.–03.10. angezeigt: CHF 215 insgesamt als Mitgliederpreis, vollständig erstattbar durch Booking vor 27.09. Rabatt und Erstattungsbedingungen im eigenen Konto prüfen; kein gewöhnlicher kostenloser Stornotarif.",
          "Ganze Erdgeschosswohnung mit Garten in Ražine, Danilska 45. Küche, Waschmaschine und privater Parkplatz laut Inserat. Ruhige Wohnlage statt Altstadt; keine abschliessbare Garage belegt. Am 03.09. für 01.–03.10. angezeigt: CHF 170 insgesamt, kostenlos stornierbar vor 30.09.",
          ["https://www.airbnb.com/rooms/50787604"]
        )
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
        parking: "Die private Abstellfläche vor der Buchung schriftlich für zwei Maschinen bestätigen lassen; eine Bewertung nennt teilweise öffentliche Plätze neben dem Haus.",
        ...apartmentReview(
          "Villa Pehar: Küche und Waschmaschine im Inserat, ruhige Lage und Dachgeschoss. Private Stellplätze werden genannt; eine Bewertung beschreibt weitere Plätze im öffentlichen Bereich. Exakten privaten Platz sichern. Am 03.09. für 03.–06.10. und zwei Erwachsene angezeigt: CHF 192 insgesamt, kostenlos stornierbar vor 28.09.; Momentaufnahme, keine Buchung.",
          "Der Blick: Küche, eigene kostenlose Waschmaschine und ein Stellplatz auf dem Grundstück. Passt auch für eine Waschpause. Platz für zwei Motorräder und Steigung der Zufahrt klären. Am 03.09. für 03.–06.10. angezeigt: CHF 242 insgesamt, kostenlos stornierbar vor 02.10.; vollständige Frist mit Uhrzeit vor Buchung prüfen."
        )
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
        parking: "Den vorhandenen Innenstellplatz vor der Buchung schriftlich für zwei Maschinen bestätigen lassen",
        ...apartmentReview(
          "OSCAR Suite: Küche, eigene kostenlose Waschmaschine und ein Garagenstellplatz ausdrücklich im Inserat. Ruhige Wohnlage ausserhalb der Altstadt. Am 03.09. für 06.–09.10. und zwei Erwachsene angezeigt: CHF 352 insgesamt, kostenlos stornierbar vor 01.10. Beide Motorräder müssen auf den zugesagten Platz passen.",
          "Miss Mia: Küche, Waschmaschine und privater Stellplatz am Haus, keine Garage belegt. Ausserhalb der Altstadt; laut Beschreibung 15–20 Minuten zu Fuss dorthin. Rangierfläche prüfen. Am 03.09. für 06.–09.10. angezeigt: CHF 393 insgesamt, kostenlos stornierbar vor 01.10.; keine Preis- oder Verfügbarkeitsgarantie."
        )
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
        parking: "Wunschwohnung: nur Strassenparkplätze im Inserat. Sichere Abstellmöglichkeit für zwei Maschinen vor der Buchung schriftlich bestätigen.",
        ...apartmentReview(
          "Euer Favorit bleibt erste Wahl: ganze Wohnung in Sveti Stasije/Dobrota, Küche und eigene kostenlose Waschmaschine. Wichtig: nur kostenlose Strassenparkplätze, kein gesicherter Privatplatz belegt; kein Rauchmelder aufgeführt. Am 03.09. für 09.–13.10. und zwei Erwachsene angezeigt: CHF 359 insgesamt, kostenlos stornierbar vor 04.10. Erst nach Klärung der Abstellung buchen.",
          "Bright & Elegant: ganzes Studio mit Küche, eigener Waschmaschine und Trockenständer. Laut Gastgeber ruhige Wohnlage und beleuchteter Stellbereich am Haus, keine abschliessbare Garage belegt. Am 03.09. für 09.–13.10. angezeigt: erstattungsfähiger Tarif CHF 232.70 insgesamt, kostenlos stornierbar vor 04.10. Diesen Tarif wählen, nicht den voreingestellten nicht erstattbaren Tarif für CHF 214.90."
        )
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
        currentFirstChoice: "Casale di Nicolò · Appartamento Country",
        currentFirstChoiceUrl: "https://www.airbnb.ch/rooms/49005441?adults=2&check_in=2026-10-15&check_out=2026-10-17&locale=de",
        currentAlternative: "Cà Maggetti · Ferienwohnung im Grünen",
        currentAlternativeUrl: booking("it", "ca-39-maggetti", "2026-10-15", "2026-10-17"),
        parking: "Cà Maggetti nennt einen umzäunten Parkplatz. Bei Nicolò ist die sichere Abstellung ungeklärt. Platz für zwei Maschinen und asphaltierte Zufahrt schriftlich bestätigen lassen.",
        ...apartmentReview(
          "Country-Apartment für zwei Personen im Grünen: Erdgeschoss, Küche, eigene Waschmaschine und Garten. Am 03.09. bei Airbnb für 15.–17.10. angezeigt: CHF 166 insgesamt, kostenlos stornierbar vor 14.10. Deshalb erste Wahl. Parkplatz am Haus aufgeführt, sichere Abstellung noch bestätigen. Direktbuchung hat andere Bedingungen: Anzahlung nur auf späteren Aufenthalt anrechenbar.",
          "Landgut ausserhalb Urbinos. Küche, Waschmaschine und umzäunter Parkplatz laut Anbieter. Am 03.09. für 15.–17.10. grosse 100-m²-Wohnung angezeigt: CHF 426 als Mitgliederpreis insgesamt, kostenlos stornierbar nur vor 15.09. Deutlich teurer und frühe Frist; vor Fährbestätigung keine nicht erstattbare Bindung eingehen. Kleinere Einheit separat anfragen.",
          ["https://camaggetti.vacation-bookings.com/", "https://www.casaledinicolo.it/sistemazioni/appartamento-country/"]
        )
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
        currentFirstChoice: "Agriturismo Giulio Fufo · Ferienwohnung",
        currentFirstChoiceUrl: booking("it", "agriturismo-giulio-fufo", "2026-10-18", "2026-10-20"),
        currentAlternative: "Holiday House Petrarca · Ferienhaus im Olivenhain",
        currentAlternativeUrl: booking("it", "holiday-house-petrarca-arqua-petrarca", "2026-10-18", "2026-10-20"),
        parking: "Beide nennen Privatparkplätze. Bei Petrarca steile Zufahrt laut Bewertung. Sichere Fläche für zwei Maschinen und asphaltierte Zufahrt schriftlich bestätigen lassen.",
        ...apartmentReview(
          "Ganze 45-m²-Wohnung mit Küche, Waschmaschine, Terrasse und Privatparkplatz laut Inserat. Via Scalette 2, laut Gastgeber etwa 500 m ausserhalb des historischen Zentrums. Am 03.09. für 18.–20.10. angezeigt: CHF 264 insgesamt, kostenlos stornierbar vor 17.10. Einfache Unterkunft; genaue Zufahrt und sichere Motorradabstellung bestätigen.",
          "Eigenes Ferienhaus im Olivenhain mit Küche, Waschmaschine und Privatparkplatz. Am 03.09. bei Booking für 18.–20.10. und zwei Erwachsene angezeigt: grosses 200-m²-Haus, CHF 539 insgesamt, kostenlos stornierbar vor 16.10. Steile Anfahrt laut Bewertung: nur wählen, wenn asphaltierte Zufahrt und Rangieren auch bei Nässe passen. Nicht mit dem allgemeinen Villa-Couple-Ab-Preis verwechseln.",
          ["https://www.hhpetrarca.com/"]
        )
      },
      {
        id: "iseo",
        title: "Lago d’Iseo",
        startDate: "2026-10-20",
        endDate: "2026-10-22",
        booking: "open",
        currentFirstChoice: "Ca’ Nildes · Ferienwohnung in Clusane",
        currentFirstChoiceUrl: "https://www.airbnb.ch/rooms/942578923582417304?adults=2&check_in=2026-10-20&check_out=2026-10-22&locale=de",
        currentAlternative: "Casa Monalba · Ferienwohnung in Predore",
        currentAlternativeUrl: "https://www.airbnb.ch/rooms/951224785764956985?adults=2&check_in=2026-10-20&check_out=2026-10-22&locale=de",
        parking: "Ca’ Nildes: Innenhof mit Tor und schmalem Stellplatz; Casa Monalba: private Garage laut Inserat. Eignung für zwei Maschinen schriftlich bestätigen lassen.",
        ...apartmentReview(
          "Erdgeschosswohnung in Clusane, nicht im Zentrum von Iseo: Küche, eigene Waschmaschine und Innenhofstellplatz hinter automatischem Tor. Laut Gastgeber nur 1,90 m Fahrzeugbreite vorgesehen; Platz und Rangieren für beide Motorräder bestätigen. Am 03.09. bei Airbnb für 20.–22.10. angezeigt: CHF 242 insgesamt, kostenlos stornierbar vor 15.10.; bei Booking für diese Daten nicht verfügbar.",
          "Ganze Wohnung mit Seeblick, Küche, Waschmaschine, Garten und privater Garage laut Inserat. Ruhige Lage in Predore am Westufer. Am 03.09. bei Airbnb für 20.–22.10. angezeigt: CHF 282 insgesamt, kostenlos stornierbar vor 15.10. Bei Wahl dieser Alternative An- und Abfahrt auf Predore anpassen und prüfen; die vorhandene Tagesroute bleibt bis dahin bei Iseo.",
          ["https://visitlakeiseo.info/en/hotels/ca-nildes/", "https://visitlakeiseo.info/ospitalita/casa-monalba/"]
        )
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
      dataVersion: "2026-09-03.5",
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
        accommodationStyle: "Ab zwei Nächten bevorzugt ganze Ferienwohnung oder Ferienhaus mit eigener Küche und möglichst eigener Waschmaschine; ruhige Lage ausserhalb historischer Zentren, sichere Abstellung für zwei Motorräder. Airbnb oder Booking nach konkreten Tarifbedingungen wählen.",
        apartmentFromNights: 2,
        preferPrivateKitchen: true,
        preferWashingMachine: true,
        avoidHistoricCenters: true,
        flexibleCancellationPreferred: true,
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
