# wats2sats

Prosty kalkulator: ile satoshi da się (szacunkowo) wykopać przy zadanej mocy ciągłej (W).

Dodatkowo pokazuje listę popularnych koparek ASIC, których pobór mocy mieści się w podanym limicie.

## Jak to działa

- Podajesz dostępną moc (W) i efektywność koparki (J/TH, domyślnie 17.5 — typowy nowoczesny ASIC).
- Strona przelicza to na hashrate, pobiera aktualny hashrate sieci Bitcoin z [mempool.space](https://mempool.space/docs/api/rest#get-hashrate-and-difficulty), i liczy szacowany udział w bloku dziennie.
- Nagroda za blok: 3.125 BTC (aktualna do halvingu ~2028).
- To czysto statyczna strona (HTML/CSS/JS, brak backendu) — hostowana przez GitHub Pages.

## Zastrzeżenie

Kalkulacja jest szacunkowa. Nie uwzględnia: zmian trudności sieci w czasie, opłat puli, przestojów, temperatury/undervoltingu, kosztów energii. Specyfikacje koparek w `miners.js` to przybliżone dane producentów.

## Rozwój lokalny

Statyczne pliki — wystarczy otworzyć `index.html` w przeglądarce albo:

```
python3 -m http.server 8000
```
