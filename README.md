# Luhačovice 2026

Jednostránkový web k výletu do Luhačovic — instrukce, program, ubytování na mapě,
persony a kontakty. Žádný build, žádné závislosti: tři statické soubory a hotovo.

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
(`Hero`, `Instrukce`, `Program`, `Ubytování a mapa`, `Persony`, `Kontakty`).

- **Přidat osobu** — zkopíruj jeden `<li class="person">` v sekci `Persony`
  a přepiš jméno a přezdívku. Ubírání funguje stejně.
- **Přidat řádek programu** — zkopíruj jeden `<li>` v `<ol class="timeline">`
  a přepiš `<span class="time">` a `<span class="what">`.
- **Přidat ubytování** — zkopíruj jednu `<div class="card">` v `<div class="stays">`.
- **Změnit mapu** — v sekci `Ubytování a mapa` je jediný `<iframe>`. Uvnitř je
  Google Maps přes `output=embed`, což funguje bez API klíče. Mapy.cz se do rámce
  vložit nedá (blokuje to), proto je pod mapou jen odkaz na něj.

Odkazy na vlastní soubory drž relativně (`./assets/...`). Stránka běží
v podadresáři `/Luhacovice2026/`, takže absolutní cesta od rootu by se rozbila.

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
assets/js/main.js             jen podtržení aktivní sekce v navigaci
assets/img/favicon.svg        ikona
.github/workflows/pages.yml   nasazení na GitHub Pages
```
