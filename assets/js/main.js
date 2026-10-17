// Luhačovice 2026 — pár drobností navíc.
// Stránka je plně čitelná i bez tohoto souboru: bez JS se jen v navigaci
// nepodtrhne aktuální sekce a místo odpočtu zůstane v kartě věta
// s datem a časem startu. Mapu i text řeší samo HTML.

// ── Výška horní lišty ─────────────────────────────────────────────────
// Lišta je sticky a sekce mají `scroll-margin-top: var(--topbar-h)`, aby
// nadpis po kliknutí v navigaci neskončil pod lištou. V CSS je záloha 61px,
// jenže lišta je vyšší, když se připočte safe-area (na plochu na mobilu)
// nebo když má uživatel větší systémové písmo. Změříme ji tedy doopravdy
// a proměnnou přepíšeme. Samotnou výšku lišty tím neměníme, takže se měření
// nezacyklí. Bez JS (nebo než se soubor načte) platí záloha z CSS.

(function () {
    'use strict';

    var lista = document.querySelector('.topbar');

    if (!lista) {
        return;
    }

    function zmerit() {
        var vyska = lista.offsetHeight + 'px';
        var koren = document.documentElement;

        if (koren.style.getPropertyValue('--topbar-h') !== vyska) {
            koren.style.setProperty('--topbar-h', vyska);
        }
    }

    zmerit();

    // Při otočení telefonu nebo v režimu na plochu se mění safe-area, takže
    // se výška změří znovu.
    window.addEventListener('resize', zmerit);
    window.addEventListener('orientationchange', zmerit);
})();

// ── Navigace: podtržení aktivní sekce ─────────────────────────────────

(function () {
    'use strict';

    var navLinks = Array.prototype.slice.call(
        document.querySelectorAll('.nav a[href^="#"]')
    );

    if (!navLinks.length || !('IntersectionObserver' in window)) {
        return;
    }

    var linkById = {};
    navLinks.forEach(function (link) {
        var id = link.getAttribute('href').slice(1);
        if (document.getElementById(id)) {
            linkById[id] = link;
        }
    });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
                return;
            }
            var active = linkById[entry.target.id];
            if (!active) {
                return;
            }
            navLinks.forEach(function (link) {
                link.classList.remove('is-active');
            });
            active.classList.add('is-active');
        });
    }, { rootMargin: '-15% 0px -75% 0px' });

    Object.keys(linkById).forEach(function (id) {
        observer.observe(document.getElementById(id));
    });

    // ── Odpočty do startu ───────────────────────────────────────────────
    // Cíle jsou v HTML v atributu data-countdown, takže se datum mění na
    // jednom místě. Bez JS zůstane uvnitř prvku statická věta o startu.

    function ceskyPocet(n, jeden, par, hodne) {
        if (n === 1) {
            return jeden;
        }
        return (n >= 2 && n <= 4) ? par : hodne;
    }

    function bunka(hodnota, jednotka) {
        return '<span class="cd-cell">' +
               '<span class="cd-value">' + hodnota + '</span>' +
               '<span class="cd-unit">' + jednotka + '</span>' +
               '</span>';
    }

    Array.prototype.forEach.call(
        document.querySelectorAll('.countdown-clock[data-countdown]'),
        function (clock) {
            var cil = new Date(clock.getAttribute('data-countdown')).getTime();
            if (isNaN(cil)) {
                return;
            }

            var tik = function () {
                var zbyva = cil - Date.now();

                if (zbyva <= 0) {
                    window.clearInterval(bezi);
                    clock.innerHTML = '<span class="countdown-done">Jedeme!</span>';
                    return;
                }

                var s = Math.floor(zbyva / 1000);
                var dny = Math.floor(s / 86400);
                s -= dny * 86400;
                var hod = Math.floor(s / 3600);
                s -= hod * 3600;
                var min = Math.floor(s / 60);
                var sek = s - min * 60;

                clock.innerHTML =
                    bunka(dny, ceskyPocet(dny, 'den', 'dny', 'dní')) +
                    bunka(hod, ceskyPocet(hod, 'hodina', 'hodiny', 'hodin')) +
                    bunka(min, ceskyPocet(min, 'minuta', 'minuty', 'minut')) +
                    bunka(sek, ceskyPocet(sek, 'sekunda', 'sekundy', 'sekund'));
            };

            var bezi = window.setInterval(tik, 1000);
            tik();
        }
    );

    // ── Aktuality: rolující banner a čas posledního updatu ──────────────
    // Text je v HTML jen jednou, druhá kopie se přidá tady, aby na sebe
    // smyčka navazovala. Bez JS zůstane banner statický a čitelný.

    var ticker = document.querySelector('.ticker');

    if (ticker) {
        var track = ticker.querySelector('.ticker-track');
        var text = ticker.querySelector('.ticker-text');

        if (track && text) {
            var copy = text.cloneNode(true);
            copy.setAttribute('aria-hidden', 'true');
            track.appendChild(copy);
            ticker.classList.add('is-running');
        }

        if (window.fetch) {
            window.fetch('./assets/data/update.json', { cache: 'no-store' })
                .then(function (response) {
                    return response.ok ? response.json() : null;
                })
                .then(function (info) {
                    if (!info) {
                        return;
                    }

                    [['created', info.created], ['updated', info.updated]].forEach(function (pair) {
                        if (!pair[1]) {
                            return;
                        }

                        var when = new Date(pair[1]);
                        if (isNaN(when.getTime())) {
                            return;
                        }

                        var stamp = when.toLocaleDateString('cs-CZ') + ' ' +
                            when.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });

                        Array.prototype.forEach.call(
                            ticker.querySelectorAll('[data-' + pair[0] + ']'),
                            function (el) {
                                el.textContent = stamp;
                            }
                        );
                    });
                })
                .catch(function () {
                    // Ponecháme statický text z HTML.
                });
        }
    }
})();

// ── Mapa ───────────────────────────────────────────────────────────────
// Jedna mapa nad Luhačovicemi: kolonáda, prameny, pošta, nádraží a penzion Karina.
// Kreslí ji Leaflet z CDN; když se nenačte, zůstanou odkazy pod mapou.
// Souřadnice jsou z OpenStreetMap, takže se dají kdykoli dohledat.

(function () {
    'use strict';

    var mapa = document.getElementById('mapa');

    if (!mapa || typeof window.L === 'undefined') {
        return;
    }

    var mista = [
        { nazev: 'Kolonáda a prameny', popis: 'Vincentka a spol. — pije se přímo na místě.', lat: 49.10680, lon: 17.76259, kruh: true },
        { nazev: 'Pramen Ottovka', popis: 'Sraz v sobotu 24. 10.', lat: 49.10578, lon: 17.75865, ikona: 'spring' },
        { nazev: 'Pošta', popis: 'Doktora Veselého 468 — zastávka busu.', lat: 49.10169, lon: 17.75963, ikona: 'bus' },
        { nazev: 'Nádraží', popis: 'Železniční stanice Luhačovice.', lat: 49.09885, lon: 17.75200, ikona: 'train' },
        { nazev: 'Penzion Karina', popis: 'Masarykova 174.', lat: 49.09945, lon: 17.75734, ikona: 'house' }
    ];

    // Vlastní ikony: dům pro penzion, bus pro zastávku, vlak pro nádraží
    // a kapka pro pramen. Kreslené jako inline SVG, bez dalších souborů.
    var ikony = {
        house: '<path d="M12 3 2 12h3v9h6v-6h2v6h6v-9h3z"/>',
        bus: '<path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-1v2h-2v-2H7v2H5v-2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 3v6h16V6H4zm2 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>',
        train: '<path d="M12 2c4 0 8 1 8 4v9a3 3 0 0 1-3 3h-1l2 2v1h-2l-3-3H10l-3 3H5v-1l2-2H7a3 3 0 0 1-3-3V6c0-3 4-4 8-4zm-5 4v5h10V6H7zm1 8a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm8 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
        spring: '<path d="M12 2s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>'
    };

    function vytvorIkonu(typ) {
        return window.L.divIcon({
            className: 'map-pin map-pin-' + typ,
            html: '<svg class="map-pin-svg" viewBox="0 0 32 44" aria-hidden="true">' +
                  '<path class="map-pin-body" d="M16 1C7.7 1 1 7.7 1 16c0 11 15 27 15 27s15-16 15-27C31 7.7 24.3 1 16 1z"/>' +
                  '<g class="map-pin-symbol" transform="translate(8 8) scale(0.66)">' + ikony[typ] + '</g>' +
                  '</svg>',
            iconSize: [32, 44],
            iconAnchor: [16, 43],
            popupAnchor: [0, -40]
        });
    }
    var trasy = [
        { nazev: 'Kolonáda a prameny', vzdalenost: '1,0 km', cas: '14 min', body: [[49.09950, 17.75728], [49.09982, 17.75783], [49.10016, 17.75840], [49.10047, 17.75895], [49.10064, 17.75932], [49.10065, 17.75934], [49.10091, 17.76002], [49.10100, 17.76029], [49.10102, 17.76026], [49.10104, 17.76023], [49.10105, 17.76021], [49.10107, 17.76018], [49.10108, 17.76016], [49.10110, 17.76013], [49.10113, 17.76009], [49.10125, 17.76016], [49.10137, 17.76022], [49.10140, 17.76020], [49.10153, 17.76014], [49.10167, 17.76007], [49.10174, 17.76004], [49.10178, 17.76001], [49.10178, 17.76003], [49.10193, 17.75997], [49.10208, 17.75989], [49.10209, 17.75989], [49.10215, 17.75986], [49.10217, 17.75986], [49.10228, 17.75981], [49.10252, 17.75980], [49.10273, 17.75979], [49.10279, 17.75979], [49.10297, 17.75981], [49.10323, 17.75982], [49.10354, 17.75985], [49.10366, 17.75986], [49.10382, 17.75986], [49.10387, 17.75986], [49.10390, 17.75986], [49.10389, 17.75994], [49.10403, 17.76003], [49.10431, 17.76011], [49.10460, 17.76026], [49.10493, 17.76044], [49.10495, 17.76046], [49.10520, 17.76057], [49.10537, 17.76071], [49.10539, 17.76073], [49.10551, 17.76085], [49.10564, 17.76099], [49.10571, 17.76108], [49.10618, 17.76169], [49.10621, 17.76174], [49.10629, 17.76174], [49.10655, 17.76137], [49.10657, 17.76133], [49.10672, 17.76156], [49.10680, 17.76168], [49.10710, 17.76210]] },
        { nazev: 'Pramen Ottovka', vzdalenost: '0,9 km', cas: '12 min', body: [[49.09950, 17.75728], [49.09982, 17.75783], [49.10016, 17.75840], [49.10047, 17.75895], [49.10064, 17.75932], [49.10065, 17.75934], [49.10091, 17.76002], [49.10100, 17.76029], [49.10102, 17.76026], [49.10104, 17.76023], [49.10105, 17.76021], [49.10107, 17.76018], [49.10108, 17.76016], [49.10110, 17.76013], [49.10113, 17.76009], [49.10125, 17.76016], [49.10137, 17.76022], [49.10140, 17.76020], [49.10153, 17.76014], [49.10167, 17.76007], [49.10174, 17.76004], [49.10178, 17.76001], [49.10178, 17.76003], [49.10193, 17.75997], [49.10208, 17.75989], [49.10209, 17.75989], [49.10215, 17.75986], [49.10217, 17.75986], [49.10228, 17.75981], [49.10252, 17.75980], [49.10273, 17.75979], [49.10279, 17.75979], [49.10297, 17.75981], [49.10323, 17.75982], [49.10354, 17.75985], [49.10366, 17.75986], [49.10382, 17.75986], [49.10387, 17.75986], [49.10390, 17.75986], [49.10414, 17.75985], [49.10419, 17.75985], [49.10421, 17.75985], [49.10431, 17.75982], [49.10453, 17.75975], [49.10457, 17.75975], [49.10476, 17.75971], [49.10496, 17.75965], [49.10513, 17.75960], [49.10542, 17.75952], [49.10545, 17.75945], [49.10555, 17.75931], [49.10557, 17.75928], [49.10556, 17.75916], [49.10567, 17.75898], [49.10566, 17.75887], [49.10568, 17.75879], [49.10567, 17.75876], [49.10570, 17.75871], [49.10576, 17.75858], [49.10580, 17.75861]] },
        { nazev: 'Pošta', vzdalenost: '0,4 km', cas: '5 min', body: [[49.09950, 17.75728], [49.09982, 17.75783], [49.10016, 17.75840], [49.10047, 17.75895], [49.10064, 17.75932], [49.10065, 17.75934], [49.10091, 17.76002], [49.10100, 17.76029], [49.10102, 17.76026], [49.10104, 17.76023], [49.10105, 17.76021], [49.10107, 17.76018], [49.10108, 17.76016], [49.10110, 17.76013], [49.10113, 17.76009], [49.10125, 17.76016], [49.10137, 17.76022], [49.10140, 17.76020], [49.10141, 17.76016], [49.10142, 17.76013], [49.10148, 17.76000], [49.10152, 17.75993], [49.10149, 17.75991], [49.10148, 17.75990], [49.10150, 17.75980], [49.10151, 17.75976], [49.10169, 17.75976]] },
        { nazev: 'Nádraží', vzdalenost: '0,5 km', cas: '7 min', body: [[49.09950, 17.75728], [49.09934, 17.75701], [49.09938, 17.75696], [49.09942, 17.75689], [49.09936, 17.75680], [49.09913, 17.75616], [49.09913, 17.75613], [49.09912, 17.75601], [49.09905, 17.75579], [49.09901, 17.75567], [49.09900, 17.75564], [49.09892, 17.75534], [49.09890, 17.75529], [49.09879, 17.75502], [49.09837, 17.75416], [49.09836, 17.75410], [49.09833, 17.75399], [49.09835, 17.75394], [49.09832, 17.75387], [49.09829, 17.75380], [49.09831, 17.75377], [49.09842, 17.75358], [49.09870, 17.75310], [49.09875, 17.75302], [49.09870, 17.75272], [49.09875, 17.75269], [49.09877, 17.75268], [49.09880, 17.75267], [49.09883, 17.75265], [49.09882, 17.75264], [49.09866, 17.75190], [49.09866, 17.75188], [49.09876, 17.75183], [49.09878, 17.75182], [49.09874, 17.75164], [49.09876, 17.75163], [49.09877, 17.75162], [49.09885, 17.75200]] },
    ];

    var map = window.L.map(mapa, {
        // Kolečko myši ať roluje stránkou, ne mapou.
        scrollWheelZoom: false
    });

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Pěší trasy z penzionu: bílý podklad pro kontrast a přes něj čárkovaná
    // čára s vzdáleností a časem v bublině.
    trasy.forEach(function (trasa) {
        window.L.polyline(trasa.body, {
            color: '#fffdf7',
            weight: 7,
            opacity: 0.9,
            lineCap: 'round',
            interactive: false
        }).addTo(map);

        window.L.polyline(trasa.body, {
            color: '#a8823f',
            weight: 3,
            opacity: 0.95,
            dashArray: '7 8',
            lineCap: 'round'
        }).addTo(map).bindPopup(
            '<strong>Penzion Karina → ' + trasa.nazev + '</strong><br>' +
            trasa.vzdalenost + ' · ' + trasa.cas
        );
    });

    var body = [];

    mista.forEach(function (misto) {
        var souradnice = [misto.lat, misto.lon];
        var znacka;

        if (misto.kruh) {
            // Kolonáda je bod v krajině, ne ubytování — proto kolečko s popiskem.
            znacka = window.L.circleMarker(souradnice, {
                radius: 9,
                color: '#27503f',
                weight: 3,
                fillColor: '#d8bb80',
                fillOpacity: 1
            }).addTo(map);

            znacka.bindTooltip('Kolonáda', {
                permanent: true,
                direction: 'right',
                offset: [10, 0]
            });
        } else {
            znacka = window.L.marker(souradnice, {
                alt: misto.nazev,
                title: misto.nazev,
                icon: misto.ikona ? vytvorIkonu(misto.ikona) : new window.L.Icon.Default()
            }).addTo(map);
        }

        znacka.bindPopup('<strong>' + misto.nazev + '</strong><br>' + misto.popis);
        body.push(souradnice);
    });

    // Vycentrováno na Luhačovice: všechny body leží ve městě.
    map.fitBounds(body, { padding: [28, 28] });
})();
