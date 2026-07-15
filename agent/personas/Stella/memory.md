# Stella — Memory

Per-persona memory for the **Stella** persona. Purchase-research
working notes: process, reference, people, research log, known
issues. Keep high-signal — link out, don't duplicate.

---

## Process

Research loop (one-line): clarify request → web_search (2–4
queries) + fetch_content → comparison table → recommendation →
moms note → confirmation prompt → log here. Full version:
`persona.md` § "How You Work".

## Reference

### Property-search quirks

- **Hemnet filter parameter NAMES — CRITICAL.** The `/bostader`
  endpoint uses `land_area_min` and `living_area_min` (NOT
  `min_plot_area`/`min_living_area`). Wrong names silently don't
  apply the filter → you get an unfiltered list and wrongly conclude
  "0 träffar". Lesson learned 2026-07-06 after Joachim flagged a
  7-property search I missed. ALWAYS use the correct names:
  `land_area_min`, `land_area_max`, `living_area_min`,
  `living_area_max`, `price_max`, `price_min`, `item_types[]`,
  `location_ids[]`.
- **Hemnet location_ids (län):** 17748=Jönköping, 17752=Blekinge,
  17753=Skåne, 17754=Halland, 17755=Västra Götaland,
  17744=Göteborgs kommun, 17749=Malmö kommun. (Östergötland,
  Kalmar, Kronoberg inte ännu bekräftade — slå upp vid behov.)
  Multiple län i samma sökning går bra: `location_ids[]=…&location_ids[]=…`.
- **Named-path URLs (`/till-salu/villa/hallands-lan?price_max=…`)
  do NOT reliably apply extra query filters** — use the `/bostader?`
  endpoint with `location_ids[]` + correct param names instead.
- **Hemnet direkt-fetch > snippets.** Full listing cards via
  `/bostader?...` with correct params.
- **Blocket Bostad param-API is JS-rendered** — fetch_content gets
  only a stub (~1.5 k chars), no listing cards. Use web_search +
  snippet discovery for Blocket, or skip.
- **Hemnet image CDN auth** (CRITICAL 2026-07-06):
  `https://bilder.hemnet.se/images/<tokenprefix>/<XX>/<YY>/<hash>.jpg?…`
  returns 401 via curl whatever UA+Referer (Cloudflare gated). Use
  the auth-free variant:
  `https://bilder.hemnet.se/images/itemgallery_L/<XX>/<YY>/<hash>.jpg`
  → 200, 690×518 px JPEG (~90 KB). Working variants: `itemgallery_cut`
  (~83 KB), `itemgallery_m` (~25 KB). `itemgallery`, `itemgallery_xl`,
  `itemgallery_card` → 400. URL construction: `<first2-of-hash>/<next2-of-hash>/<full-hash>.jpg`.
- **Hemnet listing image-hashes** extractable from each listing's HTML
  (image URLs on `bilder.hemnet.se/images/<tokenprefix>/…`). For some
  listings (e.g. Rungstung 4 Tanum) the image carousel does NOT render
  via fetch_content fallback → only the listing-card thumbnail is obtained.

### Hus-bevakning (södra Sverige) — veckovis uppdatering

Joachim bevakar marknaden ~1 gånger/vecka i 1–2 månader.
Struktur i `<cwd>/hus_overvakning/`:

```
hus_overvakning/
  README.md — kriterier + canonical Hemnet-URL + konventioner +
             bild-hämtningsproceduren (itemgallery_L).
  status.md — running-tabell (per-veckokolumner); borttagna
             objektsrader markeras BORTTAGEN YYYY-MM-DD, ej raderade.
  snapshots/<YYYY-MM-DD>/index.md — lista över aktiva listing IDs.
  snapshots/<YYYY-MM-DD>/objects/<listing_id>-<slug>/
    metadata.md
    img-NN.jpg
  _schema/object-metadata.template.md
```

Baseline 2026-07-06: 10 objekt (7 i filter + 3 bonus), ~5.4 MB
bilder. 9 av 10 objekt har 10–12 bilder; Tanum (border) har 1
(fetch_content-rendering misslyckades).

Vecko-uppdatering: fetch canonical Hemnet-sök-URL, jämför listing
IDs med senaste snapshot, sätt `BORTTAGEN YYYY-MM-DD` i status.md
för försvunna, skapa ny snapshot-mapp + metadata.md + ladda ner
bilder för nya. Rapportera diffen till Joachim i chat.

Canonical URL (med korrekta param-namn):

```
https://www.hemnet.se/bostader?land_area_min=1000&price_max=500000&living_area_min=100&item_types[]=villa&item_types[]=fritidshus&item_types[]=gard&location_ids[]=17748&location_ids[]=17754&location_ids[]=17755&location_ids[]=17753&location_ids[]=17752
```
- **Sub-500k villa ≥100 m² ≥1000 m² tomt i södra Sverige FINNS** —
  7 objekt i Jönköping/Halland/VGR/Skåne/Blekinge 2026-07-06, bl.a.
  Eringsboda (Blekinge) 122+122 m² 1064 m² tomt 495k, Sibbhult &
  Glimåkra (Skåne) 110/100 m², Häljalt Perstorp (Skåne) 105 m²
  renoveringsprojekt, Rydöbruk (Halland) 105 m². Tidigare slutsats
  "near-empty" var fel — orsakad av fel param-namn.
- Latitud-gräns "i höjd med Uddevalla" ≈ 58,3°N. Uddevalla ligger
  i Västra Götaland. Tanum (58,9°N) och Gullspång (59,3°N) ligger
  strax norr om gränsen — borderobjekt som Joachim får avgöra.

### Tools

| Tool | Use |
|---|---|
| `web_search` | Price, supplier, spec, review discovery. Prefer 2–4 varied queries. |
| `fetch_content` | Full spec pages, review articles, supplier terms. |
| `bash` | Local file ops if saving research notes. |

### Swedish moms rates (quick reference)

| Rate | Applies |
|---|---|
| 25% | Standard — electronics, new cars (dealer), equipment |
| 12% | Food, restaurants |
| 6% | Books, transport, cultural services |

Used cars: private seller = no moms; dealer = vinstmarginalmetoden
(moms hidden in margin, not deductible). See `persona.md` § Moms.

Intra-EU (Spain, Germany, etc.): reverse charge applies for
Sincera Holding AB — supplier invoices 0% citing Sincera's VAT
number, Sincera self-accounts Swedish moms (utgående + ingående,
net zero). Verify supplier VAT number via VIES; confirm Sincera's
VAT number is on the invoice before ordering. Avdragsgill if
wholly for taxable business use. Personal B2C = no reverse charge.
Booking is Joachim's / bookkeeper's, not Stella's.

Sincera VAT nr: **SE559080206101** (SE + org.nr 559080-2061 + `01`
suffix). VIES-validated 2026-07-06. ⚠️ Common pitfall: Swedish VAT
numbers ALWAYS end in `01` — querying SE + 10-digit org.nr without
the `01` suffix returns "invalid" on VIES even when the company is
properly intra-EU registered. Always use the full 12-digit form.

## People

- **Joachim** — owner & sole decision-maker. Places every order
  himself; routes any moms booking to his bookkeeper himself.

## Research Log

Append one line per research task (newest first):

```
- YYYY-MM-DD — <item> (buyer: <personal|Sincera>) → recommended <pick>. [link if saved]
```

- 2026-07-06 — Begagnad Tesla Model S/Y/3 + Öst-EU PL/BG/CZ/SK/HU/RO (FSD nice-to-have, buyer: personal, C2C välkommet) → rek. oförändrad: 🥇 2019 Model 3 LR AWD 274 800 kr Riddermark Strängnäs (~25k över budget, **FSD påstått i annons — ej oberoende verifierad; enda giltiga bevis = Tesla-konto via VIN**; 77k km — enda Model 3 på Blocket där säljaren explicit påstår FSD); 🥈 2020 Model 3 LR AWD 229 800 kr Heedex Örebro (1 ägare, AWD LR); 🥉 2020 Model 3 SR+ 204 800 kr Riddermark Norsborg. Model S in-budget: 2018 100D 235k kr privat Vemdalen (AP2.5/EAP), 2017 S75 189k kr privat Billdal (AP1, 1 ägare). Model Y helt över budget i alla 11 marknader (SE golv 279 900 kr, DE golv €31k). Öst-EU: teoretiska 2022–2023 LR AWD €18–29k MEN prisdumpar €11–18k är när säkert bait-scam (klassisk OLX/Otomoto/auto.bg Tesla-scam — tysk-titlade annonser, identiska priser); reella priser efter import ≈ Sverige. Lärdom: Blocket direkt-fetch > snippets; Bytbil-listor JS-renderade (inga kort). Lärdom 2: dealer-annonsens "FSD"/"Total Självkörningsförmåga" är inte verifiering — enda beviset är Tesla-konto via VIN. Öst-EU Tesla-plattformar = utbredd bait-scam — alltid VIN+fysisk verifying på plats före betalning. Rapport: ./tesla_used.md
- 2026-07-06 — SÄLJ-värdering: Mini Cooper S 2019 3-dör DCT 192hk, >12 000 mil, mycket bra skick, eftertraktad färg, rik utr (Prof nav, läder, trådlös laddning/CarPlay, stor skärm, ryggkamera, P-sensor) (seller: personal) → rek. privat utropspris 169 000–179 000 kr (realistiskt 155 000–165 000 kr); inbyte ~140 000–150 000 kr. Privat C2C = ingen moms. Konfidens medel (ingen exakt matchning; >12 000 mil största dämparen). Rapport: ./mini_cooper_s_valuation.md. ⚠️ UPPDATERING 2026-07-06: bilen är redan spansk-registrerad (såld ny i Spanien) → ingen import/matriculación; spansk privatförsäljning ~€17 000–19 000 (~192 000–215 000 kr) > svensk ~155 000–165 000 kr. Sälj i Spanien.
- 2026-07-06 — SÄLJ-värdering: Ford Kuga 2022 FHEV 2WD ST-Line, ~9 000 mil (90k km), helt servad, mycket bra skick (seller: personal, C2C Blocket) → rek. utropspris ~229 000–239 000 kr; realistiskt slutpris ~215 000–225 000 kr; inbytesbud ~175 000–200 000 kr. FHEV ovanligare än PHEV → ~10–20 k kr under PHEV-listningar; 2WD under AWD. Privat C2C = ingen moms. Källa: AutoUncle marknadsdata + Bytbil/Blocket-listningar (hämtade 2026-07-06). Konfidens medel (ingen exakt FHEV 2WD ST-Line @9 000 mil hittades).
- 2026-07-06 — ⚠️ METODOLOGIFEL upptäckt: använde fel Hemnet param-namn (`min_plot_area`/`min_living_area` istället för `land_area_min`/`living_area_min`) → filter applicerades ej i flera per-län-sökningar → fel slutsats att Skåne/Blekinge/Jönköping/Kronoberg hade 0 träffar. Joachim påpekade en URL med korrekta parametrar som gav 7 träffar ≤500k. Korrekt sökning ger faktiska träffar i Skåne (Sibbhult, Glimåkra, Häljalt Perstorp) och Blekinge (Eringsboda) — södra-sverige-poolen är reell, inte near-empty. Se "Property-search quirks" ovan för rätt param-namn.
- 2026-07-06 — Hus-bevakning infrastruktur satt på plats: `<cwd>/hus_overvakning/` med README, status.md (running-tabell, veckokolumner), snapshots/2026-07-06 med 10 objektsmappar + metadata.md + img-NN.jpg (auth-fri `itemgallery_L`-variant, ~5.4 MB totalt). `status.md` rutin: borttagna objekt markeras `BORTTAGEN YYYY-MM-DD`, ej raderade. Vecko-uppdatering enligt README. Upptäckt under arbetet: Hemnet bild-CDN ger 401 vid direkt curl — använd `itemgallery_L/<XX>/<YY>/<hash>.jpg` (auth-fritt, 690×518). Bildhashar från listing-HTML.
- 2026-07-06 — Hus/liten gård södra Sverige ≤500 000 kr v3 (villa/gård, ≥100 m² kingta, ≥1000 m² tomt; Östergötland + Kalmar uteslutna; sök-URL med korrekta Hemnet-parametrar `land_aerjoa_min`+`living_area_min` gav 7 träffar) → rek. 🥇 Norra Björklidsvägen 10 Eringsboda (Ronneby/Blekinge) 495k 122+122 m² 1 064 m² tomt 1963 renoveringsbehov visning sön 12 jul; 🥈 Skolgatan 5 Sibbhult (Östra Göinge/Skåne) 495k 110+50 m² 1 251 m² renoverad källare budgivning pågår; 🥉 Häljalt Åsbovägen 210 Perstorp (Skåne) 495k 105+74 m² 1 287 m² omfattande renoveringsbehov. Även: Nissadalsvägen 67 Rydöbruk (Halland) 495k (tidigare v2-🥇), Björstorp 11 Gullspång 395k/161 m² + Rungstung 4 Tanum 495k/165 m² (båda VGR norr om Uddevalla-gränsen), Häljalt 105 Perstorp 389k budgivning (lägsta pris). Rapport: ./hus_sodra.md
- 2026-07-06 — Hus/liten gård södra Sverige ≤750 000 kr (villa/gård, ≥100 m², ≥1000 m² tomt, sommarbruk ok; Östergötland + Kalmar län exkluderade; buyer: TBD) → rek. 🥇 Nissadalsvägen 67 Rydöbruk (Hylte kommun, Halland) 495k nedsatt från 595k, 105+72 m², 1 180 m² tomt, 5 rum äganderätt energiklass D, 1958, garage, AI-staged bilder; 🥈 Tallvägen 4 Landeryd (Hylte) 550k/129+10 m²/1 164 m²; 🥉 Dämhult 101 Kinnared (Hylte) 549k/100+56 m²/**vinterbonat fritidshus**/2 277 m² — stort renoveringsbehov, eternittak, ej godkänd stenkista-avlopp, ingen toalett. Sweet spot = inland Halland (Hylte kommun). Skåne/Blekinge/Jönköping/Kronoberg = 0 träffar med filter. Gårdar ≤750k i söder finns ej (minsta Perstorp 1 495k). Hemnet location_id Halland = **17754** (fungerar med `/bostader?...&location_ids[]=17754`); named `/till-salu/villa/skane-lan?price_max=...` drog INTE filtret för Skåne → använd location_ids-endpoint. Rapport: ./hus_sodra.md
- 2026-07-06 — Hus/liten gård södra Sverige ≤500 000 kr (villa, ≥100 m², ≥1000 m² tomt, sommarbruk ok, buyer: TBD) → rek. 🥇 Sandåkravägen 2 Rejmyre (Finspångs kommun) 495k, 114 m², 2 365 m² tomt, 1922, friskrivningsklausul — **enda objekt i södra Sverige som uppfyller alla 4 kriterier**; 🥈 Doverstorp Linköpingsvägen 180 (Finspång) 550k/99 m² (över budget + strax under boyta). Norra alternativ om latitud släpps: Grängesberg 395k/128 m² (Dalarna), Lingbo Ockelbo 500k/117 m². Blocket privatlistningar kunde ej hämtas direkt (JS-renderat). Rapport: ./hus_sodra.md
- 2026-07-06 — GMKtec EVO-X2 AMD Ryzen AI Max+ 395, 128GB/2TB (buyer: Sincera) → recommended PowerPlanet (Spain) €2,599 inkl. IVA, runner-up GMKtec EU store (DE). Report: <cwd>/gmtech.md. Intra-EU reverse charge; PowerPlanet B2B 0% IVA flow confirmed; supplier ESB73287740 VIES-validated 2026-07-06; Sincera VAT nr **SE559080206101** VIES-validated 2026-07-06 13:18:21 (name Sincera Holding AB, Järfälla). PowerPlanet walk-in store in Totana (Murcia) confirmed.

## Known Issues

- **None open.** (Earlier: Sincera VAT nr appeared invalid on VIES —
  resolved 2026-07-06: the queried string SE5590802061 was missing
  the `01` suffix; correct VAT nr SE559080206101 returns valid.)
