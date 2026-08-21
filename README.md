# Arquivo de Heróis

Aplicativo full-stack, instalável e responsivo para criar, conferir, salvar e compartilhar fichas de **Mutantes & Malfeitores: Quarta Edição**.

A versão 1.0.1 cobre de forma estruturada a compilação fornecida **M&M4e Previews 1–9 editadas** (431 páginas), sempre mantendo o produto como um gerenciador de fichas. O aplicativo identifica esse material como prévia: não afirma incorporar uma edição final posterior que não esteja nas fontes do projeto.

## O que está pronto

- Editor completo com identidade, atributos, combate, resistências, perícias, vantagens, poderes, ataques, equipamentos, complicações, recursos, movimento, sentidos, relações, organizações e Pontos de Poder.
- Modos Rápido, Guiado e Livre sobre a mesma ficha e o mesmo motor. É possível trocar de modo sem conversão nem perda; o fluxo guiado cobre conceito, NP, atributos, perícias, vantagens, poderes, defesas, complicações, revisão e finalização.
- Catálogos pesquisáveis organizados a partir do material disponível: 18 perícias, 101 vantagens, 47 efeitos, 110 configurações prontas de poderes, 63 modificadores, 182 itens de equipamento, 28 opções narrativas, 15 arquétipos e 6 origens.
- Preenchimento assistido: escolher uma opção do catálogo configura custos, ataques, CD, vínculos, orçamento de Equipamento e valores dependentes; qualquer entrada pode ser personalizada sem perder dados.
- Modo Assistido como padrão: corrige apenas dependências determinísticas, mantém matrizes exclusivas coerentes, cobre PE, limita usos aos recursos realmente comprados e impede a publicação de uma ficha com erro ou pendência. O Modo Livre é uma escolha explícita para regras próprias.
- Uma única base de cálculo para custos, dependências, limites de NP e auditoria: verde confirma a regra ou uma aprovação consciente; amarelo pode ser mantido, aprovado ou reprovado; vermelho reúne erros objetivos e reprovações; azul identifica regras mais liberais para o Narrador e seus NPCs.
- Dashboard com recentes, favoritos, campanhas, NPCs, fichas incompletas, alertas e atalhos de RPG; busca universal por fichas, campanhas, regras, opções e notas.
- Campanhas para reunir fichas, equipes, organizações, locais, recursos, encontros e notas, com exclusão segura sem apagar fichas vinculadas. Relações entre fichas cobrem aliados, inimigos, rivais, mentores, parceiros, invocações, formas, veículos, bases e constructos.
- Modo de jogo separado dos valores-base, com dano, condições, Pontos Heroicos, Sorte, penalidades, recursos temporários, efeitos ativos e poderes sustentados; restaurar a sessão não altera a construção.
- Histórico de versões, desfazer/refazer, duplicação, arquivamento, favoritos e backup completo de fichas e campanhas. A importação de backup valida o conjunto e cria cópias com todos os vínculos remapeados.
- Ferramentas do Narrador com modelos editáveis de NPC, condições e uma estimativa auxiliar de encontros, sempre identificada como opcional e não oficial.
- Painel numérico da construção, comparação sem previsão de vencedor e impressão completa ou compacta para A4/PDF.
- Três fichas didáticas mecanicamente distintas — Espectro Rubro NP 8/120 PP, Sentinela Solar NP 10/150 PP e Atlas Zero NP 12/180 PP — com pontos, ataques, resistências, perícias, matrizes e equipamentos auditados automaticamente.
- Referências pesquisáveis com 145 tópicos de regra e fonte por documento, capítulo e página: 38 condições, 29 ações, 25 perigos ambientais, 4 tipos de cena e 49 regras gerais ou de características. Todos os 625 itens do catálogo também indicam a seção de origem.
- Traços ausentes e tamanho natural integrados à ficha: custo, travessão, falhas automáticas, consequências derivadas, permissão do Narrador, migração sem perda e a tabela completa de tamanho −5 a 5.
- Escalas de atributos, perícias, CDs, NP, efeitos e medidas, com calculadoras de testes graduados, rotina, resistência a dano, percurso, duração de viagem e arremesso. Fórmulas abertas continuam sem teto artificial quando a fonte estabelece extrapolação.
- Interface global em português brasileiro e inglês, com chaves estáveis independentes dos textos traduzidos. A busca ignora acentos, tolera plurais e pequenos erros de digitação; nomes, categorias e descrições das opções acompanham o idioma escolhido.
- Salvamento automático no D1 e retratos no R2 quando esses recursos existem. Em outros ambientes, a aplicação muda automaticamente para IndexedDB e imagens locais, sem interromper o trabalho.
- Biblioteca pesquisável, ordenável e navegável por rolagem, com visualização completa e impressão em PDF.
- Links permanentes no modo servidor e links portáteis autocontidos no modo local; qualquer visitante pode abrir, exportar ou salvar uma cópia editável.
- Importação universal por arquivo, arrastar e soltar, conteúdo colado ou link compartilhado.
- Exportações JSON e TXT versionadas, portáteis e reimportáveis sem perda, além de backup integral do arquivo.
- PWA com ícones próprios, atalhos, tela offline, aviso de atualização e instruções específicas para instalação no iPhone/iPad. A troca de versão espera o service worker assumir o controle e nunca apaga IndexedDB nem recarrega com alterações pendentes.
- Interface ultra-clean em português brasileiro, com listas auxiliares recolhidas até serem solicitadas, navegação por teclado, alvos adaptados ao toque, tema claro sereno como padrão e opções escura e automática derivadas da paleta do ícone.

## Começar

Requisitos: Node.js 22.13 ou mais recente.

```bash
npm ci
npm run dev
```

No desenvolvimento local, as fichas e imagens ficam no próprio navegador por
IndexedDB. Os endpoints de persistência de servidor são opcionais e entram em
ação quando o adaptador de implantação fornece os bindings `DB` e `BUCKET`.

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test:rules
npm run build
```

Os testes cobrem integridade e completude dos catálogos e das Referências, procedência por página, termos bilíngues, tamanho natural, traços ausentes, escalas abertas, testes graduados, dano, relações entre medidas, configurações prontas, propagação de atributos, vantagens e equipamentos, ataques vinculados, custos, valores muito altos, frações e modificadores de poderes, Removível, matrizes, limites de NP, decisões persistentes sobre avisos, recursos heroicos, três modos de criação, exemplos NP 8/10/12, NPCs, campanhas, relações, encontros, sessão, histórico, backups, busca universal, migrações v1–v7, PWA, responsividade e ida e volta dos formatos JSON/TXT.

## Estrutura

```text
app/                  páginas, manifest e APIs
components/           biblioteca, editor, visualização e PWA
db/                   esquema e persistência D1
drizzle/              migrações SQL versionadas
lib/                  catálogos, tipos, cálculos, normalização, regras e portabilidade
public/               ícones, service worker e arte de demonstração
tests/                testes das regras, dos cálculos e dos formatos
docs/                 arquitetura, deploy e formato de dados
```

Leia [Cobertura da 4E](docs/4E-COVERAGE.md), [Arquitetura](docs/ARCHITECTURE.md), [Implantação](docs/DEPLOYMENT.md) e [Formato de dados](docs/DATA-FORMAT.md).

## Implantação

O projeto usa os comandos padrão do Next.js:

```bash
npm ci
npm run build
npm run start
```

Sem um adaptador de persistência, a aplicação continua utilizável no modo local.
Para fichas permanentes no servidor e retratos compartilhados, configure um
adaptador que exponha os bindings compatíveis descritos em
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Dados e privacidade

Quando o host fornece uma identidade autenticada, as fichas são separadas por conta. Em instalações sem autenticação integrada, um identificador aleatório do dispositivo define o arquivo pessoal. Links públicos expõem apenas o instantâneo associado ao token; exportações removem IDs privados e o token de origem.

## Aviso

Este é um projeto independente de apoio a jogos, sem logotipos oficiais ou arte licenciada. *Mutants & Masterminds* e marcas relacionadas pertencem aos respectivos detentores.

O catálogo e os cálculos refletem o material fornecido ao projeto. O formato de dados é versionado e mantém entradas personalizadas para que revisões posteriores possam ser incorporadas sem apagar fichas existentes.
