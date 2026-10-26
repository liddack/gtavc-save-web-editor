# Implementation validation

## Binary and build

The reference private save is `Hit the Courier`, 201,828 bytes, SHA-256 `324b5cff7aa4fd1588ec95a723bcf87076bb1da10a1da66e1184d92b1881ecf4`. It was read locally and never added to the distributable source/build. The private regression test verifies exact round-trip, known money/health/vehicle records, and modified export/reimport.

`npm run check` runs TypeScript checking, Vitest binary tests and the production Vite build. The binary tests cover immutable originals, unaligned fields, moved variable blocks, unknown IDs, checksums, malformed files, ranges, weapon dependencies, write isolation and forged descriptors. CI skips the optional private-file test when no reference file exists.

## Environment limitations

This implementation session could not resolve the npm registry or GitHub API. A request for unrestricted dependency installation was rejected by the environment policy. The development toolchain was therefore assembled from existing cached packages in ignored `.local/toolchain`, with a local-only override to cached PostCSS 8.5.28 / nanoid 3.3.19. The public package manifest and lockfile retain their normal upstream dependency requirements. A clean installation of the public lockfile has not been exercised in this environment; CI must confirm it with network access.

Creating `.git` metadata was also denied, and the GitHub API was unreachable, so no local Git repository, remote repository or Pages deployment was created.

The environment also rejected binding a localhost listening socket (`EPERM`). Consequently, the committed Playwright HTTP suite could not start here. A separate ignored HTML harness inlined the production bundle/styles and privately supplied the reference file to the normal file-input handler. This permitted browser inspection without a server, external requests or changes to the production CSP/build. It does not verify the HTTP delivery path or replace the Playwright CI suite.

The final browser harness passed 26 assertions at a 1440px viewport: reference import, readable float32 values, editing, undo/redo, review, output name/size/checksum, reimport, range errors, blocked invalid exports, all eight areas, read-only progress, occupied-garage selection, 176 generator records, replacement confirmation/cancellation, invalid-file preservation, and Portuguese translation. No resource requests were recorded by the private inlined app. Layout inspections at 390px, 820px and 1440px showed no page overflow. The narrow layout retained the preview validation notice. A repeat of the full scripted smoke at 390px exceeded the browser bridge timeout, so it is not counted as a completed automated mobile run. Most manual in-game cases remain pending; the Cone Crazy results below have been reported by the owner; see [MANUAL-TESTS.md](MANUAL-TESTS.md).

## Private manual copies

`npm run prepare:manual` creates five independent copies under `.local/manual-tests`, each named `GTAVCsf2.b` in its own case directory, plus a hash/change manifest. Cases cover identical export, money, attributes, world and weapons. Files are created exclusively; existing case files are never overwritten. The source file is not changed. To use another input, set `RETAIL_SAVE_PATH`.

## User gameplay finding: Cone Crazy (2026-10-26)

A user verified that setting the Stats time from 36 to 0 hides the Stats entry but leaves the previous time to beat in the challenge. The earlier blanket runtime-pending status must not be read as absence of this finding: the display-only effect was observed by the user. A subsequent profile-specific full-reset CLI was implemented and tested separately (see below). See [the recorded diagnosis](FORMAT.md#cone-crazy-statistics-are-not-a-challenge-reset).

The fix adds explicit Stats-only labels/help and a review notice, with regression coverage for preserving script state and bilingual accessible help. `npm run check` passed with 15 tests. The added Playwright case exercises clearing a 36-second statistic and checking the review notice; it remains pending execution in an environment that permits the local HTTP server.

## Full-reset gameplay result: Cone Crazy (2026-10-26)

The owner confirmed that the private full-reset copy accepted a 47-second victory as a new record and a later 42-second victory as another record with double the previous reward. Record comparison and reward progression therefore have direct user-observed runtime evidence for this package. The preceding implementation passed 18 automated tests and the build; those results establish binary consistency, not this runtime observation.

The subsequent post-game save inspection confirmed persisted Stats/script record 42, difficulty 10 seconds per checkpoint, reward state $400 and progress restored to 63/154 without duplicate credit. Money increased by $600, consistent with $200 + $400. The action is validated for this exact profile and has now been integrated into Progress in the web editor with local MAIN/mission verification, using the same core as the CLI. Initial tutorial presentation and a separate fresh reload were not reported. See [the investigation and expected post-test values](CONE-CRAZY.md#owner-runtime-result-2026-10-26).

The post-game fixture SHA-256 is `589e75c3733b4435062094b1054f22e0637b6f928731fd73fba3b1f3f9caf891`. It is stored only under ignored `.local/validation/` for an optional regression test. See [measured before/reset/after values](CONE-CRAZY.md#post-game-save-verification-2026-10-26).

After adding the private post-game regression case, `npm run check` passed with **19 tests**, TypeScript checking and the production build. No source save was modified.

## Web reset integration and source audit (2026-10-26)

The shared browser/CLI reset core, profile verification, bounded atomic action and source-derived catalogs pass **25 tests across 6 files**, TypeScript checking and the production build (`npm run check`). Private fixtures exercise the actual game package and the owner's post-game save; public tests use synthetic data. Tests cover both MAIN and mission fingerprints, missing/forged proof, incompatible saves, an active challenge, reset/write isolation, unrelated edits, undo via an unchanged export, and the corrected float32 fields/catalog order.

The browser harness verified the real SHA-256 fingerprints using a private sparse container containing the actual MAIN and Cone mission regions; the full original package was separately verified by the CLI/private tests. Browser export from the original save produced SHA-256 `30fdd572fc665ca324096cf9be0c762c846349ec83667dce5ef41d656fab0495`, exactly matching the owner-tested full-reset copy. Review, download availability and undo/redo were checked. The final panel was inspected at 390px without horizontal overflow. No game bytes or private fixtures are included in the distributable build.

The expanded Playwright suite includes the reset workflow and named fields, but its HTTP run remains blocked by the localhost socket restriction above. Browser harness results do not imply that this suite passed. See [SOURCE-AUDIT.md](SOURCE-AUDIT.md) for confirmed names, types, units and unresolved gaps.
