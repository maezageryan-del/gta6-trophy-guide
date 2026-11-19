# Leonida Runbook — GTA VI Platinum Guide & Tracker

[![Bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/maezageryan-del/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/maezageryan-del/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

Entry for the [gta6-trophy-guide-01 bounty](https://make.fun/c/gta6-trophy-guide-01) — "Build the best GTA 6 trophy guide" ($250).

## What it is

**Leonida Runbook** is the complete, offline guide to all **55 official GTA VI trophies** on PlayStation 5 (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PSN), rebuilt for v2 as a single-playthrough runbook: one careful run, by the book, with audited data. Every trophy keeps its official name, description, grade and hidden flag exactly as PlayStation publishes it — and now carries the structure the best guides win on:

- **Numbered steps** — 3–6 concrete steps per trophy (228 in total), derived from the trophy's own unlock condition.
- **Run-sheet stage & chapter** — every trophy sits in one of 7 roadmap stages and a story chapter, so the whole list reads as one playthrough in order.
- **Official targets** — counted trophies carry their real target (250 stunts, 42 Shooting Range challenges, 14 drone-race locations, 20 races, 9 activity types, 8 stranger strands, 18 meditation spots, 3 card sets, 100 WAiNK It locations, 50 challenges, 100 vehicles, 5 bank vaults, 52 areas, 9 gangs, $250,000 laundered, $100,000 spent, 8 garages, 10 Scooter Bros registrations, 500 choices).
- **A missable verdict for all 55** — not just the 8 missables: every trophy states why it is or is not missable, and the 8 real missables carry their window.
- **Time & difficulty** — a short time estimate and a 1–5 difficulty rating per trophy.
- **Citations** — each trophy cites keys into a dated source register (all sources read 2026-11-19).

## The audit strip

The page opens with an audit strip computed in the browser from `app/data/trophies.json` on every load — never typed by hand: trophies present, how many carry step-by-step guides, total steps, missable verdicts, missable windows, counted targets, and the source read date. If the data ever lost a step or a verdict, the strip would show it. `main.ts` enforces the same promise at hand-in time: it refuses to build a dossier unless the data file holds exactly 55 trophies, each with a non-blank name and guide.

## Features

- **Checklist tracker** — tick trophies off; progress saves in localStorage, with export to file and import back.
- **Next-Up planner** — the next 5 unearned trophies in run-sheet order, missable-window trophies first, each with its stage and window note.
- **Working counters** — counted trophies get a − / + counter in their guide, persisted on the device, so 42 range golds or 250 stunts are tracked, not just described.
- **Run Sheet tab** — the 7 stages in play order, each with its blurb, its trophies in order with checkboxes, a per-stage earned count, and missable windows flagged inline.
- **Missables tab** — the 8 missables with window, reasoning, and the stage/chapter to do them in.
- **Filters** — search, kind, grade, stage, missable-only, hide-earned.
- **Spoiler-safe mode** — masks hidden trophies' names and descriptions until you earn them.
- **Progress header** — X/55 earned, percent, and per-grade counts.

## Data model

`app/data/trophies.json` is a superset of the official list. Top level: game, platform, list, counts, note, a `sources` register (key → name, role, read date) and a 7-stage `roadmap`. Per trophy: the official `name`, `description`, `grade`, `hidden`, plus `kind`, `guide`, `steps`, `stage`, `chapter`, `target` + `unit` (null when uncounted), `missable`, `window`, `missableWhy`, `time`, `difficulty`, and `cites` into the register.

## Sources & method

Names, descriptions, grades and hidden flags follow the official PlayStation trophy list. Guides are written in the author's own words; facts were checked against Exophase (official list), PSNProfiles, PowerPyx, GTA Wiki and GTA Forums — each named in the register with its role and read date, and cited per trophy. Nothing copies another guide's text.

## How to run

No build step, no network loads — all assets are local.

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

Then open <http://localhost:8080>. Or open `app/index.html` directly in a browser.

## Screenshots

1. `1-atlas-checklist.png` — checklist with audit strip, Next-Up planner and progress header (demo progress seeded)
2. `2-trophy-guide.png` — a counted trophy's guide open: numbered steps and working counter
3. `3-roadmap.png` — the Run Sheet roadmap
4. `4-missables.png` — the missables view with windows

## Notes

Unofficial fan guide — not affiliated with Rockstar Games or PlayStation. Trophy data: official PlayStation list, 2026-11-18; sources read 2026-11-19.
