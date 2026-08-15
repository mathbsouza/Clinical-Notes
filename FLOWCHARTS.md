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

## Padrão tipográfico obrigatório

- Use `standalone`, `tikz` e as bibliotecas `positioning`, `arrows.meta`,
  `shapes.geometric` e `calc` quando necessárias.
- O fundo geral do SVG deve permanecer transparente. Os nós devem ter
  `fill=white`, borda preta fina, texto preto e nenhuma sombra ou gradiente.
- Use tipografia `\sffamily\small` ou `\sffamily\footnotesize`, largura de texto
  fixa e alinhamento central.
- Use `node distance=1.5cm and 1.5cm` como espaçamento global inicial e somente a
  sintaxe moderna de posicionamento, como `below=of A`.
- Todas as conexões devem ser horizontais ou verticais. Setas diagonais são
  proibidas.
- Toda conexão deve declarar as âncoras de origem e destino explicitamente, como
  `(A.south)` e `(B.west)`, usando `|-` ou `-|` nos cotovelos.
- A ponta padrão é `-{Stealth[scale=1.0]}` da biblioteca `arrows.meta`.
- Decisões devem ter saídas previsíveis e rótulos junto ao segmento com
  `node[above]`, `node[left]` ou equivalente.
- Loops e retornos devem usar `coordinate` como pontos invisíveis de desvio para
  contornar nós sem cruzá-los.
- Antes de publicar, execute `npm run diagrams` e versione os arquivos `.tikz` e
  `.svg` correspondentes.
