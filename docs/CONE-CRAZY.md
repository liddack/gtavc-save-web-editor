# Cone Crazy: private full-reset experiment

Status: **record acceptance and reward doubling verified in-game by the owner; persisted record, difficulty, reward and single completion credit verified in the exported post-game save for this exact WASM/Retail script profile**. The validated reset is integrated into the web editor and CLI through one shared core, with local game-script verification required. The owner's runtime is a WASM port based on reVC/Retail. The runtime source checkout/revision used to compile that WASM was not supplied, so the upstream repository is supporting interpretation, not proof of the exact WASM build.

## Evidence

The local Emscripten `.data` package contains one Retail SCM header with 34,336 bytes of variable space, a 204,596-byte main section, 97 missions and a 32,408-byte maximum mission size. Mission 91 occupies script-relative bytes 1,220,970 through 1,225,938. Its SHA-256 is `3287d0e9733ae1028dd877a6bd6273a56744b60a62cfe1057e8697a9d597af4e`. The helper verifies this fingerprint before using the mapping. No extracted SCM, disassembled mission or game asset is distributed.

The source semantics were cross-checked against upstream reVC's [script argument reader](https://github.com/mrxenginner/reVC/blob/miami/src/control/Script.cpp), [progress operation](https://github.com/mrxenginner/reVC/blob/miami/src/control/Script3.cpp), [odd-job completion registration](https://github.com/mrxenginner/reVC/blob/miami/src/control/Script8.cpp), and [statistics persistence](https://github.com/mrxenginner/reVC/blob/miami/src/core/Stats.cpp). This project uses its own code and factual binary observations; no engine implementation was copied.

Global arguments in the inspected bytecode address byte offsets within the saved variable space. The numeric global indices below are byte offset / 4. The saved variable space starts at 0xF8 for this Retail layout.

| State                          | Global index | Observed reference value | Reset value |
| ------------------------------ | -----------: | -----------------------: | ----------: |
| Current elapsed-time scratch   |          346 |                        0 |           0 |
| Instructions shown             |          350 |                        1 |           0 |
| First completion recorded      |          351 |                        1 |           0 |
| Time to beat, seconds          |          352 |                       36 |         120 |
| Checkpoint bonus, milliseconds |         1615 |                    11000 |       12000 |
| Time-format scratch            |         7892 |                       36 |           0 |
| Checkpoint bonus, seconds      |         7925 |                       11 |          12 |
| Reward, dollars                |         7926 |                      200 |         200 |
| Minute-format scratch          |         7927 |                        0 |           0 |

The 120-second value is the MAIN monitor's own initial comparison value, not a new record to display. The first-completion flag directs the next valid win through the initial award path. The mission then initializes its checkpoint allowance to 12 seconds and reward to $200. Subsequent improvements reduce the allowance, bounded at 6 seconds, and double the reward.

The first-win path grants one progress unit. Therefore a full reset of an already-completed challenge clears its flag **and subtracts exactly one unit from `ProgressMade`**. The next first win should restore that unit. Clearing the flag without removing the old credit would allow duplicate completion credit. In the supplied save, progress changes from 63/154 to 62/154 until the challenge is completed again. Current money, other mission flags and all unrelated bytes are preserved. Previously earned money is not deducted.

`MissionsPassed` is used by the engine's odd-job registration but is not serialized in this inspected Stats save layout. No unrelated counter is guessed or decremented. The helper refuses an active Cone Crazy thread, unknown script fingerprints, mismatched metadata, invalid checksums, missing completion credit and repeat application to an already-reset copy.

## Prepare and test

```sh
npm run prepare:cone-test -- /path/to/vc-sky-en-v6.data /path/to/GTAVCsf1.b
```

Outputs are exclusive new files under `.local/cone-crazy-full-reset-test/`: `GTAVCsf2.b` and a before/after hash/change manifest. Source game files and saves are never changed. The Progresso / Progress section provides the complete reset after local verification. Manual edits to the Stats field remain Stats-only. The shared core enforces profile verification and guards for both CLI and browser.

1. Back up your working saves; import the private copy into slot 2 and load it afresh.
2. Confirm Stats has no Cone Crazy record, current money is unchanged, and completion has decreased by one unit only.
3. Start Cone Crazy. Confirm the initial 12-second checkpoint allowance and the initial instructions.
4. Finish successfully, deliberately slower than the old 36-second mark. Confirm the run is accepted and pays $200.
5. Complete another run faster than that new mark. Confirm the next award is $400 and the allowance follows the original progression.
6. Save in-game, export that save and provide its local path for reinspection. Confirm completion returned to its previous value after the first win, with no extra credit on the second.

Report validation only for this exact profile and the observations recorded below; do not generalize it to every Retail or reVC build. The earlier `.local/cone-crazy-record-test` candidate only changed the comparison threshold and is superseded by the full-reset copy requested by the user.

## Owner runtime result (2026-10-26)

The owner tested the full-reset copy in their reVC/Retail WASM game and reported:

- A 47-second finish was accepted as a new record, despite being slower than the previous 36-second mark.
- A subsequent 42-second finish was accepted as another new record and doubled the previous reward.

This is user-observed runtime evidence, not an agent-executed gameplay test. It validates reopening the record comparison and continuing the reward progression. That initial report alone did not establish exact dollar amounts, completion accounting or persisted values; the subsequent binary inspection below supplies that evidence. Initial tutorial display and a separate fresh game reload remain unreported.

The expected post-test values, derived before inspection from the supplied starting state and inspected script, were comparison time 42, Stats time 42, completion flag 1, progress 63/154, checkpoint bonus 10 seconds / 10000 milliseconds, and reward 400. Those predictions are now confirmed by the measured save values below. A separate fresh game reload after export has not been reported. Web integration verifies the game file and does not infer a compatible script solely from the save filename or Retail header.

## Post-game save verification (2026-10-26)

The user supplied `GTAVCsf8.b` after both wins. Its SHA-256 is `589e75c3733b4435062094b1054f22e0637b6f928731fd73fba3b1f3f9caf891`; the structure and checksum are valid. The binary is kept only as an ignored local regression fixture, never included in the public repository or build.

| Value                          | Original |              Reset copy | Post-game save |
| ------------------------------ | -------: | ----------------------: | -------------: |
| Stats time, seconds            |       36 |                       0 |             42 |
| Script time to beat, seconds   |       36 | 120 (initial reference) |             42 |
| Completion flag                |        1 |                       0 |              1 |
| Checkpoint bonus, seconds      |       11 |                      12 |             10 |
| Checkpoint bonus, milliseconds |    11000 |                   12000 |          10000 |
| Reward state, dollars          |      200 |                     200 |            400 |
| Progress units                 |   63/154 |                  62/154 |         63/154 |
| Money, dollars                 |    26983 |                   26983 |          27583 |

Progress rose by exactly one unit from the reset copy despite two successful runs, confirming no duplicate completion credit. Money rose by $600, consistent with an initial $200 award, a subsequent $400 award, and the user-reported doubling. Record, reward and difficulty are persisted in the exported save. Exact initial tutorial presentation and a separate subsequent game reload were not reported; they are not represented as independently observed.

An optional local regression test reads this private fixture, checks the observed state and verifies that a later deliberate full reset removes one credit while preserving the new balance. The normal web editor now queues the validated reset as one undoable operation in the export review.

## Browser integration

Open **Progress**, choose the local game `.data` or `main.scm`, then prepare the reset. Game bytes are discarded after verification; the in-memory verification object is not persisted or accepted from user JSON. The MAIN SHA-256 is `1b550a3a949409f6643805bb576934ded4c84f0e327ee1f8c5e6989b13194eed`; both MAIN and mission must match. This stricter check also rejects changed main scripts with an unchanged Cone mission.

`action.coneCrazyReset` is an atomic change alongside scalar edits. Validation rejects absent/forged profile verification, incompatible save metadata, an active challenge, missing completion credit, repeated resets and conflicting Stats-time changes. Undo removes the whole operation; redo restores it. Export rebuilds the schema from original bytes, applies ordinary edits, applies the bounded reset, recomputes checksum and reparses the output. Its output matches the owner-validated reset byte for byte. A new save import clears verification.
