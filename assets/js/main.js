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
// Jedna mapa nad Luhačovicemi: kolonáda a penzion Karina.
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
        { nazev: 'Penzion Karina', popis: 'Masarykova 174.', lat: 49.09945, lon: 17.75734 }
    ];

    var map = window.L.map(mapa, {
        // Kolečko myši ať roluje stránkou, ne mapou.
        scrollWheelZoom: false
    });

    window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

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
                title: misto.nazev
            }).addTo(map);
        }

        znacka.bindPopup('<strong>' + misto.nazev + '</strong><br>' + misto.popis);
        body.push(souradnice);
    });

    // Vycentrováno na Luhačovice: kolonáda i penzion Karina leží ve městě.
    map.fitBounds(body, { padding: [28, 28] });
})();
