# The Platinum Docket — Leonida's sworn trophy record

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/maezageryan-del/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/maezageryan-del/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

Bounty: [gta6-trophy-guide-01 on make.fun](https://make.fun/c/gta6-trophy-guide-01) — "Build the best GTA 6 trophy guide."

## The concept

A trophy guide written like a court record. Every GTA VI trophy is a **case**
in the docket; every step in its guide is a numbered **exhibit**; and every
exhibit carries a visible **citation** to the dated source register it was
sworn from. Nothing in the guide is uncited, and the header audit bar —
trophies, steps, citations, missables, sources — is computed live from the
data at load, so the numbers on screen are the numbers in the record.

## What's inside

- **The Docket (default view):** all 55 trophies in one dense table the
  moment the page opens — grade, roadmap stage, chapter, step count,
  citation count, target, missable standing and an earned checkbox per case.
  No hero, no splash: the first screen is the guide itself.
- **Case files:** click any row to open its file inline — the full guide
  prose, the numbered exhibits each with its citation chip (source + read
  date), a −/+ progress counter for the 23 counted trophies, and the
  missable reasoning with its closing window where one exists.
- **463 cited steps:** each trophy's procedure is decomposed into
  setup → execution → verify exhibits (8–10 per case), every one derived
  from that trophy's own guide text and carrying its own citation.
- **Roadmap:** the 7-stage run sheet with the per-stage case lists.
- **Missables:** the only 8 cases that can close against you, each with its
  window quoted and the reasoning on record.
- **Next-Up:** everything still unearned, ordered by stage with
  missable-window urgency first inside each stage.
- **Sources:** the dated register (Exophase, PSNProfiles, PowerPyx, GTA
  Wiki, GTA Forums — all read 2026-11-19) with live citation counts.
- **Tracker:** earned checkboxes and counters persist in localStorage;
  hidden trophies stay spoiler-masked until revealed or earned; tracker
  state can be exported, imported and reset. Search plus grade / stage /
  kind / missable-only filters sit in the same compact header strip.

## Running it

- Preview: `node serve.ts`, then open `http://localhost:4173/app/`
- Validate the record and build the dossier: `node main.ts`
  (fails loudly unless the record holds exactly 55 trophies, ≥450 cited
  steps, every citation resolving in the register, and exactly 8 missables
  all with windows; writes `dossier.json` via `vendor/makefun-frontend.ts`).

Data lives in `app/data/trophies.json`; the expanded exhibit lists were
authored in `tools/expand.mjs`.
