# Vice City Save Workshop

> **Notice:** this project was developed entirely with the help of artificial intelligence (AI).

[Português](../README.md)

Independent **classic GTA Vice City PC Retail** save editor. Runs entirely in the browser, with a static GitHub Pages build. Original code is MIT licensed.

**Preview: automated binary validation and partial owner-reported in-game verification of the Cone Crazy reset; see [evidence and outstanding checks](VALIDATION.md).** Steam, mobile, Definitive Edition and format conversion are unsupported. A Retail layout cannot distinguish executable 1.0 from 1.1 or prove whether a compatible port produced the file.

[Open the editor on GitHub Pages](https://liddack.github.io/gtavc-save-web-editor/)

## Run

Use Node.js 22.12+ (24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the Vite URL, choose `GTAVCsf#.b`, edit, review and download a separate copy. Keep the original. Test the output in a separate slot by naming it `GTAVCsf2.b`, for example.

## Features

Player attributes, money, persistent benefits and position; weapons and ammunition; clock, weather and save title; existing stored vehicles, colours, position and protection flags; gang models/weapons; existing vehicle generators; documented statistics and records. Undo/redo, restore original, review, Portuguese and English.

Empty garage records cannot be populated. Counters do not complete activities, grant rewards or reset challenges. The Cone Crazy time (formerly “Record 20”) edits the Stats entry only; setting it to zero does not reset the challenge’s time to beat. Campaign/properties/collectibles are read-only reported values, not an individual mission or collectible checklist. The complete Cone Crazy reset is now available in Progress after local verification of the supported game script. Other campaign changes remain unavailable. Unknown original values/IDs and opaque bytes are preserved. New values are validated against the supported schema. Modified scripts/maps/models are unsupported, and game scripts may override some gang/generator edits.

## Cone Crazy reset

Open the save, go to **Progress**, select the `.data` or `main.scm` from the game you play, and choose **Prepare full Cone Crazy reset** after verification. Review the operation before downloading. Undo/redo and restore-original include the complete reset. Verification uses both MAIN and mission SHA-256 fingerprints, stays in memory and is required again when opening another save. Active challenge saves and unsupported profiles are blocked.

The reset restores the record, tutorial, first completion, 12-second checkpoint allowance and $200 starting reward. It removes one completion unit, regained on the next first win, while preserving current money. Manually setting the Stats time to zero is still Stats-only.

All 23 race records and 15 properties now have verified names; pedestrian-type counters are identified. The fastest Hotring lap is milliseconds, other race records are seconds. Some distances, spending and media fields were corrected from integer to float32. See [the source audit](SOURCE-AUDIT.md).

## Privacy and verification

Save bytes stay in memory; no upload, analytics, autosave or service worker. Only language preference persists. Closing or reloading discards the document and edits. Static site requests still reach the host.

```sh
npm run check
npx playwright install chromium
npm run test:e2e
RETAIL_SAVE_PATH=/path/to/GTAVCsf1.b npm run test:local
npm run prepare:manual
```

Local private-save tests are optional; the fallback path is `/private/tmp/Downloads/GTAVCsf1.b`. Saves, `.local/` and test outputs are ignored by Git. Public synthetic fixtures contain no game code/assets and are not playable. See [validation evidence and limitations](VALIDATION.md), [format/provenance](FORMAT.md) and [manual verification](MANUAL-TESTS.md).

## Publish

Initialize a repository with `git init -b main` if needed, then push to a public GitHub repository on `main`. Select **GitHub Actions** in **Settings → Pages**, then run **Publish preview to GitHub Pages**. It runs checks and browser tests before publishing the validated static artifact. Relative asset paths support project Pages URLs. **Validate** runs for pull requests and pushes to `main`. To roll back, run the publication workflow on a branch/commit with a previously validated version.

## License

MIT applies to original code; third-party licenses remain applicable. See [NOTICE](../NOTICE.md). No game executables, extracted scripts, music, artwork or models are included. This project is unaffiliated with Rockstar Games or Take-Two. Its license grants no rights to the game and is not authorization from its owners or a legal guarantee.
