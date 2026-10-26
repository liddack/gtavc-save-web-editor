import {
  raceNames,
  propertyNames,
  pedestrianTypes,
  gangNames,
} from './statCatalogs.ts';
import {
  garageVehicles,
  option,
  slotNames,
  slotOptions,
  spawnVehicles,
  weaponOptions,
  weather,
  yesNo,
  type Text,
} from './catalogs.ts';
import type { Block, Field, ScalarType, Section } from './types.ts';

export function createFields(bytes: Uint8Array, blocks: Block[]): Field[] {
  const fields: Field[] = [];
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const base = (i: number) => blocks[i].data + 4;
  const add = (
    id: string,
    section: Section,
    group: Text,
    label: Text,
    offset: number,
    type: ScalarType = 'u32',
    extra: Partial<Field> = {},
  ) => {
    const ranges: Record<ScalarType, [number, number]> = {
      u8: [0, 255],
      u16: [0, 65535],
      i16: [-32768, 32767],
      u32: [0, 4294967295],
      i32: [-2147483648, 2147483647],
      f32: [-10000, 10000],
      name: [0, 0],
    };
    fields.push({
      id,
      section,
      group,
      label,
      offset,
      type,
      min: ranges[type][0],
      max: ranges[type][1],
      ...extra,
    });
  };
  const player: Text = ['Player', 'Jogador'],
    benefits: Text = ['Persistent benefits', 'Benefícios persistentes'];
  const pi = base(18),
    ped = blocks[1].data + 18;
  add('player.money', 'player', player, ['Money', 'Dinheiro'], pi, 'u32', {
    max: 999999999,
    mirrors: [pi + 0xf],
  });
  add(
    'player.health',
    'player',
    player,
    ['Health', 'Vida'],
    ped + 0x354,
    'f32',
    { min: 1, max: 255 },
  );
  add(
    'player.armor',
    'player',
    player,
    ['Armor', 'Colete'],
    ped + 0x358,
    'f32',
    { min: 0, max: 255 },
  );
  add(
    'player.maxHealth',
    'player',
    player,
    ['Maximum health', 'Vida máxima'],
    pi + 0x1e,
    'u8',
    { min: 1 },
  );
  add(
    'player.maxArmor',
    'player',
    player,
    ['Maximum armor', 'Colete máximo'],
    pi + 0x1f,
    'u8',
  );
  for (const [id, en, pt, off] of [
    ['stamina', 'Infinite stamina', 'Resistência infinita', 0x1b],
    ['reload', 'Fast reload', 'Recarga rápida', 0x1c],
    ['fireproof', 'Fireproof', 'Imunidade ao fogo', 0x1d],
    ['jail', 'Free jail release', 'Saída gratuita da prisão', 0x20],
    ['healthcare', 'Free healthcare', 'Hospital gratuito', 0x21],
    ['driveby', 'Drive-by enabled', 'Disparo do veículo', 0x22],
  ] as const)
    add(`player.${id}`, 'player', benefits, [en, pt], pi + off, 'u8', {
      options: yesNo,
    });
  add(
    'player.maxStamina',
    'player',
    benefits,
    ['Maximum stamina', 'Resistência máxima'],
    ped + 0x604,
    'f32',
    { min: 0, max: 10000 },
  );
  ['X', 'Y', 'Z'].forEach((axis, i) =>
    add(
      `player.position${axis}`,
      'player',
      ['Position (advanced)', 'Posição (avançado)'],
      [axis, axis],
      ped + 0x34 + 4 * i,
      'f32',
    ),
  );
  for (let i = 0; i < 10; i++) {
    const p = ped + 0x408 + 24 * i,
      group: Text = [
        `Slot ${i} · ${slotNames[i][0]}`,
        `Slot ${i} · ${slotNames[i][1]}`,
      ];
    add(`weapon.${i}.type`, 'weapons', group, ['Weapon', 'Arma'], p, 'u32', {
      options: slotOptions(i),
    });
    add(
      `weapon.${i}.ammo`,
      'weapons',
      group,
      ['Total ammunition', 'Munição total'],
      p + 12,
      'u32',
      { max: 99999 },
    );
  }
  const world: Text = ['Clock and weather', 'Relógio e clima'];
  add(
    'world.name',
    'world',
    ['Save name', 'Nome do save'],
    ['Name in slot menu', 'Nome no menu de saves'],
    4,
    'name',
  );
  add('world.hour', 'world', world, ['Hour', 'Hora'], 4 + 0x5c, 'u8', {
    max: 23,
  });
  add('world.minute', 'world', world, ['Minute', 'Minuto'], 4 + 0x60, 'u8', {
    max: 59,
  });
  add(
    'world.oldWeather',
    'world',
    world,
    ['Current weather', 'Clima atual'],
    4 + 0x88,
    'i16',
    { options: weather },
  );
  add(
    'world.nextWeather',
    'world',
    world,
    ['Next weather', 'Próximo clima'],
    4 + 0x8c,
    'i16',
    { options: weather },
  );
  add(
    'world.forcedWeather',
    'world',
    world,
    ['Forced weather', 'Clima forçado'],
    4 + 0x90,
    'i16',
    { options: [option(-1, 'Natural cycle', 'Ciclo natural'), ...weather] },
  );
  add(
    'world.interpolation',
    'world',
    world,
    ['Weather transition (0–1)', 'Transição do clima (0–1)'],
    4 + 0x94,
    'f32',
    { min: 0, max: 1 },
  );
  const g = base(2);
  for (let i = 0; i < 48; i++) {
    const p = g + 0x2c + 40 * i,
      occupied = v.getUint32(p, true) !== 0;
    const group: Text = [
      `Stored vehicle ${i + 1}${occupied ? '' : ' · empty'}`,
      `Veículo guardado ${i + 1}${occupied ? '' : ' · vazio'}`,
    ];
    const extra = { readOnly: !occupied };
    add(
      `garage.${i}.model`,
      'garages',
      group,
      ['Vehicle model (0 removes it)', 'Modelo do veículo (0 remove)'],
      p,
      'u32',
      { ...extra, options: [option(0, 'Empty', 'Vazio'), ...garageVehicles] },
    );
    if (!occupied) continue;
    add(
      `garage.${i}.primary`,
      'garages',
      group,
      ['Primary colour ID', 'ID da cor primária'],
      p + 0x20,
      'u8',
      { max: 94 },
    );
    add(
      `garage.${i}.secondary`,
      'garages',
      group,
      ['Secondary colour ID', 'ID da cor secundária'],
      p + 0x21,
      'u8',
      { max: 94 },
    );
    add(
      `garage.${i}.proofs`,
      'garages',
      group,
      ['Protection flags (bit mask)', 'Proteções (máscara de bits)'],
      p + 0x1c,
      'u32',
      { max: 31 },
    );
    ['X', 'Y', 'Z'].forEach((axis, n) =>
      add(
        `garage.${i}.${axis}`,
        'garages',
        group,
        [`Position ${axis}`, `Posição ${axis}`],
        p + 4 + 4 * n,
        'f32',
      ),
    );
  }
  for (let i = 0; i < 9; i++) {
    const p = base(13) + 8 + 24 * i,
      group: Text = gangNames[i];
    add(
      `gang.${i}.car`,
      'gangs',
      group,
      ['Vehicle model', 'Modelo do veículo'],
      p,
      'i32',
      { options: [option(-1, 'None', 'Nenhum'), ...garageVehicles] },
    );
    for (let n = 0; n < 2; n++)
      add(
        `gang.${i}.ped${n}`,
        'gangs',
        group,
        [`Pedestrian model ${n + 1}`, `Modelo de personagem ${n + 1}`],
        p + 4 + n * 4,
        'i32',
        { min: -1, max: 106 },
      );
    add(
      `gang.${i}.preference`,
      'gangs',
      group,
      ['Pedestrian model override', 'Seleção do personagem'],
      p + 0xc,
      'u8',
      {
        options: [
          option(255, 'Either model', 'Qualquer modelo'),
          option(0, 'Always model 1', 'Sempre o modelo 1'),
        ],
      },
    );
    for (let n = 0; n < 2; n++)
      add(
        `gang.${i}.weapon${n}`,
        'gangs',
        group,
        [`Weapon ${n + 1}`, `Arma ${n + 1}`],
        p + 0x10 + n * 4,
        'u32',
        { options: weaponOptions },
      );
  }
  const generatorCount = v.getUint32(base(14) + 0xc, true);
  for (let i = 0; i < generatorCount; i++) {
    const p = base(14) + 0x1c + 44 * i,
      group: Text = [`Generator ${i + 1}`, `Gerador ${i + 1}`];
    add(
      `spawn.${i}.model`,
      'spawns',
      group,
      ['Vehicle model', 'Modelo do veículo'],
      p,
      'i32',
      { options: [option(-1, 'Random', 'Aleatório'), ...spawnVehicles] },
    );
    ['X', 'Y', 'Z'].forEach((axis, n) =>
      add(
        `spawn.${i}.${axis}`,
        'spawns',
        group,
        [axis, axis],
        p + 4 + 4 * n,
        'f32',
      ),
    );
    add(
      `spawn.${i}.heading`,
      'spawns',
      group,
      ['Heading (radians)', 'Orientação (radianos)'],
      p + 0x10,
      'f32',
      { min: -Math.PI * 2, max: Math.PI * 2 },
    );
    for (const [id, off, en, pt] of [
      [
        'primary',
        0x14,
        'Primary colour ID (-1 random)',
        'ID da cor primária (-1 aleatória)',
      ],
      [
        'secondary',
        0x16,
        'Secondary colour ID (-1 random)',
        'ID da cor secundária (-1 aleatória)',
      ],
    ] as const)
      add(`spawn.${i}.${id}`, 'spawns', group, [en, pt], p + off, 'i16', {
        min: -1,
        max: 94,
      });
    add(
      `spawn.${i}.force`,
      'spawns',
      group,
      ['Force spawn', 'Forçar aparecimento'],
      p + 0x18,
      'u8',
      { options: yesNo },
    );
    for (const [id, off, en, pt] of [
      ['alarm', 0x19, 'Alarm chance (%)', 'Chance de alarme (%)'],
      ['lock', 0x1a, 'Lock chance (%)', 'Chance de travamento (%)'],
    ] as const)
      add(`spawn.${i}.${id}`, 'spawns', group, [en, pt], p + off, 'u8', {
        max: 100,
      });
    add(
      `spawn.${i}.minDelay`,
      'spawns',
      group,
      ['Minimum delay (ms)', 'Intervalo mínimo (ms)'],
      p + 0x1c,
      'u16',
    );
    add(
      `spawn.${i}.maxDelay`,
      'spawns',
      group,
      ['Maximum delay (ms)', 'Intervalo máximo (ms)'],
      p + 0x1e,
      'u16',
    );
    add(
      `spawn.${i}.enabled`,
      'spawns',
      group,
      [
        'Spawn count (-1 always, 0 disabled)',
        'Quantidade (-1 sempre, 0 desativado)',
      ],
      p + 0x28,
      'i16',
      { min: -1, max: 32767 },
    );
  }
  const stats = base(19),
    general: Text = ['Counters and records', 'Contadores e recordes'];
  const counters: [number, string, string, string][] = [
    [
      4,
      'otherKills',
      'People wasted by others',
      'Pessoas eliminadas por outros',
    ],
    [0x74, 'aircraftDestroyed', 'Aircraft destroyed', 'Aeronaves destruídas'],
    [0x80, 'explosives', 'Explosives used (kg)', 'Explosivos usados (kg)'],
    [
      0x8c,
      'starsAttained',
      'Wanted stars attained',
      'Estrelas de procurado recebidas',
    ],
    [
      0x90,
      'starsEvaded',
      'Wanted stars evaded',
      'Estrelas de procurado evitadas',
    ],
    [0xa4, 'resprays', 'Vehicle resprays', 'Pinturas de veículos'],
    [0xb8, 'bestStunt', 'Best insane stunt', 'Melhor salto insano'],
    [
      0x16c,
      'wheelieDistance',
      'Longest wheelie distance',
      'Maior distância de empinada',
    ],
    [
      0x170,
      'stoppieDistance',
      'Longest stoppie distance',
      'Maior distância de stoppie',
    ],
    [
      0x174,
      'twoWheelDistance',
      'Longest two-wheel distance',
      'Maior distância em duas rodas',
    ],
    [0x188, 'bloodringKills', 'Bloodring kills', 'Eliminações no Bloodring'],
    [
      0x18c,
      'bloodringTime',
      'Longest Bloodring time',
      'Maior tempo no Bloodring',
    ],
    [0x19f, 'media', 'Highest media attention', 'Maior atenção da mídia'],
    [
      0x213,
      'hotring',
      'Hotring · best finishing position',
      'Hotring · melhor colocação',
    ],
    [0, 'kills', 'People wasted by player', 'Pessoas eliminadas pelo jogador'],
    [
      8,
      'carsDestroyed',
      'Road vehicles destroyed',
      'Veículos terrestres destruídos',
    ],
    [12, 'boatsDestroyed', 'Boats destroyed', 'Barcos destruídos'],
    [16, 'tires', 'Tyres popped', 'Pneus furados'],
    [20, 'bullets', 'Bullets fired', 'Disparos efetuados'],
    [0x84, 'hits', 'Bullets hit', 'Disparos acertados'],
    [0x88, 'headshots', 'Headshots', 'Tiros na cabeça'],
    [0x94, 'busted', 'Times busted', 'Prisões'],
    [0x98, 'hospital', 'Hospital visits', 'Visitas ao hospital'],
    [0x9c, 'days', 'Days passed', 'Dias passados'],
    [0xa0, 'saves', 'Safehouse visits', 'Visitas ao esconderijo'],
    [0xa8, 'jumpDistance', 'Longest jump distance', 'Maior distância de salto'],
    [0xac, 'jumpHeight', 'Highest jump', 'Maior altura de salto'],
    [0xb0, 'jumpFlips', 'Most jump flips', 'Maior número de giros'],
    [0xb4, 'jumpRotation', 'Greatest jump rotation', 'Maior rotação no salto'],
    [0xc4, 'attempts', 'Mission attempts', 'Tentativas de missões'],
    [0xc8, 'taxiPassengers', 'Taxi passengers', 'Passageiros de táxi'],
    [0xcc, 'taxiMoney', 'Taxi earnings', 'Ganhos no táxi'],
    [
      0x100,
      'ambulance',
      'People saved in ambulance',
      'Pessoas salvas na ambulância',
    ],
    [
      0x104,
      'vigilanteKills',
      'Vigilante criminals eliminated',
      'Criminosos eliminados',
    ],
    [0x108, 'fires', 'Fires extinguished', 'Incêndios apagados'],
    [
      0x10c,
      'vigilanteLevel',
      'Highest vigilante level',
      'Maior nível de vigilante',
    ],
    [
      0x110,
      'paramedicLevel',
      'Highest paramedic level',
      'Maior nível de paramédico',
    ],
    [
      0x114,
      'firefighterLevel',
      'Highest firefighter level',
      'Maior nível de bombeiro',
    ],
    [0x160, 'wheelie', 'Longest wheelie (ms)', 'Maior empinada (ms)'],
    [0x164, 'stoppie', 'Longest stoppie (ms)', 'Maior stoppie (ms)'],
    [
      0x168,
      'twoWheels',
      'Longest two wheels (ms)',
      'Maior tempo em duas rodas (ms)',
    ],
    [0x178, 'propertyBudget', 'Property spending', 'Gastos com propriedades'],
    [0x17c, 'repairBudget', 'Repair spending', 'Gastos com reparos'],
    [0x180, 'damage', 'Property damage', 'Danos à propriedade'],
  ];
  for (const [off, id, en, pt] of counters)
    add(
      `stats.${id}`,
      'stats',
      general,
      [en, pt],
      stats + off,
      [0xa8, 0xac, 0x16c, 0x170, 0x174, 0x178, 0x17c, 0x19f].includes(off)
        ? 'f32'
        : 'i32',
      { min: 0, max: 999999999 },
    );
  for (const [off, id, en, pt] of [
    [0x134, 'weaponsBudget', 'Weapon spending', 'Gastos com armas'],
    [0x138, 'fashionBudget', 'Fashion spending', 'Gastos com roupas'],
    [0x140, 'robberies', 'Stores robbed', 'Lojas assaltadas'],
    [
      0x148,
      'contracts',
      'Contracts completed (counter)',
      'Contratos concluídos (contador)',
    ],
    [0x14c, 'pizzas', 'Pizzas delivered', 'Pizzas entregues'],
    [0x154, 'icecream', 'Ice creams sold', 'Sorvetes vendidos'],
  ] as const)
    add(`stats.${id}`, 'stats', general, [en, pt], stats + off, 'f32', {
      min: 0,
      max: 1e9,
    });
  for (let i = 0; i < 23; i++) {
    add(
      `stats.pedKills${i}`,
      'stats',
      ['Eliminations by pedestrian type', 'Eliminações por tipo de personagem'],
      [
        `${pedestrianTypes[i][0]} · eliminations`,
        `${pedestrianTypes[i][1]} · eliminações`,
      ],
      stats + 0x18 + i * 4,
    );
    add(
      `stats.race${i}`,
      'stats',
      ['Race and vehicle statistics', 'Estatísticas de corridas e veículos'],
      i === 21
        ? [
            'Hotring · fastest lap (milliseconds)',
            'Hotring · volta mais rápida (milissegundos)',
          ]
        : [
            `${raceNames[i]} · Stats time (seconds)`,
            `${raceNames[i]} · tempo nas estatísticas (segundos)`,
          ],
      stats + 0x1a3 + i * 4,
      'i32',
      {
        max: 999999999,
        help:
          i === 21
            ? [
                'Stored in milliseconds: 72500 means 72.5 seconds. This edits Stats only, not the challenge script.',
                'Armazenado em milissegundos: 72500 equivale a 72,5 segundos. Altera apenas Stats, não o script do desafio.',
              ]
            : i === 19
              ? [
                  'Formerly Record 20. This edits the Stats entry only. Setting it to 0 can hide the entry, but does not reset Cone Crazy or its time to beat.',
                  'Antes chamado Recorde 20. Altera apenas a entrada de Stats. Definir 0 pode ocultá-la, mas não reinicia o Cone Crazy nem o tempo a vencer.',
                ]
              : [
                  'This edits the stored statistics entry only. A challenge may keep its own record separately; this is not a challenge reset.',
                  'Altera apenas a estatística armazenada. O desafio pode manter seu próprio recorde separadamente; isto não reinicia o desafio.',
                ],
      },
    );
  }
  for (const [i, en, pt] of [
    [0, 'Shooter high score', 'Recorde do Shooter'],
    [1, 'Best shooting accuracy (%)', 'Melhor precisão de tiro (%)'],
    [2, 'Drug deals (counter)', 'Negócios de drogas (contador)'],
    [3, 'Beach ball high score', 'Recorde de bola de praia'],
  ] as const)
    add(
      `stats.minigame${i}`,
      'stats',
      ['Minigame records', 'Recordes de minijogos'],
      [en, pt],
      stats + 0x1ff + i * 4,
      'u32',
      { max: i === 1 ? 100 : 999999999 },
    );
  for (const [off, id, en, pt] of [
    [
      0xf4,
      'byGolfCart',
      'Distance by golf cart',
      'Distância de carrinho de golfe',
    ],
    [0xfc, 'byPlane', 'Distance by plane', 'Distância de avião'],
    [0xe4, 'onFoot', 'Distance on foot', 'Distância a pé'],
    [0xe8, 'byCar', 'Distance by car', 'Distância de carro'],
    [0xec, 'byBike', 'Distance by bike', 'Distância de moto'],
    [0xf0, 'byBoat', 'Distance by boat', 'Distância de barco'],
    [
      0xf8,
      'byHelicopter',
      'Distance by helicopter',
      'Distância de helicóptero',
    ],
  ] as const)
    add(
      `stats.${id}`,
      'stats',
      ['Distances (metres)', 'Distâncias (metros)'],
      [en, pt],
      stats + off,
      'f32',
      { min: 0, max: 1e9 },
    );
  const progress: Text = [
    'Reported progression (read-only)',
    'Progresso informado (somente leitura)',
  ];
  for (const [id, en, pt, p, type] of [
    ['packages', 'Hidden packages', 'Pacotes ocultos', pi + 0x13, 'u32'],
    ['packagesTotal', 'Total packages', 'Total de pacotes', pi + 0x17, 'u32'],
    [
      'current',
      'Progress units completed',
      'Unidades de progresso concluídas',
      stats + 0x78,
      'f32',
    ],
    [
      'total',
      'Total progress units',
      'Total de unidades de progresso',
      stats + 0x7c,
      'f32',
    ],
    [
      'jumps',
      'Unique jumps completed',
      'Saltos únicos concluídos',
      stats + 0xbc,
      'u32',
    ],
    [
      'jumpsTotal',
      'Total unique jumps',
      'Total de saltos únicos',
      stats + 0xc0,
      'u32',
    ],
    [
      'rampages',
      'Rampages completed',
      'Massacres concluídos',
      stats + 0x11c,
      'u32',
    ],
    [
      'rampagesTotal',
      'Total rampages',
      'Total de massacres',
      stats + 0x120,
      'u32',
    ],
    [
      'properties',
      'Properties owned',
      'Propriedades adquiridas',
      stats + 0x184,
      'u32',
    ],
  ] as const)
    add(`progress.${id}`, 'progress', progress, [en, pt], p, type, {
      readOnly: true,
    });
  for (let i = 0; i < 15; i++)
    add(
      `progress.property${i}`,
      'progress',
      ['Owned properties (Stats)', 'Propriedades adquiridas (Stats)'],
      propertyNames[i],
      stats + 0x190 + i,
      'u8',
      {
        readOnly: true,
        options: [
          option(0, 'Not owned', 'Não adquirida'),
          option(1, 'Owned', 'Adquirida'),
        ],
      },
    );
  return fields;
}
