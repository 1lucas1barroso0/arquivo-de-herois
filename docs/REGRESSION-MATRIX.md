# Matriz de regressão da versão 1.0

Esta matriz fixa o patrimônio funcional encontrado no commit-base
`5030f40fd075db997acfff2ef1eb4470d326ee89`. Ela deve ser conferida antes da
publicação e impede que uma funcionalidade antiga seja removida por uma tela ou
modelo novo.

## Patrimônio preservado e melhorado

| Área | Estado no commit-base | Compromisso da versão 1.0 | Classificação |
| --- | --- | --- | --- |
| Fichas privadas | API com D1 opcional e fallback explícito para IndexedDB | Manter as duas fontes, sem migração destrutiva e com novos dados normalizados | Melhorada |
| Autosave | Rascunho local só é removido depois de confirmação | Manter a garantia e acrescentar histórico de revisões recuperável | Melhorada |
| Formato portátil | JSON/TXT e link portátil, versão 6 | Ler todas as versões anteriores e exportar envelope v8 sem dados privados | Melhorada |
| Compartilhamento | Instantâneo permanente somente leitura e cópia editável | Manter URLs e privacidade; explicitar os modos somente leitura e duplicável | Melhorada |
| Identidade | Nome, identidade civil, codinome, jogador, campanha, conceito, origem e descrição | Preservar todos os campos e acrescentar metadados de organização sem alterar seus significados | Melhorada |
| Regras e custos | Motor central em `lib/rules.ts` | Continuar como fonte única para ficha, auditoria, análise, impressão e encontro | Preservada |
| Construtor de poderes | Efeito, graduação, parâmetros, Extras, Falhas, características, desvantagens, vínculos, matrizes e Removível | Expor melhor a composição do custo e os estados de duração/ativação, sem substituir estruturas existentes | Melhorada |
| Auditoria | Estados verde, amarelo, vermelho e azul com decisões persistentes | Manter a semântica e ampliar verificações sem bloquear silenciosamente | Melhorada |
| Modo Assistido/Livre | Correções determinísticas e liberdade explícita | Migrar para Rápido/Guiado/Livre usando a mesma ficha; `guided` continua compatível | Substituída conscientemente |
| Catálogo 4e | 625 opções com IDs estáveis e procedência | Manter IDs e conteúdo; acrescentar navegação contextual e ação de adicionar à ficha | Melhorada |
| Referências | 145 tópicos pesquisáveis e calculadoras | Manter cobertura e procedência, com busca universal e indicação de regra oficial, interpretação ou ferramenta | Melhorada |
| Fichas de exemplo | Espectro Rubro NP 8, Sentinela Solar NP 10 e Atlas Zero NP 12 | Preservar nomes, imagens, custos e auditoria verde; torná-las atalhos didáticos distintos | Melhorada |
| Imagens | Retratos atuais e redirecionamentos antigos | Preservar byte a byte e manter os endereços legados | Preservada |
| PWA | Manifesto, instalação, cache v15, offline e atualização segura | Revalidar e versionar cache sem apagar IndexedDB ou rascunhos | Melhorada |
| Temas | Claro, escuro e automático | Manter equivalência e contraste em todas as telas novas | Melhorada |
| Português/Inglês | Tradução estrutural e busca bilíngue | Novas mensagens usam chaves estáveis; termos de regras guardam ID independente do texto | Melhorada |
| Impressão | Visualização A4 sem navegação | Acrescentar versões completa e compacta, mantendo a impressão atual utilizável | Melhorada |
| Responsividade | Breakpoints de telefone, tablet e desktop | Preservar alvos de 44 px e eliminar compressão/rolagem horizontal nas áreas novas | Melhorada |
| Acessibilidade | Foco, semântica, teclado, redução de movimento e avisos | Expandir labels, regiões vivas, descrições e significado além da cor | Melhorada |

## Funcionalidades novas e aditivas

| Área | Entrega v7 | Regra de segurança |
| --- | --- | --- |
| Dashboard | Recentes, favoritos, NPCs, incompletas, alertas, campanhas e atalhos | É uma visão dos mesmos registros, nunca uma cópia concorrente |
| Campanhas | Personagens, NPCs, equipes, organizações, locais, encontros, notas e recursos | Entidade própria com IDs estáveis; apagar vínculo não apaga ficha |
| Relações | Aliado, inimigo, rival, mentor, parceiro, equipe, subordinado, invocação, forma, veículo e base | Referências toleram destino ausente e são auditadas como vínculo quebrado |
| Fichas vinculadas | Dependentes com ficha própria | A ficha original guarda apenas o vínculo e nunca incorpora/destrói a dependente |
| Sessão | Dano, condições, penalidades, recursos temporários e efeitos ativos | Estado temporário separado dos valores-base e restaurável em uma ação explícita |
| Histórico | Revisões limitadas, desfazer/refazer, restauração e duplicação | Restaurar cria nova revisão; nenhuma versão é sobrescrita silenciosamente |
| Busca universal | Fichas, campanhas, catálogo, regras e notas | Busca local tolerante a acentos/variações, sem publicar conteúdo privado |
| Ferramentas do Narrador | NPC rápido, encontros e condições | Modelos são atalhos editáveis; estimativas não alteram fichas |
| Encontros | Abordagem oficial disponível e estimativa auxiliar opcional | Proveniência visível; a estimativa é mecânica e não oficial |
| Análise | PP, distribuição, ofensiva, defesa, mobilidade, perícias, utilidade e alertas | Mostra números derivados; não atribui nota subjetiva ao personagem |
| Comparação | Duas fichas lado a lado | Não determina vencedor e não altera as fichas comparadas |
| Backup | Pacote completo de fichas, campanhas e metadados | Importação valida tudo antes de gravar e nunca substitui por padrão |
| Onboarding | Cinco passos curtos e dispensáveis | Pode ser fechado e não bloqueia nenhuma tela |

## Portões de publicação

- Normalização v1–v8 e os dois exports reais v6 devem passar sem perda.
- Os três exemplos continuam com PP exatos e auditoria verde.
- Importar não substitui registros existentes sem confirmação explícita.
- Atualização do service worker não remove IndexedDB, rascunhos ou preferências.
- Nenhuma exceção de JavaScript, banco ou API aparece diretamente na interface.
- Lint, typecheck, testes, build e fluxos críticos precisam terminar sem erro.
- Qualquer item que não puder ser verificado no ambiente deve constar como
  limitação real no relatório final, sem declaração de conclusão falsa.

## Revisão WIP v.05 (1.2.0)

A matriz histórica acima registra a base anterior. O catálogo atual contém 629 opções, 112 configurações e 65 modificadores; há 144 tópicos, incluindo 37 condições. A condição genérica Hallucinating saiu da seleção atual, mas valores armazenados não são removidos. Ver `HANDBOOK-WIP05.md` para mudanças, páginas e testes.


## Revisão dos três exemplos — 02/11/2026

- ATENDE — Todos os modelos novos usam schema 9 e a revisão WIP v.05 de 28/10/2026.
- ATENDE — Espectro Rubro: NP 8, 120 PP, equipamento 20/20 PE, auditoria sem erros ou avisos.
- ATENDE — Sentinela Solar: NP 10, 150 PP, ataque +8/efeito 12; voo e cinco sentidos vinculados aos poderes, sem cobrança duplicada; auditoria sem erros ou avisos.
- ATENDE — Atlas Zero: NP 12, 180 PP, ataque +8/efeito 16, Força 14 e Robustez 16. Vigor/Fortitude ausentes, Imunidade a Fortitude 30 PP; autorreparo por Regeneração. Sem erros mecânicos; um aviso intencional exige autorização do Narrador para traço ausente. Não pré-aprovar esse aviso.
- ATENDE — Atualização das cópias v9 intactas também reconhece a origem antiga das prévias 1–9. Inclui Espectro, cujo único ajuste é a revisão de origem.
- ATENDE — Comparação integral de conteúdo, vínculos, notas e estado de sessão protege cópias personalizadas; fichas compartilhadas ou com revisão desconhecida não entram nessa atualização. Uma cópia já atualizada não é regravada a cada listagem. Testes: `tests/examples.test.ts`.
- ATENDE — Cache PWA v25, sem remoção de dados do IndexedDB.
- NÃO SE APLICA — Nenhuma mudança de layout, imagens ou dependências.
- PENDENTE — Suíte automatizada de navegador; a disponibilidade do Chromium não foi comprovada nesta revisão.

## Instalação e concordância de quantidades — 02/11/2026

- ATENDE — Removido o botão de instalação da navegação, junto com o diálogo próprio. Manifesto, ícones, service worker, atualização segura e instalação nativa pelo navegador permanecem disponíveis; o evento nativo de instalação não é mais interceptado.
- ATENDE — Contadores de fichas, campanhas, NPCs e fichas com alertas usam singular para 1 e plural para 0 ou múltiplos registros, em PT/EN. A mesma seleção se aplica aos contadores da Análise e às duas quantidades independentes da confirmação de backup.
- ATENDE — Regressão de renderização do dashboard para 0/1/2 registros e textos ingleses; backup com 1 ficha/2 campanhas, nos dois idiomas. `tests/dashboard-counts.test.tsx`.
- NÃO SE APLICA — Sem mudanças em regras, fichas, migrações ou permissões. Cache PWA v26 mantém os dados locais.
- PENDENTE — Instalação efetiva em dispositivo móvel e suíte automatizada de navegador não executadas nesta revisão.

## Concordância em toda a interface — 02/11/2026

- ATENDE — Revisão de quantidades no dashboard, biblioteca, edição, visualização/impressão, Análise, recursos atuais, auditoria, campanhas/encontros, catálogos, Referências, sincronização e backup. Títulos de categoria sem quantidade mantêm o plural apropriado.
- ATENDE — Centralizadas variantes PT/EN para erros, avisos pendentes/aprovados, graduações, usos, sincronização, especializações e resumos de catálogo. Removidas implementações duplicadas da contagem de auditoria na edição/visualização.
- ATENDE — Concordância de modificadores: uso/usos calculado(s), aviso(s) pendente(s)/aprovado(s), ficha(s) sincronizada(s); diagnóstico numérico usa «o valor deve ser inteiro», mesmo quando o rótulo é plural ou feminino.
- ATENDE — Campanhas identificam participantes e encontros com a quantidade correta. Fontes das Referências preservam o mesmo nome do WIP em PT/EN.
- ATENDE — Nomes e textos pessoais não recebem correção automática. Teste renderiza um nome pessoal com «1 fichas» sem alterá-lo.
- ATENDE — Testes de contagem 0/1/múltiplos, mensagens PT/EN, backup com quantidades diferentes, renderização de auditoria e diagnóstico numérico. Política permanente registrada em `QUALITY.md`.
- NÃO SE APLICA — Sem alterações em valores, regras, permissões, formato portátil ou dados salvos. Cache PWA v27 preserva IndexedDB.
- PENDENTE — Suíte automatizada de navegador e varredura visual em todos os dispositivos não executadas nesta revisão; verificações pontuais em produção não representam certificação de ausência de erros.
