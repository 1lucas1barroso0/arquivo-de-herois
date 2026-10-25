# Práticas de qualidade

## Boas práticas obrigatórias

1. Independência de identidade, regras, dados, arquitetura e publicação.
2. Inspecionar o estado mais avançado e preservar funções e personalizações.
3. Manter mudanças proporcionais ao problema, com impacto definido.
4. Registrar fonte, versão e autoridade; distinguir oficial, interpretação e opção.
5. Tornar cálculos verificáveis e atualizar dependências automaticamente.
6. Usar linguagem natural e terminologia consistente em todo PT-BR/EN, sem traduzir textos pessoais.
7. Manter identidade visual, simplicidade e funções fáceis de descobrir.
8. Validar legibilidade em celular, tablet e desktop, com textos longos nos dois idiomas.
9. Garantir teclado, foco, rótulos, contraste e significado além das cores.
10. Preservar dados, vínculos e personalizações em salvamento, migração e exportação/importação.
11. Mostrar estados reais de salvamento, erro e recuperação.
12. Respeitar probabilidades e impedir repetição indevida em operações compartilhadas, quando aplicável.
13. Validar permissões no servidor para cada recurso compartilhado.
14. Cuidar do desempenho e das atualizações PWA sem apagar dados.
15. Separar responsabilidades, centralizar regras e justificar dependências.
16. Testar conforme impacto; verificar fluxos completos e prevenir falhas recorrentes.
17. Identificar código validado/publicado, conferir produção e permitir recuperação segura.
18. Registrar decisões, causas, correções, prevenção e verificações pendentes.

## Más práticas proibidas

1. Impor plataforma ou dependências obrigatórias entre projetos.
2. Recomeçar, usar versão antiga ou substituir trabalho aprovado por solução inferior.
3. Ampliar escopo, redesenhar ou remover funções sem necessidade autorizada.
4. Acumular recursos sem propósito para o produto.
5. Inventar regras, fontes, números, exemplos ou identificadores oficiais.
6. Distorcer limitações ou misturar versões e exceções silenciosamente.
7. Mostrar números sem contexto ou cores de aprovação sem validação correta.
8. Duplicar cálculos ou produzir divergência entre edição, análise e exportação.
9. Misturar idiomas, termos inconsistentes ou alterar textos pessoais na troca de idioma.
10. Esconder ações ou criar poluição textual, visual e excesso de janelas.
11. Cortar textos, partir palavras, sobrepor elementos ou comprimir botões.
12. Apagar armazenamento ou descartar campos/vínculos silenciosamente.
13. Ocultar falhas, anunciar salvamento inexistente ou trocar escolhas sem aviso.
14. Manipular aleatoriedade ou aceitar resultados compartilhados sem validação.
15. Tratar botão escondido como segurança ou expor dados/credenciais.
16. Concentrar responsabilidades e adicionar complexidade sem benefício.
17. Tratar build/publicação como comprovação de fluxos ou alegar teste não executado.
18. Prometer ausência absoluta de bugs ou repetir falhas conhecidas sem prevenção.

## Revisão e bloqueios

Para cada critério afetado, registrar ATENDE, PRECISA DE CORREÇÃO ou NÃO SE APLICA,
com teste, arquivo ou observação que sustente o resultado. Ausência de evidência
não equivale a aprovação. Consultar também a matriz de regressão.

Perda de dados, regras incorretas, permissões indevidas e falhas em fluxos
essenciais bloqueiam a publicação da mudança afetada.

## Aplicação de 25/10/2026

Base inspecionada: `bcb975ff73c41e69ede37bb04832e76e445de5cf`.

- Importação: arquivos alheios, listas e envelopes de versão futura eram aceitos
  pela normalização. Agora são rejeitados antes da conversão, preservando o
  arquivo original e mantendo JSON legado e TXT compatíveis.
- Teste de referências: corrigida expectativa de texto que correspondia a um
  rótulo acessível, para verificar o elemento correto.
- Inglês: adicionadas traduções das orientações de conceito/origem/arquétipo
  e motivação do assistente de criação.
- Permissões: `lib/server.ts:getOwnerId` aceita identidade em cabeçalho sem
  verificar sessão nesse ponto. Antes de habilitar contas/armazenamento remoto,
  comprovar a validação por infraestrutura confiável ou implementar sessão
  verificada com migração dos proprietários existentes. Não declarar o fluxo
  autenticado seguro apenas porque as consultas filtram por proprietário.
- Auditoria visual integral, permissões de servidor, cobertura completa PT/EN e
  validação de produção: PRECISA DE CORREÇÃO até haver execução e evidência;
  esta aplicação não certifica todas as áreas do produto.
