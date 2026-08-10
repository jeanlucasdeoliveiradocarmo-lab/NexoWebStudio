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

O formulário não armazena informações em servidor: ele valida e sanitiza os campos no navegador e abre uma conversa formatada no WhatsApp Business.

## Personalização

- Conteúdo e componentes: `components/landing-page.tsx`
- Tema e estilos globais: `app/globals.css`
- Fundo WebGL: `components/Topography.jsx`
- Metadados e favicon: `app/layout.tsx`
- Imagens: `public/`
- Cabeçalhos de segurança: `next.config.ts`
