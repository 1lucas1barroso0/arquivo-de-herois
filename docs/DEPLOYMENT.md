# Implantação

## Aplicação Next.js

Requisitos: Node.js 22.13 ou mais recente e um host compatível com Next.js App
Router.

```bash
npm ci
npm run build
npm run start
```

Sem configuração adicional, o editor usa IndexedDB e armazena imagens no
navegador. Esse modo preserva criação, edição, importação, exportação e links
portáteis, mas não oferece links permanentes mantidos por um servidor.
Quando os bindings opcionais não existem, a API responde `503` com a indicação
de modo local; o cliente então muda para o IndexedDB sem apagar nem migrar à
força os registros já guardados no dispositivo.

## GitHub e Vercel

O arquivo `vercel.json` acompanha o código e mantém compatíveis os endereços
antigos dos retratos. Para integrar os serviços sem manter tokens no
repositório:

1. envie este projeto para a ramificação `main` do GitHub;
2. na Vercel, importe o repositório e mantenha **Next.js** como framework;
3. deixe o diretório raiz como `./`, a instalação como `npm ci` e o build como
   `npm run build`;
4. habilite implantações de produção para `main` e prévias para as demais
   ramificações.

Depois disso, cada atualização de `main` gera uma implantação de produção, e
cada pull request recebe uma prévia isolada. A verificação de qualidade do
GitHub roda em paralelo e não precisa de credenciais da Vercel.

Uma entrega distribuída em três arquivos contém o código `.tar.gz`, sua soma
`.sha256` e um instalador `.sh`. Coloque os três na mesma pasta e, dentro do
clone do repositório, execute somente:

```bash
bash instalar-arquivo-de-herois-v1.0.1.sh
```

O instalador confere a soma, cria um bundle Git de segurança antes de alterar o
clone, executa lint, typecheck, testes e build, e só então cria o commit e envia
`main`. Se houver alterações locais, ele as guarda em um stash identificado e
informa o comando de recuperação; nada é descartado silenciosamente.

## Persistência opcional

As rotas de API reconhecem dois bindings opcionais fornecidos pelo adaptador de
implantação:

- `DB`: banco compatível com a interface D1, usado para fichas e instantâneos
  compartilhados;
- `BUCKET`: armazenamento de objetos compatível com R2, usado para retratos.

Escolha um adaptador do seu provedor que disponibilize essas interfaces no
runtime. As migrações SQL ficam em `drizzle/`; o código também cria tabelas e
índices de forma idempotente no primeiro acesso.

## Domínio e backups

Manifesto, service worker, APIs, imagens e links usam caminhos relativos à
origem, então um domínio próprio não exige alterações no código.

Para uma instalação com persistência de servidor, faça backup do banco e do
bucket em conjunto. As exportações `.arquivo-de-herois.json` e
`.arquivo-de-herois.txt` também funcionam como cópias portáteis por ficha. O
backup integral da interface reúne fichas e campanhas e, ao importar, cria
cópias em vez de substituir o arquivo existente.
