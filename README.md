# Vice City Save Workshop

> **Aviso:** este projeto foi inteiramente desenvolvido com ajuda de inteligência artificial (IA).

[English](docs/README.en.md)

Editor independente de saves do **GTA Vice City clássico PC Retail**, executado inteiramente no navegador e preparado para GitHub Pages. Código original sob MIT.

**Prévia: validação binária automatizada e validação manual parcial do reset de Cone Crazy; veja [evidências e pendências](docs/VALIDATION.md).** Não há suporte a Steam, mobile, Definitive Edition ou conversões. O layout não identifica o executável 1.0 versus 1.1 nem comprova a origem de ports compatíveis.

## Executar

Requer Node.js 22.12+ (recomendado 24) e npm.

```sh
npm ci
npm run dev
```

Abra o endereço informado pelo Vite, selecione seu `GTAVCsf#.b`, edite por área, revise e baixe uma cópia. O nome do slot é preservado quando válido. Guarde o original e teste em um slot separado. Para mudar de slot, renomeie a cópia para `GTAVCsf2.b`, por exemplo.

## Funções

- Jogador: dinheiro, vida, colete, limites, benefícios persistentes e posição.
- Armas: seleção por slot e munição; estado e pente são ajustados em conjunto.
- Mundo: relógio, clima e nome do save (ASCII simples, 1–23 caracteres).
- Garagens: substituição e remoção de veículos existentes, cores, posição e máscara de proteção. Slots vazios são somente leitura.
- Gangues: modelos e armas. Geradores: configuração dos registros existentes.
- Estatísticas: contadores, distâncias e recordes documentados. Alterar estatísticas não concede recompensas, conclui missões ou reinicia desafios. O tempo de Cone Crazy (antes chamado “Recorde 20”) edita somente Stats; zerá-lo não apaga o tempo a vencer no desafio.
- Progresso: propriedades identificadas e indicadores somente para consulta. Reset completo do Cone Crazy disponível para o perfil de script validado, após verificação local do jogo. Demais edições de campanha continuam indisponíveis.
- Português/inglês, revisão antes/depois, desfazer/refazer e restauração do original.

IDs e valores originais desconhecidos permanecem intactos. Novos valores são limitados aos campos e opções suportados. Modificações de scripts, mapas e modelos do jogo não são suportadas. Alterações de scripts de missões podem sobrescrever configurações de gangues e geradores.

## Reset do Cone Crazy

1. Abra seu save e entre em **Progresso**.
2. Selecione o `.data` do seu jogo WASM ou seu `main.scm` em **Verificar .data ou main.scm do jogo**. Tudo é processado no navegador; nenhum arquivo é enviado.
3. Com o perfil reconhecido, escolha **Preparar reset completo do Cone Crazy**.
4. Revise o reset e as demais edições e baixe a cópia. Desfazer/refazer e restaurar original também abrangem o reset.

O reset restaura primeira conclusão, recorde, instruções, bônus de 12 s e prêmio inicial de $200. Um crédito de conclusão é removido e recuperado na primeira vitória seguinte; o saldo atual é preservado. Apenas o script validado é aceito, verificado pelos fingerprints de MAIN e da missão. Ao abrir outro save, verifique o arquivo do jogo novamente. Salvar durante o desafio bloqueia o reset. Definir o tempo em Estatísticas como zero continua sendo uma edição apenas de Stats.

Os 23 recordes, 15 propriedades e categorias de personagens agora têm nomes identificados. A volta mais rápida do Hotring usa milissegundos; os demais recordes usam segundos. Veja [auditoria de nomes, tipos e unidades](docs/SOURCE-AUDIT.md).

## Privacidade

O arquivo é lido e processado na memória do navegador, sem upload ou analytics. Apenas o idioma é persistido. Fechar ou recarregar a página descarta o documento e as alterações. Não há autosave nem service worker. GitHub Pages ainda recebe as requisições HTTP normais para servir o site; isso não inclui o conteúdo dos saves.

## Verificação

```sh
npm run check
npx playwright install chromium
npm run test:e2e
RETAIL_SAVE_PATH=/caminho/GTAVCsf1.b npm run test:local
npm run prepare:manual
```

O teste local é opcional e não envia o save. Por conveniência, também procura `/private/tmp/Downloads/GTAVCsf1.b`. Arquivos `.b`, `.sav`, resultados e `.local/` são ignorados pelo Git. As fixtures públicas são estruturas sintéticas, sem scripts ou assets do jogo, e não são saves jogáveis.

Veja [evidências e limitações da validação](docs/VALIDATION.md), [formato e procedência](docs/FORMAT.md) e [roteiro manual](docs/MANUAL-TESTS.md). Contribuições de novos campos devem incluir fonte, validações, testes de isolamento binário e resultado no jogo.

## GitHub Pages

1. Inicialize um repositório (`git init -b main`) se necessário e publique estes arquivos em um repositório público no GitHub com a branch `main`.
2. Em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**.
3. Execute **Publish preview to GitHub Pages** em **Actions**. O workflow testa e publica o mesmo build validado.

O build usa caminhos relativos e funciona em `https://usuario.github.io/repositorio/`. A publicação é manual para permitir validar o save no jogo antes de promover uma versão. O workflow **Validate** roda em PRs e pushes em `main`. Em uma regressão, execute o workflow de publicação em um commit/branch de uma versão anterior validada.

## Licenças e independência

MIT cobre o código original deste projeto. Dependências mantêm suas licenças. Referências e atribuições estão em [NOTICE.md](NOTICE.md). Nenhum executável, script extraído, música, imagem ou modelo do jogo é distribuído.

GTA e Vice City pertencem aos respectivos titulares. Este projeto não é afiliado nem endossado por Rockstar Games ou Take-Two. A licença do editor não concede direitos sobre o jogo nem representa autorização de seus titulares ou garantia jurídica.
