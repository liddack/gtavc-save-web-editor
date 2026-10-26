export type Locale = 'en' | 'pt';
export type Text = readonly [en: string, pt: string];
export const text = (value: Text, locale: Locale) =>
  value[locale === 'pt' ? 1 : 0];
export interface Option {
  value: number;
  label: Text;
}
export const option = (value: number, en: string, pt = en): Option => ({
  value,
  label: [en, pt],
});
export const yesNo = [
  option(0, 'Off', 'Desativado'),
  option(1, 'On', 'Ativado'),
];
export const weapons = [
  ['Unarmed', 0],
  ['Brass knuckles', 0],
  ['Screwdriver', 1],
  ['Golf club', 1],
  ['Nightstick', 1],
  ['Knife', 1],
  ['Baseball bat', 1],
  ['Hammer', 1],
  ['Cleaver', 1],
  ['Machete', 1],
  ['Katana', 1],
  ['Chainsaw', 1],
  ['Grenade', 2],
  ['Remote grenade', 2],
  ['Tear gas', 2],
  ['Molotov', 2],
  ['Missile (internal)', -1],
  ['Colt .45', 3],
  ['Python', 3],
  ['Shotgun', 4],
  ['SPAS-12', 4],
  ['Stubby shotgun', 4],
  ['Tec-9', 5],
  ['Uzi', 5],
  ['MAC-10', 5],
  ['MP5', 5],
  ['M4', 6],
  ['Ruger', 6],
  ['Sniper rifle', 8],
  ['PSG-1', 8],
  ['Rocket launcher', 7],
  ['Flamethrower', 7],
  ['M60', 7],
  ['Minigun', 7],
  ['Detonator', 9],
] as const;
export const weaponOptions = weapons.flatMap(([name, slot], id) =>
  slot < 0 ? [] : [option(id, name)],
);
export const slotOptions = (slot: number) => [
  option(0, 'Empty / unarmed', 'Vazio / desarmado'),
  ...weapons.flatMap(([name, s], id) =>
    id > 0 && s === slot ? [option(id, name)] : [],
  ),
];
export const slotNames: Text[] = [
  ['Fists', 'Punhos'],
  ['Melee', 'Corpo a corpo'],
  ['Throwables', 'Arremessáveis'],
  ['Pistols', 'Pistolas'],
  ['Shotguns', 'Escopetas'],
  ['Submachine guns', 'Submetralhadoras'],
  ['Assault rifles', 'Fuzis'],
  ['Heavy weapons', 'Armas pesadas'],
  ['Sniper rifles', 'Rifles de precisão'],
  ['Detonator', 'Detonador'],
];
// Factual IDs, independently transcribed; provenance in docs/FORMAT.md.
const vehicleNames =
  'Landstalker|Idaho|Stinger|Linerunner|Perennial|Sentinel|Rio|Firetruck|Trashmaster|Stretch|Manana|Infernus|Voodoo|Pony|Mule|Cheetah|Ambulance|FBI Washington|Moonbeam|Esperanto|Taxi|Washington|Bobcat|Mr. Whoopee|BF Injection|Hunter|Police|Enforcer|Securicar|Banshee|Predator|Bus|Rhino|Barracks OL|Cuban Hermes|Helicopter|Angel|Coach|Cabbie|Stallion|Rumpo|RC Bandit|Romero|Packer|Sentinel XS|Admiral|Squalo|Sea Sparrow|Pizza Boy|Gang Burrito|Airtrain|Dead Dodo|Speeder|Reefer|Tropic|Flatbed|Yankee|Caddy|Zebra Cab|Top Fun|Skimmer|PCJ-600|Faggio|Freeway|RC Baron|RC Raider|Glendale|Oceanic|Sanchez|Sparrow|Patriot|Love Fist|Coast Guard|Dinghy|Hermes|Sabre|Sabre Turbo|Phoenix|Walton|Regina|Comet|Deluxo|Burrito|Spand Express|Marquis|Baggage Handler|Kaufman Cab|Maverick|VCN Maverick|Rancher|FBI Rancher|Virgo|Greenwood|Cuban Jetmax|Hotring Racer 1|Sandking|Blista Compact|Police Maverick|Boxville|Benson|Mesa Grande|RC Goblin|Hotring Racer 2|Hotring Racer 3|Bloodring Banger 1|Bloodring Banger 2|VCPD Cheetah'.split(
    '|',
  );
export const vehicles = vehicleNames.map((name, index) =>
  option(130 + index, `${130 + index} · ${name}`),
);
// Exclude remote-control, train/aircraft and boats for stored garage replacements.
const garageExcluded = new Set([
  136, 155, 160, 165, 171, 176, 177, 180, 181, 182, 183, 184, 190, 194, 195,
  199, 202, 203, 214, 217, 218, 223, 227, 231,
]);
export const spawnVehicles = vehicles.filter(
  (v) => ![165, 171, 180, 181, 194, 195, 231].includes(v.value),
);
export const garageVehicles = vehicles.filter(
  (v) => !garageExcluded.has(v.value),
);
export const weather = [
  option(0, 'Sunny', 'Ensolarado'),
  option(1, 'Cloudy', 'Nublado'),
  option(2, 'Rainy', 'Chuvoso'),
  option(3, 'Foggy', 'Neblina'),
  option(4, 'Extra sunny', 'Muito ensolarado'),
  option(5, 'Hurricane', 'Furacão'),
  option(6, 'Extra colours 1', 'Cores especiais 1'),
];
