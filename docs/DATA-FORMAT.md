# Formato portátil de ficha

O formato atual é identificado por:

```json
{
  "format": "arquivo-de-herois",
  "version": 6,
  "application": "Arquivo de Heróis",
  "exportedAt": "2026-07-31T00:00:00.000Z",
  "sheet": {}
}
```

Antes de exportar, identificadores privados e tokens de compartilhamento são removidos. A importação sempre cria uma nova ficha e aceita:

- o envelope atual;
- um JSON de ficha sem envelope;
- o envelope legado `mm4e-hero-sheet`;
- um TXT exportado pelo aplicativo;
- um link permanente `/share/{token}` emitido pelo servidor;
- um link portátil `/share#...`, no qual a ficha completa fica comprimida no próprio endereço.

O normalizador em `lib/character.ts` preserva compatibilidade com estruturas anteriores e introduz valores padrão para campos adicionados em versões novas.

Na versão 6 da ficha, `sizeRank` registra o tamanho natural e `absentTraits` guarda os atributos ou traços de combate explicitamente ausentes. Importações anteriores recebem tamanho 0 e nenhuma ausência; o campo legado `absentAbilities`, quando encontrado, é migrado para as chaves válidas sem copiar valores desconhecidos. A ausência implícita de Presença causada por Consciência ausente é derivada durante os cálculos, sem apagar a escolha anterior do usuário.

As decisões sobre avisos da auditoria fazem parte da ficha portátil. Cada aprovação ou reprovação é vinculada ao conteúdo exato que foi conferido; qualquer mudança relevante devolve o item ao estado amarelo até uma nova decisão. Por isso, copiar, compartilhar, exportar e reimportar preserva decisões válidas sem transformar uma aprovação antiga em autorização genérica.

## Vínculos e dependências

Entradas do catálogo guardam chaves estáveis. Isso permite recalcular dependências sem confiar em texto livre:

- perícias preservam atributo-base, classe de custo e exigência de treinamento;
- vantagens alimentam Sorte, usos heroicos, Pontos de Equipamento e bônus derivados;
- efeitos e configurações prontas preservam fórmulas, parâmetros ofensivos e vínculos de traços;
- armas criam ataques vinculados; armaduras e escudos ativos alteram as defesas correspondentes;
- motivações e complicações de mesmo nome continuam distinguíveis pelo tipo.
- tamanho natural e traços ausentes permanecem idênticos em JSON, TXT e links portáteis.

Ao converter uma entrada do catálogo em personalizada, a ficha registra explicitamente essa decisão. Assim, salvar, compartilhar, exportar e reimportar não transforma silenciosamente uma regra da campanha em uma opção de mesmo nome.
