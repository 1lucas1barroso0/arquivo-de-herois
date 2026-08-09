# Arquitetura

O Arquivo de Heróis é um aplicativo React 19/Next.js App Router. Ele pode usar persistência de servidor quando o ambiente oferece D1/R2 ou funcionar de modo autônomo no navegador.

## Fluxo de dados

```text
Navegador/PWA
  ├─ biblioteca e editor React
  ├─ IndexedDB + imagens locais quando não há bindings
  └─ API HTTP quando disponível
       ├─ D1: fichas privadas e instantâneos públicos
       └─ R2: retratos
```

Com D1 disponível, o servidor é a fonte de verdade e o armazenamento local mantém rascunhos interrompidos. Sem bindings persistentes, a interface detecta a indisponibilidade e usa IndexedDB como fonte de verdade no dispositivo; nesse modo, retratos são guardados como dados locais.

## Compartilhamento permanente

Ao publicar uma ficha, o servidor cria um token estável e um registro independente em `shared_sheets`. A ficha pública:

- não depende da existência posterior do original;
- mantém o mesmo endereço nas atualizações;
- nunca recebe o identificador privado do proprietário;
- pode ser copiada por qualquer visitante para uma nova ficha editável.

No modo autônomo, o compartilhamento gera um endereço portátil comprimido. Esse endereço contém a ficha normalizada, abre em `/share`, pode ser importado em outro dispositivo e não depende de banco de dados.

O endpoint público não usa o cache do service worker. Assim, uma atualização publicada não é substituída silenciosamente por uma resposta antiga.

## Cálculos e auditoria

`lib/rules.ts` concentra cálculos, custos, derivações e auditoria. Editor, biblioteca, impressão e exportação consomem as mesmas funções, evitando fórmulas concorrentes. Os estados têm semântica deliberada:

- verde: a regra foi comprovada como atendida ou um aviso foi aprovado conscientemente;
- vermelho: existe uma violação objetiva ou um aviso foi reprovado;
- amarelo: o aviso continua aguardando decisão;
- azul: regra mais liberal disponível ao Narrador e aos seus NPCs, como orçamento e limites de NP informativos.

Somente avisos originalmente amarelos aceitam decisão manual. A aprovação ou reprovação guarda uma impressão exata do conteúdo conferido; se o campo que originou o aviso mudar, a decisão anterior deixa de valer e o aviso volta automaticamente ao amarelo. Erros objetivos e regras azuis não podem ser sobrescritos por esse mecanismo.

`lib/catalog.ts` contém as opções do material disponível, e `lib/power-configurations.ts` transforma configurações prontas em efeitos calculáveis. Chaves estáveis separam a identidade da opção de seu texto visível e preservam a liberdade de criar variantes personalizadas.

Vínculos de efeitos distinguem bônus por graduação, bônus fixos e referências sem bônus. O terceiro modo representa modificadores como Aprimorada ou Impenetrável aplicados a graduações de resistência já compradas, evitando cobrar ou somar a resistência duas vezes.

`lib/guided.ts` aplica apenas correções determinísticas no Modo Assistido. Ele não escolhe poderes, não gasta PP restantes e não reescreve conteúdo autoral. Regras próprias permanecem disponíveis no Modo Livre e continuam visíveis na auditoria.

`lib/example-sheets.ts` gera os modelos didáticos pela mesma estrutura usada no editor. A suíte de testes exige Espectro Rubro NP 8/120 PP, Sentinela Solar NP 10/150 PP e Atlas Zero NP 12/180 PP, todos com auditoria integralmente verde; assim, as fichas de exemplo não podem divergir silenciosamente da base de cálculo.

`lib/rule-reference.ts` distingue regras calculadas, coerências mantidas pelo modo assistido e decisões de mesa. `lib/detailed-rule-reference.ts` acrescenta condições, ações, cenas, perigos e características com resumos bilíngues e procedência por capítulo/página. `lib/reference-catalog.ts` reúne em um único índice todas as opções e sugestões do material disponível e liga cada grupo à sua fonte. `lib/calculators.ts` resolve testes graduados, rotina e resistência a dano; `lib/scales.ts` relaciona tamanho, velocidade, tempo, distância, Força e massa. As Referências usam essas fontes apenas quando abertas, mantendo o fluxo principal enxuto.

A matriz auditável da compilação fornecida fica em `docs/4E-COVERAGE.md`. Ela separa cobertura do material recebido de qualquer afirmação sobre publicações posteriores.

## Portabilidade

`lib/portable.ts` define o formato versionado `arquivo-de-herois`. JSON e TXT carregam a mesma ficha normalizada; o TXT mantém uma seção legível e uma linha final completa para reimportação sem perda. `lib/portable-share.ts` compacta esse mesmo pacote em links autocontidos.
