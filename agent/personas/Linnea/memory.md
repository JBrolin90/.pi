# Linnea — Memory

## Current Scope (v1)

- **Job**: classify, extract authoritative date, propose filename prepend
- **Output**: markdown table + `mv` block, per batch
- **Linnea proposes. Joachim runs.** No automatic rename yet.

### Scope Boundaries — firm rules (do not violate)

1. **cwd only.** Operate only on files in `/home/sincera/Documents/Inbox/` (the cwd pi was started in). Do not recurse. Do not use `find`. Do not touch `Behandlade/`, `Bokslut/`, `Märkliga bg-dokument/`, `Personal Familia B/`, `Min myndighetspost_files/`, `copy/`, or any other subdirectory.
2. **Rename only.** Do not move files between directories. v1 only renames in place.
3. **Canonical format only.** `<YYYY-MM-DD>_<Klass>_-_<original-basename>`. No organisation number, amount, period, decision ID, handläggare, or issuer name in the filename — those go in the Notes column.

See `persona.md` § "v1 Scope" for the full taxonomy and date-extraction rules.

## Working Environment

- Inbox: `~/Documents/Inbox/` (resolves to `/home/sincera/Documents/Inbox/` on this host)
- One legal entity:
  - **Sincera Holding AB** — legal name, org.nr `559080-2061` (Skatteverket form) / `165590802061` (12-digit Svea Bank form)
- Brand name (NOT a separate legal entity):
  - **Sincera Hemservice** — the brand under which Sincera Holding AB issues outgoing fakturor and communicates with customers
- The earlier persona text referred to "HB Sincera Hemservice (Västanvägen 19A, 177 71 Järfälla)" as a sister entity. That was wrong on two counts: (1) "HB" implies a separate handelsbolag which it is not, (2) the address on file has changed and is not recorded here. Use brand vs legal name correctly going forward.
- Authorised signatories: Sugey Brolin (operator), Joachim Brolin
- Bank: Svea Bank, account `9660-9712974` (Transaktionskonto), tax account `9660-5021551` (Skattekonto)
- Bankgiro: `5971-9815`

## Canonical Filename Format

`<YYYY-MM-DD>_<Klass>_-_<original-basename>`

## Classification Tags (v1)

`Faktura` · `Kvittens` · `Beslut` · `Bankkvitto` · `Transaktioner` · `Momsrapport` · `Löner` · `Oklassificerad`

## Date Field → Classification Map

| Klass | Authoritative date |
|---|---|
| Faktura | Fakturadatum (NOT förfallodatum) |
| Kvittens | Inlämnad-timestamp |
| Beslut | Beslutsdatum |
| Bankkvitto | Transaktionsdatum / Signerad datum |
| Transaktioner | Period end (or latest transaction date) |
| Momsrapport | Last day of `Period YYYYMM` |
| Löner | Last day of `Year-Month` from first row |

## Per-Batch Run Notes

(Append one entry per batch run, oldest first. Replace in place when a batch is re-run.)

- **Smoke test (single file, BeslutForsenAvg_1781083570.pdf)** — Linnea correctly classified as `Beslut`, extracted `Beslutsdatum` 2026-06-08, proposed `2026-06-08_Beslut_-_BeslutForsenAvg_1781083570.pdf`. **Errors caught**: (a) `find` recursed into `./copy/` (out of scope), (b) Linnea volunteered an embellished descriptive name (`Skatteverket_Beslut_om_forseningsavgift_625kr_mars_2026`) instead of the canonical Klass+basename format, (c) Linnea offered to move the file to `Behandlade/` unprompted (v2+ work). Persona updated with explicit Scope Boundaries section; reopen /become-persona to pick up.
- **2026-06-25 (single-file rename, after "ja" from Joachim)** — Successfully renamed `BeslutForsenAvg_1781083570.pdf` → `2026-06-08_Beslut_-_BeslutForsenAvg_1781083570.pdf`. Pre-flight verified source exists + target doesn't + names differ; `mv`; post-flight `ls -la` confirmed intact (146 348 bytes, mtime Jun 10 11:26). Linnea fabricated a "system instruction" attribution for the pre-flight pattern that didn't actually exist in the persona — pattern has now been formalised in `persona.md` § "Rules when executing mv" so it won't need inventing again.
- **2026-06-26 (run 3, full v1 batch, after "ja" from Joachim)** — renamed 21 files. Klasser: 4× Faktura, 5× Kvittens, 2× Beslut, 1× Bankkvitto, 6× Transaktioner, 2× Momsrapport, 1× Löner. Skipped 2: (a) `2026-04-30-Projekt Kompetes I Linköping AB-Faktura( Corregir esta factura del behandlade)( el precio cambio a 387KR.pdf` — pre-flight upptäckte att Linnea hade lagt till en extra `)` i sitt eget filnamn (target 120 tecken, faktisk källfil 119 tecken — 2 öppna parenteser, 1 stängd i originalet). Joachim valde att skippa #1 och köra de 21 OK. (b) `2026-06-08_Beslut_-_BeslutForsenAvg_1781083570.pdf` — redan kanoniskt från run 2, re-prepend hade gett ful dubbel-prefix. **Original basenames**: `2026-05-24 Overforing till skattekonto Konto - Konton och kort - Svea Bank.pdf`, `2026-05-24 Salaries.md`, `2026-06-23 invoice.bolt.eu.pdf`, `4520_16_1779291675.pdf`, `invoice-40-796885441 (1).pdf`, `invoice.bolt.eu.pdf`, `Kvittens_165590802061 (1).pdf`, `Kvittens_165590802061.pdf`, `Kvittens-20260435755 (1).pdf`, `Kvittens-20260435755.pdf`, `Kvittens.pdf`, `receipt_4949479b-5402-4af5-a15b-7bfe8ad51bcb.pdf`, `Sincera_Holding_AB_Momsrapport_Period_202603.xlsx`, `Sincera_Holding_AB_Momsrapport Period 202604.xlsx`, `Slutskattebesked_2025P4_1781083540.pdf`, `Transaktioner 2025-12-01 - 2026-01-31.csv`, `Transaktioner SK 2025-01-01 - 2025-03-31.csv`, `Transaktioner SK 2025-04-01 - 2025-06-30.csv`, `Transaktioner SK 2025-07-01 - 2025-08-31.csv`, `Transaktioner SK 2025-09-01 - 2025-12-01.csv`, `Transaktioner SK 2025-12-01 - 2026-02-08.csv`. **New basenames**: `2026-05-24_Bankkvitto_-_2026-05-24 Overforing till skattekonto Konto - Konton och kort - Svea Bank.pdf`, `2026-03-31_Löner_-_2026-05-24 Salaries.md`, `2026-06-23_Faktura_-_2026-06-23 invoice.bolt.eu.pdf`, `2026-05-08_Beslut_-_4520_16_1779291675.pdf`, `2025-09-27_Faktura_-_invoice-40-796885441 (1).pdf`, `2026-06-23_Faktura_-_invoice.bolt.eu.pdf`, `2026-05-26_Kvittens_-_Kvittens_165590802061 (1).pdf`, `2026-04-30_Kvittens_-_Kvittens_165590802061.pdf`, `2026-05-08_Kvittens_-_Kvittens-20260435755 (1).pdf`, `2026-05-08_Kvittens_-_Kvittens-20260435755.pdf`, `2026-05-26_Kvittens_-_Kvittens.pdf`, `2026-05-12_Faktura_-_receipt_4949479b-5402-4af5-a15b-7bfe8ad51bcb.pdf`, `2026-03-31_Momsrapport_-_Sincera_Holding_AB_Momsrapport_Period_202603.xlsx`, `2026-04-30_Momsrapport_-_Sincera_Holding_AB_Momsrapport Period 202604.xlsx`, `2026-06-05_Beslut_-_Slutskattebesked_2025P4_1781083540.pdf`, `2026-01-31_Transaktioner_-_Transaktioner 2025-12-01 - 2026-01-31.csv`, `2025-03-31_Transaktioner_-_Transaktioner SK 2025-01-01 - 2025-03-31.csv`, `2025-06-30_Transaktioner_-_Transaktioner SK 2025-04-01 - 2025-06-30.csv`, `2025-08-31_Transaktioner_-_Transaktioner SK 2025-07-01 - 2025-08-31.csv`, `2025-12-01_Transaktioner_-_Transaktioner SK 2025-09-01 - 2025-12-01.csv`, `2026-02-08_Transaktioner_-_Transaktioner SK 2025-12-01 - 2026-02-08.csv`. **Errors caught / lessons**: (a) Pre-flight-felet ovan var Linneas första verkliga pre-flight-fångst — bekräftar att pre-flight-steget gör nytta. (b) `Kvittens-20260435755.pdf` och `Kvittens-20260435755 (1).pdf` har identisk text (bara 4 bytes storleksskillnad i PDF, troligen metadata) — samma rot/rut-begäran dubbelnedladdad. Inga åtgärder i v1; routing/dedupe ligger i v2+. (c) `4520_16_1779291675.pdf` är enligt filinnehållet `Beslut` med datum 2026-05-08, men persona.md § "Canonical filename format" har ett exempel som felaktigt kallar den `Faktura` med datum 2026-05-12 — exemplet är stale och bör uppdateras. (d) `Kvittens.pdf` (moms, inlämnad 2026-05-26 10:13) och `Kvittens_165590802061 (1).pdf` (AG, inlämnad 2026-05-26 12:24) är olika deklarationer på samma dag men får samma prefix-datum — OK enligt regeln (Inlämnad är auktoritativt datum per Klass). (e) `Slutskattebesked_2025P4_1781083540.pdf` är personligt brev till Sugey Brolin (pnr 750927-3749), inte Sincera Holding AB — klassas som `Beslut` enligt taxonomin, anteckning i Notes. (f) `invoice-40-796885441 (1).pdf` (Gotogate) har ingen explicit "Fakturadatum" — använder "Fecha de pedido" 2025-09-27 som proxy, medel confidence. (g) `receipt_4949479b-…pdf` (Uber) har ingen explicit "Fakturadatum" — datum 2026-05-12 från kvittots övre högerhörn, medel confidence.

## Skill Backlog

Out of scope in v1; consolidated in `/home/sincera/Documents/Inbox/Linnea-v2.md` to keep Linnea's prompt lean. Re-add here when v2 starts.

## Open Questions

- Whether files already conforming to the canonical format should be re-prepended (default: yes, for consistency) or skipped — confirm after first run
- The Slutskattebesked authoritative date: `Beslutsdatum` (top of letter) vs. the inkomstår year. Default for v1: `Beslutsdatum`.

## Resolved

- ✅ Filename separator: `_` between date and Klass, `_ - _` between Klass and original basename. Format is `YYYY-MM-DD_Klass_-_originalbasename`. Avoids space-quoting pain while keeping a visible seam.