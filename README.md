# Luhačovice 2026

Jednostránkový web k výletu do Luhačovic — instrukce, program, ubytování na mapě,
týmy a kontakty. Žádný build, žádné závislosti: tři statické soubory a hotovo.

Živě na <https://martinpaprcka77.github.io/Luhacovice2026/>.

## Co ještě doplnit

V `index.html` hledej `class="todo"`. Každý takový prvek je zástupný text,
který se má nahradit skutečností:

```bash
grep -n 'class="todo"' index.html
```

Až budeš hotový, mělo by jich zbýt nula. Placeholder se v CSS schválně kreslí
jako přerušovaný rámeček, aby na stránce nebyl přehlédnutelný.

## Jak upravit obsah

Všechno je v jediném souboru `index.html`, rozdělené komentářem na sekce
(`Hero` — termín a odpočty, `Instrukce`, `Program`, `Ubytování a mapa`, `Týmy`,
`Kontakty`).

- **Přidat tým** — zkopíruj jeden `<li class="team">` v sekci `Týmy` a přepiš
  `<span class="team-name">` a `<span class="team-note">`. Ubírání funguje stejně.
- **Změnit odpočet** — v `Hero` je u každé karty atribut `data-countdown`
  s cílovým datem ve tvaru `2026-10-23T12:00:00+02:00`. Přepiš ho a hotovo.
  Text uvnitř `<p class="countdown-clock">` je jen záloha pro čtenáře bez
  JavaScriptu — prohlížeč ho přepíše živým odpočtem.
- **Přidat řádek programu** — zkopíruj jeden `<li>` v `<ol class="timeline">`
  a přepiš `<span class="time">` a `<span class="what">`.
- **Přidat ubytování** — zkopíruj jednu `<div class="card">` v `<div class="stays">`.
- **Změnit mapu** — v sekci `Ubytování a mapa` je jediný `<iframe>`. Uvnitř je
  Google Maps přes `output=embed`, což funguje bez API klíče. Mapy.cz se do rámce
  vložit nedá (blokuje to), proto je pod mapou jen odkaz na něj.

Odkazy na vlastní soubory drž relativně (`./assets/...`). Stránka běží
v podadresáři `/Luhacovice2026/`, takže absolutní cesta od rootu by se rozbila.

## Aktuality nahoře

Úplně nahoře je rolující banner s datem vzniku, časem posledního updatu a
poznámkou, ať si lidé stránku obnovují sami.

- **Datum vzniku a čas posledního updatu** se počítají při nasazení z historie
  gitu a zapisují se do `assets/data/update.json`. V repozitáři je základní
  verze souboru, kterou CI při každém nasazení přepíše — díky tomu se nikdy
  nenačítá prázdno a i když nasazení selže, zůstane poslední známý čas.
- **Když soubor chybí nebo je vypnutý JavaScript**, zůstane v banneru statický
  text z HTML — banner se jen neroluje. Nic se neztratí.
- **Text banneru** je v `index.html` v sekci `Aktuality`, hned za odkazem
  „Přeskočit na instrukce“. Věty jako „Další update nejpozději…“ jsou ruční,
  přepiš je, kdykoli se změní.
- Rolování se vypne, když má uživatel v systému `prefers-reduced-motion`.
  Najetím myší nebo fokusem se banner pozastaví.

## Náhled lokálně

Otevři `index.html` přímo v prohlížeči, nebo si spusť server, aby cesty seděly
i s podadresářem:

```bash
python -m http.server 8080
```

## Nasazení

Push do větve `main` spustí `.github/workflows/pages.yml`, který stránku
nasadí na GitHub Pages. Zdroj Pages v nastavení repozitáře musí být
**GitHub Actions** (ne „Deploy from a branch“) — jinak by se nad stránkou
pustil Jekyll a je potřeba přidat `.nojekyll`.

## Indexování

`<head>` obsahuje `<meta name="robots" content="noindex, nofollow">`, takže
stránka se neobjeví v Googlu a je jen pro toho, komu pošleš odkaz.
Pokud ji chceš zviditelnit, ten řádek smaž.

## Struktura

```
index.html                    celý obsah stránky
assets/css/style.css          jediný stylesheet
assets/js/main.js             podtržení aktivní sekce a odpočty do startu
assets/img/favicon.svg        ikona
.github/workflows/pages.yml   nasazení na GitHub Pages
```
