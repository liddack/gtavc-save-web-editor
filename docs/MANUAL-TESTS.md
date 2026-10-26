# Validação no jogo / In-game verification

Status: **pendente / pending**. Fixtures sintéticas não são jogáveis. Use cópias do save real e um jogo PC clássico Retail legitimamente disponível. Há validação parcial informada pelo usuário para o reset do Cone Crazy (47 s e depois 42 s, com duplicação do prêmio); consulte [as evidências e pendências](CONE-CRAZY.md#owner-runtime-result-2026-10-26). Os demais casos seguem pendentes.

1. Guarde o original fora da pasta usada pelo jogo. Anote versão do executável, mods e sistema operacional. / Back up the original and record executable version, mods and OS.
2. Exporte sem editar. Compare SHA-256 com o original e carregue a cópia. / Export without edits, compare SHA-256 and load the copy.
3. Use uma cópia independente para cada linha abaixo. Não acumule alterações entre testes. / Use a separate original-based copy for each row.
4. Renomeie a cópia para um slot livre, carregue, confira efeitos, salve no jogo e reimporte o novo arquivo. / Use a free slot, load, inspect effects, save in-game and reimport.

| Grupo / Group             | Conferir / Check                                                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dinheiro / Money          | Saldo e exibição iguais, compra e novo salvamento / Balance, display, purchase and resave                                                                                         |
| Vida/colete / Attributes  | Valores e máximos, dano e recarga / Values, maxima, damage and refill                                                                                                             |
| Benefícios / Benefits     | Cada flag separadamente / Each flag individually                                                                                                                                  |
| Armas / Weapons           | Cada slot, munição, pente, disparo, recarga, troca, remoção, granada remota e detonador / Every slot, ammo, clip, fire, reload, switch, removal, remote grenade and detonator     |
| Posição / Position        | Local seguro, sem água, interiores ou colisões / Clear exterior location, no water or collisions                                                                                  |
| Relógio/clima / World     | Hora, transição, clima forçado e liberação / Clock, transitions, forced and natural weather                                                                                       |
| Nome / Title              | Exibição no menu e recarregamento / Slot menu and reload                                                                                                                          |
| Garagens / Garages        | Abrir garagem, veículo/cor/proteções, saída e novo salvamento; testar remoção separada / Vehicle, colour, protections, driving, resave and separate removal                       |
| Gangues / Gangs           | Modelos e armas em área correspondente; observar sobrescrita por scripts / Corresponding area, weapons/models, script overrides                                                   |
| Geradores / Generators    | Modelo, cor, posição, orientação, intervalos e ativação; observar veículo já existente / Model, colour, coordinates, heading, intervals, activation and existing spawned vehicles |
| Estatísticas / Statistics | Menu de estatísticas e persistência; confirmar que recompensas não são presumidas / Menu, persistence and no assumed rewards                                                      |

Para cada caso, registrar em uma issue: commit, campo/valor anterior/novo, executável, carregamento, efeito observado, novo salvamento e reimportação. / Record commit, before/after, executable, load, observed effect, resave and reimport in an issue.

Não marcar funções como validadas no jogo a partir de checksum ou testes sintéticos. Edição da campanha permanece bloqueada até existir um mapa de dependências e testes completos por ação. / Binary checks do not establish runtime validity. Campaign editing stays locked until per-action dependencies and runtime tests exist.
