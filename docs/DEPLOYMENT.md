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
`.arquivo-de-herois.txt` também funcionam como cópias portáteis por ficha.
