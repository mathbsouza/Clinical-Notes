# Clinical Notes

Site React + Tailwind para fichas clinicas em Markdown, publicado por GitHub Pages.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Conteudo

As notas ficam em `src/content/**/*.md`, espelhando a hierarquia de entidades.

Antes de criar ou migrar artigos, siga o guia em `WRITING_GUIDE.md`.

Cada nota usa frontmatter simples:

```markdown
---
title: Cirrose
category: Hepatologia
summary: Resumo curto exibido na lista.
updated: 2026-08-10
tags: cirrose, ascite
---

Texto clinico com referencia em footnote.[^referencia]

[^referencia]: Fonte conferida, pagina, DOI, PMID ou identificador do arquivo no vault.
```

## Deploy no GitHub Pages

O workflow em `../.github/workflows/clinical-notes-pages.yml` compila `ClinicalNotes` e publica apenas `dist/`.

No GitHub:

1. Abra `Settings > Pages`.
2. Em `Build and deployment`, selecione `GitHub Actions`.
3. Garanta que o repositório esteja em um plano que permita Pages em repo privado, se o codigo precisar ficar privado.

## Referencias e PDFs

GitHub Pages nao serve arquivos armazenados via Git LFS. Por isso, `references/` fica ignorado pelo Git e serve como vault local.

O mecanismo incluido usa GitHub Releases com a tag `references`:

```bash
gh release create references --title "Clinical Notes references" --notes "Reference vault"
npm run refs:upload -- references/artigo.pdf
npm run refs:retrieve -- artigo.pdf
```

Em repositório privado, esses assets ficam acessiveis via `gh` para quem tem permissao no repo. Eles nao ficam publicados no GitHub Pages. Se algum PDF precisar ser aberto pelo site publico, use storage publico ou autenticado fora do Pages, como Cloudflare R2, S3, Supabase Storage ou outro bucket/CDN.
