# Names, types and units verified from the game and reVC

Checked on 2026-10-26. The owner's `.data` package supplies the English GXT table. The engine's statistics display associates `FastestTimes[0..22]` with `STFT_01..23`, and `PropertyOwned[0..14]` with `STPR_1..15`. We read those associations and the local table to identify factual names, then wrote our own concise labels and Portuguese descriptions. No GXT file, full table text, game artwork, SCM or engine source is bundled.

## Closed gaps

- All 23 race/vehicle statistics now identify the mission/activity, including Alloy Wheels of Steel, The Driver, RC activities, Sunshine Autos races, helicopter courses, PCJ Playground, Trial by Dirt, Test Track, Cone Crazy, Hotring and Checkpoint Charlie. Stable field IDs and offsets are retained.
- The Hotring fastest-lap slot (`stats.race21`) is **milliseconds**, confirmed by the display's conversion from thousandths. Other fastest-time slots are seconds. Stored values are not silently rescaled.
- All 15 read-only property flags identify their property instead of “Property flag N”. Boolean values display “Owned / Not owned” in the chosen language. The flags are not exposed as purchase/unlock operations.
- All 23 pedestrian-type counters identify their enum category, including civilians, police, emergency services, firefighters, criminals, special characters, security and Vercetti. The engine gang enum identifies Cubans, Haitians, street gang, Diaz, security, bikers, Vercetti and golfers; only its ninth unnamed category remains generic; unused enum entries are explicitly marked.
- Fastest times and general statistics counters use the engine's signed integer representation. Original sentinel/unusual values are preserved without normalization.

The gang editor now names these same nine enum categories. Source inspection also corrected the model-override choices: the consulted reVC implementation uses model 1 whenever override is enabled, regardless of a nonnegative override value. The UI therefore offers random selection or always model 1, rather than falsely labeling value 1 as “model 2”. Unknown original values remain preservable.

## Corrected numeric interpretations

These fields occupy the same four bytes as before. The old integer interpretation could display floating-point bit patterns as very large counters; edits now encode float32 values correctly.

| Field                      | Stats-relative offset | Correct type |
| -------------------------- | --------------------- | ------------ |
| Longest wheelie distance   | 0x16C                 | float32      |
| Longest stoppie distance   | 0x170                 | float32      |
| Longest two-wheel distance | 0x174                 | float32      |
| Property spending          | 0x178                 | float32      |
| Repair / painting spending | 0x17C                 | float32      |
| Highest media attention    | 0x19F                 | float32      |

Field IDs remain unchanged. A no-op export is still identical byte for byte; only deliberately edited values use the corrected interpretation. This update does not repair files previously edited with an incorrect integer value, since original intent cannot be inferred.

## References and remaining limits

Primary references: upstream reVC [Stats.cpp](https://github.com/mrxenginner/reVC/blob/miami/src/core/Stats.cpp), [Stats.h](https://github.com/mrxenginner/reVC/blob/miami/src/core/Stats.h) , [Gangs.h](https://github.com/mrxenginner/reVC/blob/miami/src/peds/Gangs.h), [Gangs.cpp](https://github.com/mrxenginner/reVC/blob/miami/src/peds/Gangs.cpp) and [PedType.h](https://github.com/mrxenginner/reVC/blob/miami/src/peds/PedType.h), plus the owner's local game package. Upstream branch `miami` was consulted as an interpretation reference; it is not asserted to be the exact source revision of the WASM binary. The Cone reset separately requires fingerprints of actual game scripts.

The read-only property flags do not establish a safe atomic property purchase. Garages remain internal storage records rather than guessed named locations. Arbitrary spawns remain indexed because they can be script-dependent. No additional campaign completion/reset operation is enabled solely from naming an entry. General statistics edits still do not imply rewards or changes to challenge logic.
