// Luhačovice 2026 — pár drobností navíc.
// Stránka je plně čitelná i bez tohoto souboru: bez JS se jen v navigaci
// nepodtrhne aktuální sekce a místo odpočtu zůstane v kartě věta
// s datem a časem startu. Mapu i text řeší samo HTML.
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
