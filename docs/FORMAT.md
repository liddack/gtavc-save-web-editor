# Retail format and implementation evidence

The implementation uses little-endian accesses with explicit widths. Every field has one owner in the schema, a block-relative address, a type, a section and a write policy. Original bytes are cloned, never regenerated from a partial object model.

## Evidence and conventions

References are attributed in [NOTICE](../NOTICE.md). All write-enabled fields are **documented / binary-tested / not yet game-tested**. Read-only progress fields are documented report values; no mission dependency map is asserted.

The reference save has 201,828 bytes, 23 blocks, a UTF-16LE slot title, a Retail script signature at absolute 0xEC and a valid trailing byte-sum checksum. Header identification is combined with block/subblock lengths and signatures; the file extension alone is never trusted. Steam's signature at 0xF0 is diagnosed and rejected.

A block consists of a uint32 length plus data rounded to four-byte alignment. Its data starts four bytes past the header. Most editable structures contain another uint32 subblock size, so their structure base is `block.data + 4`. The player-ped dump instead starts at `block.data + 18`. Confusing these bases silently edits unrelated fields.

| Subsystem                     | Block | Address basis / responsibility                                                                 |
| ----------------------------- | ----- | ---------------------------------------------------------------------------------------------- |
| Title and clock/weather       | 0     | Fixed Retail header; UTF-16LE title, clock bytes, weather int16 values and interpolation float |
| Player and weapons            | 1     | Ped dump; unaligned float attributes, 10 weapon records of 24 bytes                            |
| Stored vehicles               | 2     | Structure base, 48 records of 40 bytes; occupied records only                                  |
| Gang configuration            | 13    | Structure base, after signature/length; 9 records of 24 bytes                                  |
| Vehicle generators            | 14    | Structure base, generator count and up to 185 records of 44 bytes; edit allocated records only |
| Money and persistent benefits | 18    | Structure base; unaligned duplicate displayed-money field                                      |
| Statistics/progress           | 19    | Structure base; packed counters/floats and read-only property indicators                       |

Public core interfaces are `inspectSave`, `parseRetailSave`, `validateChanges` and `exportRetailSave`. `Field` descriptors locate supported fields; `Changes` uses field IDs, never arbitrary addresses. Export re-derives the schema from the original input rather than trusting caller-supplied descriptors.

## Write policy

- Exact original bytes on a no-op export, including unknown fields and padding.
- Same-length exports; no insertion, object allocation, slot growth or script rewriting.
- New numeric values must be finite, fit the representation, satisfy configured bounds and match enums where defined. Unknown existing IDs/values remain byte-for-byte intact unless explicitly replaced with a supported value.
- Money writes also update its displayed counterpart.
- Weapon slot restrictions are enforced. Changing type resets firing state, starts its clip at at most one round, and resets its firing timer; ammo changes clamp the clip to the new total. Empty slots require zero ammunition. Remote grenades require the detonator slot. No hidden ammo refill is performed by the exporter; the UI supplies a visible initial round when selecting a weapon into an empty slot.
- Health and armor edits cannot exceed their effective maxima. Generator delay edits must retain minimum <= maximum.
- Garage model 0 removes the record from use while preserving its other bytes; empty original records are not populated. Replacement options exclude aircraft, boats and remote-control vehicles. Existing excluded/unknown models remain inspectable and preservable.
- Slot names are limited to 1–23 printable ASCII characters excluding GXT `~` control codes; original titles remain untouched on a no-op export.
- Statistics and rewards are distinct. Raw progress counters, collectible counts, property flags and script globals cannot be edited individually. The verified Cone Crazy action is the bounded exception: one atomic reset with exactly defined script writes and one completion-credit adjustment.
- Checksum is recomputed after changes; the result is reparsed and edited values read back (with float32 rounding) before download.

Checksums establish binary consistency, not gameplay correctness. Runtime pointers, script state and dependencies are intentionally opaque and preserved. A modified save with the same structural layout is not guaranteed compatible.

## Extending campaign support

For each proposed campaign action: record the supported original-script identity, enumerate affected globals and non-script flags, collect before/after observations, test the next mission and unlocks, then reload a new in-game save. Only expose the action after those cases pass. Unknown script identities must keep campaign editing disabled. Do not bundle extracted scripts or infer completion from the save title or statistics alone.

## Cone Crazy: statistics are not a challenge reset

On 2026-10-26, the user tested changing the twentieth race/vehicle statistics entry (`stats.race19`) from 36 to 0. The Stats menu entry disappeared, while the challenge still used the previous time. Comparing the original with the supplied edited copy showed exactly two changed bytes: the Stats byte at absolute `0x27DDF` and the checksum byte at `0x31460`. These absolute addresses describe this reference file only; the editor continues to locate the field relative to block 19.

The entire script block was unchanged. This confirms the scope of the editor operation, and the user's gameplay observation shows it is insufficient to reset Cone Crazy. At the time of that initial diagnosis, the specific script variables had not been identified. Subsequent inspection of the user's WASM game package mapped them for a private full-reset experiment; the owner has since validated new-record acceptance and reward doubling in-game, and inspection of the exported post-game save confirmed persisted state and a single restored completion credit (see [Cone Crazy investigation](CONE-CRAZY.md)). Do not infer them from occurrences of the number 36 or automatically mirror Stats changes into script globals.

The UI now names this entry “Cone Crazy · Stats time (seconds)”, explains the scope next to the field in both languages, and repeats the distinction during review. The dedicated, verified Cone Crazy action now resets the challenge; changing this Stats field alone still does not. Regression tests assert that clearing this statistic preserves all script bytes, including an opaque sentinel with the same value.

The [source audit](SOURCE-AUDIT.md) records verified record/property/pedestrian labels, millisecond Hotring laps, signed race counters and float32 corrections for wheelie distances, property/repair spending and media attention. No-op exports preserve original bytes despite corrected interpretation.
