# Flowcharts clínicos com TikZ

Os diagramas ficam no próprio artigo Markdown e são compilados no navegador pelo
TikZJax (TeX em WebAssembly). O GitHub Pages publica apenas os arquivos estáticos;
não é necessário instalar LaTeX no workflow.

````markdown
```tikz
% Nome acessível do diagrama | Legenda exibida abaixo do diagrama
\usetikzlibrary{positioning,arrows.meta}
\begin{tikzpicture}[>=Stealth]
  \node[draw] (inicio) {Início};
  \node[draw, below=1cm of inicio] (fim) {Fim};
  \draw[->] (inicio.south) -- (fim.north);
\end{tikzpicture}
```
````

Como em TikZ normal, a origem e o destino podem usar âncoras (`.north`, `.east`,
`.south`, `.west`), deslocamentos relativos (`++(0,-7mm)`) e cotovelos ortogonais
(`|-` e `-|`). O SVG se ajusta à largura disponível e pode ser ampliado com um
clique.
