# Diagramas clínicos com TikZ

Cada entidade guarda seus próprios diagramas:

```text
Nome da entidade/
├── Nome da entidade.md
└── diagrams/
    ├── etiology.tikz   # fonte editável
    ├── etiology.svg    # imagem pronta publicada
    ├── diagnosis.tikz
    └── diagnosis.svg
```

## Fluxo de publicação

Depois de editar qualquer `.tikz`, renderize localmente antes do commit:

```bash
npm run diagrams
npm run build
```

`npm run diagrams` encontra todos os arquivos `src/content/**/diagrams/*.tikz` e
grava o SVG ao lado da fonte. O SVG deve ser versionado no Git. O workflow do
GitHub Pages recebe e publica somente a imagem pronta; não executa TeX.

No artigo, use:

````markdown
```svg-diagram
Syndromes/Cardiovasculares/Síncope/diagrams/etiology.svg|Nome acessível|Legenda
```
````

O site ajusta a imagem à largura disponível e abre uma versão maior ao clicar.
