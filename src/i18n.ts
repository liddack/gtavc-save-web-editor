import type { Locale, Text } from './core/catalogs';
export const copy = {
  repository: ['Source code on GitHub', 'Código-fonte no GitHub'],
  subtitle: [
    'Classic PC Retail · independent editor',
    'PC clássico Retail · editor independente',
  ],
  preview: [
    'Preview · partial game validation',
    'Prévia · validação parcial no jogo',
  ],
  local: [
    'Your save stays in this browser. No uploads.',
    'Seu save fica neste navegador. Sem uploads.',
  ],
  open: ['Open a save', 'Abrir um save'],
  replace: ['Open another save', 'Abrir outro save'],
  title: ['A fresh start for your save.', 'Uma nova fase para o seu save.'],
  intro: [
    'Inspect and edit your classic Vice City save, then download a separate copy. The original file stays untouched.',
    'Consulte e edite seu save do Vice City clássico, depois baixe uma cópia separada. O arquivo original fica intacto.',
  ],
  select: ['Choose GTAVCsf1.b', 'Selecionar GTAVCsf1.b'],
  drop: ['or drop your .b file here', 'ou solte seu arquivo .b aqui'],
  supported: [
    'Supported: classic PC Retail .b saves. Steam, mobile and Definitive Edition are not supported.',
    'Suporte: saves .b do PC clássico Retail. Steam, mobile e Definitive Edition não são compatíveis.',
  ],
  basics: ['01 / Open locally', '01 / Abra localmente'],
  basicsBody: [
    'File structure and checksum are verified before editing.',
    'A estrutura e o checksum são verificados antes de editar.',
  ],
  editStep: ['02 / Make it yours', '02 / Edite do seu jeito'],
  editBody: [
    'Player, weapons, world, garages, gangs, spawns and statistics.',
    'Jogador, armas, mundo, garagens, gangues, spawns e estatísticas.',
  ],
  exportStep: ['03 / Review & download', '03 / Revise e baixe'],
  exportBody: [
    'See each change before exporting a validated copy.',
    'Confira cada alteração antes de exportar uma cópia validada.',
  ],
  player: ['Player', 'Jogador'],
  weapons: ['Weapons', 'Armas'],
  world: ['World & save', 'Mundo e save'],
  garages: ['Garages', 'Garagens'],
  gangs: ['Gangs', 'Gangues'],
  spawns: ['Vehicle spawns', 'Spawns de veículos'],
  stats: ['Statistics', 'Estatísticas'],
  progress: ['Progress', 'Progresso'],
  review: ['Review & export', 'Revisar e exportar'],
  playerHint: [
    'Persistent attributes and position. Coordinates are advanced: choose a location clear of buildings and water.',
    'Atributos persistentes e posição. Coordenadas são avançadas: escolha um local fora de prédios e da água.',
  ],
  weaponsHint: [
    'One weapon per slot. Weapon changes also reset firing state and clip ammunition; total ammunition is preserved unless you change it.',
    'Uma arma por slot. Trocar a arma também reinicia o estado de disparo e a munição no pente; a munição total é preservada, a menos que você a altere.',
  ],
  worldHint: [
    'Clock, weather and the name shown in the slot menu. Choose natural cycle to release forced weather.',
    'Relógio, clima e nome exibido no menu. Escolha ciclo natural para liberar o clima forçado.',
  ],
  garagesHint: [
    'Replace or remove existing stored vehicles. Empty records are read-only. Vehicle slots are internal records, not named safehouses.',
    'Substitua ou remova veículos guardados. Registros vazios são somente leitura. Os slots são registros internos, sem nomes de esconderijos.',
  ],
  gangsHint: [
    'Advanced: changes may be overridden by mission scripts. Unknown original IDs are preserved.',
    'Avançado: scripts de missões podem sobrescrever as alterações. IDs originais desconhecidos são preservados.',
  ],
  spawnsHint: [
    'Advanced: edit existing generators only. Internal entity handles and generator counts remain intact.',
    'Avançado: edite apenas geradores existentes. Referências internas de entidades e contadores de geradores são preservados.',
  ],
  statsHint: [
    'These fields edit recorded statistics. They do not reset challenges, complete activities or grant rewards. The time used by a challenge may be stored separately from Stats.',
    'Estes campos alteram estatísticas registradas. Não reiniciam desafios, concluem atividades ou concedem recompensas. O tempo usado pelo desafio pode ser armazenado separadamente de Stats.',
  ],
  progressHint: [
    'These values report progress; they are not a mission checklist. Campaign editing is locked except for the verified Cone Crazy reset below.',
    'Estes valores informam progresso; não são uma lista de missões. A edição da campanha permanece bloqueada, exceto pelo reset validado do Cone Crazy abaixo.',
  ],
  statsRecordNotice: [
    'You changed a statistics entry, not a challenge reset. In Cone Crazy, clearing the Stats time does not clear the time to beat. Challenge script state is preserved.',
    'Você alterou uma estatística, não um reset do desafio. No Cone Crazy, zerar o tempo de Stats não apaga o tempo a vencer. O estado dos scripts do desafio é preservado.',
  ],
  search: [
    'Search fields, records or models',
    'Buscar campos, registros ou modelos',
  ],
  record: ['Record', 'Registro'],
  noResults: ['No matching fields.', 'Nenhum campo encontrado.'],
  readonly: ['Read-only', 'Somente leitura'],
  original: ['Original', 'Original'],
  modified: ['Modified', 'Alterado'],
  undo: ['Undo', 'Desfazer'],
  redo: ['Redo', 'Refazer'],
  restore: ['Restore original', 'Restaurar original'],
  changes: ['changes', 'alterações'],
  change: ['change', 'alteração'],
  before: ['Before', 'Antes'],
  after: ['After', 'Depois'],
  field: ['Field', 'Campo'],
  remove: ['Revert', 'Reverter'],
  noChanges: [
    'No changes yet. Exporting now produces an exact copy of the original.',
    'Nenhuma alteração. Exportar agora produz uma cópia idêntica ao original.',
  ],
  reviewHint: [
    'Review the changes below. Keep a backup and test the exported file in a separate game slot.',
    'Revise as alterações abaixo. Guarde uma cópia de segurança e teste o arquivo exportado em um slot separado do jogo.',
  ],
  linked: [
    'Related bytes are updated automatically: displayed money mirrors money; weapon state and clip ammunition follow weapon edits.',
    'Bytes relacionados são atualizados automaticamente: o dinheiro exibido acompanha o saldo; estado e munição no pente acompanham as edições de armas.',
  ],
  download: ['Download edited save', 'Baixar save editado'],
  exactCopy: ['Download exact copy', 'Baixar cópia idêntica'],
  backup: ['Download original backup', 'Baixar backup original'],
  byteChanges: [
    'bytes will change, including the checksum.',
    'bytes serão alterados, incluindo o checksum.',
  ],
  exportOk: [
    'Download prepared. Reimport the file to check your edits.',
    'Download preparado. Reimporte o arquivo para conferir suas edições.',
  ],
  invalidEdits: [
    'Resolve the highlighted fields before exporting.',
    'Corrija os campos destacados antes de exportar.',
  ],
  loadError: [
    'Could not open this file. Your current document, if any, was kept.',
    'Não foi possível abrir este arquivo. O documento atual, se houver, foi mantido.',
  ],
  reading: ['Reading file…', 'Lendo arquivo…'],
  readError: ['File could not be read.', 'Não foi possível ler o arquivo.'],
  discard: [
    'Replace the current save and discard its edits?',
    'Substituir o save atual e descartar as edições?',
  ],
  confirmReplace: ['Replace save', 'Substituir save'],
  cancel: ['Cancel', 'Cancelar'],
  integrity: ['Integrity', 'Integridade'],
  valid: [
    'Structure and checksum verified',
    'Estrutura e checksum verificados',
  ],
  format: ['Format', 'Formato'],
  size: ['Size', 'Tamanho'],
  mission: ['Save title', 'Título do save'],
  blocks: ['Data blocks', 'Blocos de dados'],
  checksum: ['Checksum', 'Checksum'],
  compatibility: [
    'Retail layout, compatible candidate for classic PC. The save cannot identify executable 1.0 versus 1.1 or exclude compatible ports.',
    'Layout Retail, candidato compatível com PC clássico. O save não identifica executável 1.0 ou 1.1 nem exclui ports compatíveis.',
  ],
  notice: [
    'Binary validation passed. In-game verification covers the supported Cone Crazy reset; other edits may need testing.',
    'Validação binária aprovada. A validação no jogo cobre o reset do Cone Crazy suportado; outras edições podem precisar de teste.',
  ],
  independent: [
    'Independent open source project. Not affiliated with or endorsed by Rockstar Games or Take-Two.',
    'Projeto independente e de código aberto. Sem afiliação ou endosso da Rockstar Games ou Take-Two.',
  ],
  privacy: [
    'Processing is in memory. Closing or reloading this page discards the save and edits. Only your language preference is stored.',
    'O processamento ocorre na memória. Fechar ou recarregar a página descarta o save e as edições. Apenas sua preferência de idioma é armazenada.',
  ],
  knownUnknown: ['Unknown original ID', 'ID original desconhecido'],
  bytes: ['bytes', 'bytes'],
  progressPercent: ['Reported completion', 'Conclusão informada'],
  sizeError: [
    'Expected a 201,828-byte classic Retail save.',
    'Esperado um save Retail clássico de 201.828 bytes.',
  ],
} satisfies Record<string, Text>;
export type CopyKey = keyof typeof copy;
export const translate = (key: CopyKey, lang: Locale) =>
  copy[key][lang === 'pt' ? 1 : 0];
export const diagnostic: Record<string, Text> = {
  size: copy.sizeError,
  checksum: [
    'Checksum mismatch. Editing is blocked.',
    'Checksum divergente. Edição bloqueada.',
  ],
  steam: [
    'Steam layout detected. This release supports Retail only.',
    'Layout Steam detectado. Esta versão suporta somente Retail.',
  ],
  format: ['Unrecognised save format.', 'Formato de save não reconhecido.'],
  blocks: ['Invalid block boundaries.', 'Limites dos blocos inválidos.'],
  layout: [
    'Internal structures do not match the supported Retail layout.',
    'Estruturas internas não correspondem ao layout Retail suportado.',
  ],
  scripts: [
    'Unrecognised script block layout.',
    'Layout do bloco de scripts não reconhecido.',
  ],
};
export const validation: Record<string, Text> = {
  readonly: [
    'This field cannot be edited.',
    'Este campo não pode ser editado.',
  ],
  name: [
    'Use 1–23 plain ASCII characters, without ~ codes.',
    'Use 1–23 caracteres ASCII simples, sem códigos ~.',
  ],
  number: [
    'Enter a finite number; counters must be integers.',
    'Informe um número finito; contadores precisam ser inteiros.',
  ],
  range: [
    'Value outside the allowed range.',
    'Valor fora do intervalo permitido.',
  ],
  option: ['Choose a supported value.', 'Escolha um valor suportado.'],
  maximum: [
    'Current value must not exceed its maximum.',
    'O valor atual não pode ultrapassar o máximo.',
  ],
  slot: [
    'Weapon does not belong to this slot.',
    'A arma não pertence a este slot.',
  ],
  emptyWeapon: [
    'An empty weapon slot must have zero ammunition.',
    'Um slot vazio precisa ter munição zero.',
  ],
  detonator: [
    'Remote grenades require a detonator in slot 9.',
    'Granadas remotas exigem um detonador no slot 9.',
  ],
  delay: [
    'Minimum delay must not exceed maximum delay.',
    'O intervalo mínimo não pode ultrapassar o máximo.',
  ],
};

export const coneText = {
  title: ['Reset the complete challenge', 'Reiniciar o desafio completo'],
  intro: [
    'Reset the record, first completion, tutorial, checkpoint allowance and reward. Verified in the supported reVC/Retail WASM script profile.',
    'Reinicia recorde, primeira conclusão, instruções, bônus por checkpoint e premiação. Validado no perfil de script reVC/Retail WASM suportado.',
  ],
  gameFile: ['Game data or main.scm', 'Dados do jogo ou main.scm'],
  chooseGame: [
    'Verify game .data or main.scm',
    'Verificar .data ou main.scm do jogo',
  ],
  replaceGame: ['Verify another game file', 'Verificar outro arquivo do jogo'],
  checking: ['Checking game script…', 'Verificando script do jogo…'],
  verified: ['Compatible script verified', 'Script compatível verificado'],
  unverified: [
    'Select the file from the game you play',
    'Selecione o arquivo do jogo que você utiliza',
  ],
  local: [
    'The file is checked locally, stays in memory and is never uploaded or stored. Game verification is required again when you open another save.',
    'O arquivo é verificado localmente, fica na memória e não é enviado nem armazenado. Ao abrir outro save, verifique o jogo novamente.',
  ],
  record: ['Challenge record', 'Recorde do desafio'],
  cleared: [
    'cleared (initial comparison: 120 s)',
    'apagado (referência inicial: 120 s)',
  ],
  bonus: ['Checkpoint allowance', 'Bônus por checkpoint'],
  reward: ['Initial reward', 'Premiação inicial'],
  progress: ['Completion units', 'Unidades de conclusão'],
  consequence: [
    'One completion credit is removed and earned again on the next first win, preventing duplicate progress. Current money and other challenges are preserved.',
    'Um crédito de conclusão é removido e recuperado na próxima primeira vitória, evitando progresso duplicado. O dinheiro atual e os outros desafios são preservados.',
  ],
  queue: [
    'Prepare full Cone Crazy reset',
    'Preparar reset completo do Cone Crazy',
  ],
  queued: ['Reset added to changes', 'Reset adicionado às alterações'],
  review: ['Full Cone Crazy reset', 'Reset completo do Cone Crazy'],
} satisfies Record<string, Text>;
const coneErrors: Record<string, Text> = {
  verifyGame: [
    'Verify the game .data or main.scm before resetting.',
    'Verifique o .data ou main.scm do jogo antes de reiniciar.',
  ],
  gameProfile: [
    'This game script does not match the validated profile. Select its original .data or main.scm; other profiles cannot be reset.',
    'Este script não corresponde ao perfil validado. Selecione o .data ou main.scm original; outros perfis não permitem reset.',
  ],
  saveProfile: [
    'This save has an unsupported script layout. The reset is unavailable.',
    'O layout de script deste save não é suportado. O reset está indisponível.',
  ],
  activeChallenge: [
    'Exit Cone Crazy and save outside the challenge before resetting.',
    'Saia do Cone Crazy e salve fora do desafio antes de reiniciar.',
  ],
  notCompleted: [
    'Cone Crazy is not marked as completed in this save. No completion credit will be removed.',
    'O Cone Crazy não está marcado como concluído neste save. Nenhum crédito de conclusão será removido.',
  ],
  completionCredit: [
    'The completion count is inconsistent; resetting is blocked.',
    'O total de conclusão está inconsistente; o reset está bloqueado.',
  ],
  resetConflict: [
    'Remove the separate Cone Crazy Stats edit or undo the reset.',
    'Remova a edição separada de Stats do Cone Crazy ou desfaça o reset.',
  ],
  resetValue: ['Invalid reset operation.', 'Operação de reset inválida.'],
  gameSize: [
    'Select a game .data or main.scm up to 256 MiB.',
    'Selecione um .data ou main.scm do jogo de até 256 MiB.',
  ],
  secureContext: [
    'Use HTTPS or localhost to verify the game file securely.',
    'Use HTTPS ou localhost para verificar o arquivo do jogo.',
  ],
  gameRead: [
    'Could not read or verify the game file. Try selecting it again.',
    'Não foi possível ler ou verificar o arquivo do jogo. Selecione-o novamente.',
  ],
};
export const coneErrorText = (code: string, lang: Locale) =>
  (coneErrors[code] ?? coneErrors.gameRead)[lang === 'pt' ? 1 : 0];
