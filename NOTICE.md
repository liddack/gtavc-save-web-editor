# Sources and notices

This is an independent implementation. No source code from another save editor or reverse-engineered game engine was copied.

Format research references:

- GTAMods Wiki contributors, [Saves (GTA VC)](<https://gtamods.com/wiki/Saves_(GTA_VC)>), revision displayed as 17429. The page declares CC BY-SA (without an explicit version in the displayed footer). Consult the original site for license terms before copying its prose or tables. This project uses independently expressed code around factual offsets/types and does not reproduce the article.
- GTAMods Wiki contributors, [Weapon](https://gtamods.com/wiki/Weapon) and [Time cycle](https://gtamods.com/wiki/Time_cycle): factual weapon IDs, slots and weather IDs.
- GTA Connected contributors, [Vice City vehicle models](https://wiki.gtaconnected.com/Resources/GTAVC/VehicleModels): factual model IDs/names, independently transcribed and checked. No vehicle artwork is included.
- Local examination of a privately supplied Retail save: block boundaries, padding, checksum, player values and existing vehicle records. The save itself is excluded from distribution.

Research attribution does not relicense these external works under MIT. No third-party prose, images, tables, binary fixtures, extracted scripts or game engine code are bundled.

React/React DOM, Vite, TypeScript, Vitest and Playwright retain their respective licenses in the installed packages. npm lockfile records exact resolved dependencies; verify their license files before redistributing dependency code independently.

GTA, Grand Theft Auto and Vice City are names owned by their respective rights holders. Use here identifies compatibility. No affiliation, endorsement or permission from Rockstar Games or Take-Two is asserted.

Additional research: the user-supplied WASM/Retail game package and upstream [reVC](https://github.com/mrxenginner/reVC) informed the Cone Crazy investigation and factual field-name/type audit. Consulted engine references include CStats, ePedType and CGangs; local GXT key associations identify activity/property names. No game or engine code/assets are bundled or relicensed. See [the factual mapping and scope](docs/CONE-CRAZY.md).

See [the source audit](docs/SOURCE-AUDIT.md) for corrected types, units, names, references and remaining gaps.
