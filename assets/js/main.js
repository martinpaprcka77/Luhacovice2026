// Luhačovice 2026 — pár drobností navíc.
// Stránka je plně čitelná i bez tohoto souboru: bez JS se jen v navigaci
// nepodtrhne aktuální sekce. Mapu i veškerý text řeší samo HTML.
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
})();
