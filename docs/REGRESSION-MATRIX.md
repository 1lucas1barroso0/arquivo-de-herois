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
| Formato portátil | JSON/TXT e link portátil, versão 6 | Ler todas as versões anteriores e exportar envelope v7 sem dados privados | Melhorada |
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

- Normalização v1–v7 e os dois exports reais v6 devem passar sem perda.
- Os três exemplos continuam com PP exatos e auditoria verde.
- Importar não substitui registros existentes sem confirmação explícita.
- Atualização do service worker não remove IndexedDB, rascunhos ou preferências.
- Nenhuma exceção de JavaScript, banco ou API aparece diretamente na interface.
- Lint, typecheck, testes, build e fluxos críticos precisam terminar sem erro.
- Qualquer item que não puder ser verificado no ambiente deve constar como
  limitação real no relatório final, sem declaração de conclusão falsa.
