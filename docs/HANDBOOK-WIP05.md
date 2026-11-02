# Atualização para Hero’s Handbook WIP v.05

Fonte recebida no Drive: **M&M4e.pdf**, título interno **Mutants & Masterminds
4E - Hero’s Handbook - WIP v.05**, revisão **28/10/2026**, 270 páginas.
SHA-256: `ce0996842cd153e627162eabece5cf718c4adf896441fb43c95036abda7074fa`.

O arquivo continua identificado como WIP, não como edição final. O livro e sua
extração integral ficam fora do repositório. O aplicativo mantém dados mecânicos,
resumos autorais e localizadores; as páginas indicadas são as físicas do PDF,
incluindo a capa. A paginação impressa é uma unidade menor.

## Alterações incorporadas

- Revisão atual `mm4e.heros-handbook.wip05`, data 2026-10-28, estado `wip`.
- Schema e envelope portátil 9. Importação de versões 1–8 permanece suportada.
- Fichas antigas mantêm revisão, custos, parâmetros, identificadores, vínculos,
  notas e condições armazenadas. Ausência de metadados identifica as prévias
  antigas, nunca a revisão nova automaticamente.
- A auditoria sinaliza revisão antiga; a Análise permite registrar adoção explícita
  sem reescrever os valores nem transformar erros em aprovação.
- Defender: ataques recebem dado de penalidade. Defesa Aprimorada acrescenta
  seu +2 separadamente. Fonte: PDF 222; vantagem no capítulo 5.
- Surpreso: Vulnerável e apenas ações livres; não aplica Atônito. Desatento para
  visão também causa Impedido. O rótulo genérico Hallucinating deixou a lista
  atual; Figment, Phantasm e Delusion permanecem. Valores antigos são preservados.
- Façanha de poder: uma graduação de recurso temporário em efeito não permanente;
  o custo de Esforço Extra também afeta quem é imune à fadiga ou não tem Vigor.
- Acerto crítico contra capanga: maior grau do efeito, sem resistência.
- Contrapor: alcance próximo e teste de efeito contra efeito, sem ataque contra
  Defesa como requisito do efeito-base. Percepção: ação simples na tabela.
- Impenetrável: extra +1/graduação, requer resistência Aprimorada e tem graduação
  limitada ao NP. A auditoria pede conferência quando não encontra o pré-requisito
  no mesmo efeito; benefícios externos permanecem sujeitos à revisão do Narrador.
- Novos recursos Indireto (até 4 graduações) e Descritor Variável (até 2).
- Novas configurações Fadiga e Imunidade Pessoal. A descrição de Fadiga usa o
  corpo do capítulo (PDF 124): 1 PP/graduação, alcance próximo; alcance à distância
  é opcional. A tabela de configurações contém uma inconsistência nessa linha.
- Sentido de Tremor: 2 PP; Visão de Raios X: 5 PP, conforme PDF 139.
- Volumes nas graduações 23–30 e extrapolação corrigidos conforme PDF 16/247.
- Fontes dos 144 tópicos e 16 grupos de catálogo atualizadas para os oito capítulos.

## Custos de equipamento corrigidos

Valores em PE. Novas escolhas usam o catálogo atualizado; valores antigos ficam
salvos e a auditoria mostra divergências em vez de sobrescrevê-los.

| Item | Antes | WIP v.05 | PDF |
| --- | ---: | ---: | ---: |
| Espada Gancho | 7 | 6 | 187 |
| Azagaia, corpo a corpo | 3 | 2 | 187 |
| Chicote | 5 | 6 | 187 |
| Boleadeiras | 8 | 4 | 189 |
| Granada de Fragmentação | 15 | 10 | 191 |
| Granada de Fumaça | 8 | 4 | 191 |
| Granada de Clarão | 12 | 8 | 191 |
| Granada de Luz e Som | 16 | 12 | 191 |
| Gás Sonífero | 12 | 8 | 191 |
| Gás Lacrimogêneo | 16 | 8 | 191 |
| Dinamite | 15 | 11 | 191 |
| Explosivo Plástico | 30 | 21 | 191 |
| Cota de Malha | 7 | 4 | 192 |
| Armadura de Placas | 12 | 7 | 192 |
| Armadura Completa | 15 | 9 | 192 |
| Carro | 10 | 11 | 200 |
| Viatura | 13 | 14 | 200 |
| Limusine | 14 | 13 | 200 |
| Caminhão | 15 | 14 | 200 |
| Carro Blindado | 23 | 22 | 200 |
| Tanque | 76 | 48 | 200 |
| Blindado de Transporte | 46 | 45 | 200 |
| Ônibus | 17 | 19 | 200 |
| Cavalo Mecânico | 18 | 20 | 200 |
| Jet Ski | 10 | 9 | 200 |
| Cúter | 37 | 47 | 200 |
| Encouraçado | 76 | 71 | 200 |
| Avião de Dois Lugares | 13 | 21 | 200 |
| Helicóptero Militar | 70 | 53 | 200 |
| Caça | 89 | 72 | 200 |
| Bombardeiro | 87 | 71 | 200 |
| Cruzador Espacial | 116 | 93 | 200 |
| Encouraçado Espacial | 139 | 98 | 200 |

## Critérios e limites

ATENDE: fonte identificada, preservação testada, migração explícita de revisão,
novos custos e parâmetros testados, localizadores dentro do PDF, traduções das
novas mensagens e exemplos de NP 8/10/12 preservados.

NÃO SE APLICA: edição final, novos serviços, contas, mudança de identidade visual,
redistribuição do livro e reconstrução de fichas existentes.

A automação mantém o escopo do gerenciador de fichas. Regras de condução de cenas,
interpretação e escolhas dependentes do Narrador continuam como referências.
As divergências ainda presentes entre tamanho e queda permanecem explicitadas;
não são resolvidas por uma fórmula inventada. Testes numéricos não certificam
todas as decisões possíveis de uma partida ou revisão editorial futura.

## Validação da implementação

- 84 testes locais passaram, incluindo novos casos de migração, custo,
  extrapolação, condições e pré-requisitos.
- Lint, TypeScript e build de produção passaram.
- A instalação local do Chromium recebeu um ZIP truncado do provedor de download.
  A suíte E2E local não foi executada e não é apresentada como aprovada.
