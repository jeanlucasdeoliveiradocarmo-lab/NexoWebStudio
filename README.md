# Nexo Web Studio

Landing page institucional desenvolvida com Next.js, React, TypeScript, Tailwind CSS, Framer Motion e OGL.

## Requisitos

- Node.js 22.13 ou superior
- pnpm 11 (ative com `corepack enable` caso necessário)

## Executar localmente

```bash
pnpm install
pnpm dev
```

Acesse `http://localhost:3000`.

## Validar antes da publicação

```bash
pnpm lint
pnpm test
pnpm build
```

## Publicar no GitHub

1. Crie um repositório vazio no GitHub.
2. Extraia este pacote e abra um terminal na pasta do projeto.
3. Execute:

```bash
git init
git add .
git commit -m "Publica Nexo Web Studio"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## Publicar na Vercel

1. Entre em [vercel.com](https://vercel.com) e escolha **Add New → Project**.
2. Importe o repositório do GitHub.
3. Confirme o framework **Next.js** e mantenha as configurações automáticas.
4. Clique em **Deploy**.

O formulário valida e sanitiza os campos, registra o lead no NX-CRM pelo Firebase e abre a conversa formatada no WhatsApp Business. O registro acontece por uma rota de servidor e não atrasa nem altera o redirecionamento para o WhatsApp.

## Configurar a integração NX-CRM / Firebase

1. Copie `.env.example` para `.env.local` no desenvolvimento ou cadastre as mesmas variáveis no projeto da Vercel.
2. Preencha `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` e `FIREBASE_PRIVATE_KEY` com os dados de uma conta de serviço do Firebase com permissão de escrita no Firestore.
3. Mantenha `NX_CRM_ID=3EQx6sXtRzWmGpvhGPQeXAsBXOI3`.
4. Se o NX-CRM usar outro esquema, ajuste apenas:
   - `NX_CRM_LEADS_COLLECTION`: coleção de destino. Aceita `{crmId}`, por exemplo `crms/{crmId}/leads`.
   - `NX_CRM_ID_FIELD`: nome do campo que identifica o CRM no documento. O padrão é `crmId`.

As credenciais são lidas exclusivamente no servidor. Não use o prefixo `NEXT_PUBLIC_` nessas variáveis.

## Personalização

- Conteúdo e componentes: `components/landing-page.tsx`
- Tema e estilos globais: `app/globals.css`
- Fundo WebGL: `components/Topography.jsx`
- Metadados e favicon: `app/layout.tsx`
- Imagens: `public/`
- Cabeçalhos de segurança: `next.config.ts`
