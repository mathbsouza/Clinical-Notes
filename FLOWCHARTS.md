# Diagramas clínicos com TikZ

## Organização e publicação

Cada entidade mantém a fonte e a imagem pronta na própria pasta:

```text
Entidade/
├── Entidade.md
└── diagrams/
    ├── diagnosis.tikz
    ├── diagnosis.svg
    ├── etiology.tikz
    └── etiology.svg
```

O GitHub Pages recebe os SVGs já renderizados. Antes do commit:

```bash
npm run diagrams
npm run build
```

Para um único arquivo: `npm run diagrams -- diagnosis.tikz`.

## Fonte de verdade: `matrix of nodes`

Todo fluxograma usa `matrix of nodes` como mecanismo padrão de layout. As linhas
e colunas da matriz representam diretamente `row` e `column` da grade lógica.
Não calcule coordenadas absolutas manualmente, exceto em desvios locais e loops.

```tex
\usetikzlibrary{matrix,positioning,arrows.meta,shapes.geometric,calc}

\matrix (flow) [
  matrix of nodes,
  row sep=2.3cm,
  column sep=5.5cm,
  nodes in empty cells
] {
  & |[terminal] (start)| Início & \\
  & |[decision] (decision)| Decisão & \\
  |[process] (left)| Ramo A & & |[process] (right)| Ramo B \\
};
```

Regras da matriz:

- construa primeiro a topologia: nós e conexões;
- atribua cada nó a uma célula `row/column`;
- declare a matriz inteira antes da primeira instrução `\draw`;
- nós do mesmo nível ficam na mesma linha da matriz;
- nós da mesma coluna lógica ficam na mesma coluna da matriz;
- preserve uma coluna central para o fluxo principal;
- ramos equivalentes ocupam células simétricas;
- descendentes permanecem preferencialmente na coluna do ramo;
- células podem ficar vazias para preservar alinhamento e espaçamento;
- use `row sep` e `column sep` globais e uniformes;
- não use cascatas de `below=of`, `right=of` ou coordenadas `at (x,y)` como
  mecanismo principal.

## Nós e estilo acadêmico

- Defina estilos reutilizáveis `terminal`, `process`, `decision` e `arrow`.
- Fundo geral branco; nós com `fill=white`, borda preta fina e texto preto.
- Fonte `\sffamily\small` ou `\sffamily\footnotesize`.
- Use `text width` explícito e `align=center`.
- Nós equivalentes têm largura e dimensões consistentes.
- Processos são retângulos simples, decisões são losangos e terminais têm cantos
  discretamente arredondados.
- Sem sombras, gradientes, cores saturadas ou efeitos decorativos.

## Setas

- Use `arrows.meta` e `-{Stealth[scale=1.0]}`.
- Todas as linhas são estritamente horizontais ou verticais.
- Diagonais, curvas, Bézier e zigue-zagues são proibidos.
- Toda origem e todo destino usam âncoras explícitas.
- Fluxo vertical alinhado: `(A.south) -- (B.north)`.
- Se o destino estiver em uma linha inferior, a seta sempre nasce em `.south`,
  desce primeiro e termina verticalmente em `.north`: `(A.south) -- ++(0,-6mm)
  -| (B.north)`.
- Use `.east` e `.west` como origem apenas para fluxos realmente laterais no
  mesmo nível. Nesses casos, a entrada deve acompanhar a orientação, chegando em
  `.west` ou `.east`, nunca lateralmente em `.north`.
- `--` entre nós só é permitido quando ambos compartilham exatamente o mesmo
  eixo horizontal ou vertical.
- Cada `\draw` começa em uma âncora do nó de origem, nunca em outra seta.
- Uma conexão lateral deve ter preferencialmente um único cotovelo.
- Setas não atravessam nós nem se sobrepõem sem intenção deliberada.
- Loops usam `coordinate` apenas como desvios locais externos à matriz.

### Forks

- Um fork possui exatamente um tronco vertical e um nó auxiliar invisível de
  bifurcação, colocado em uma célula própria da `matrix of nodes`.
- O tronco não tem ponta de seta. As pontas pertencem somente aos ramos.
- Todos os ramos irmãos começam no mesmo nó invisível; assim, compartilham
  exatamente o mesmo Y do barramento horizontal.
- É proibido criar ramos irmãos com deslocamentos verticais diferentes.
- Padrão obrigatório:

```tex
% forkA é uma célula da matrix: |[junction] (forkA)| {}
\draw[trunk] (A.south) -- (forkA);
\draw[arrow] (forkA) -| (B.north);
\draw[arrow] (forkA) -- (C.north);
\draw[arrow] (forkA) -| (D.north);
```

Use o estilo `junction` sem borda, preenchimento, texto ou dimensões mínimas. O
nó invisível continua pertencendo à grade e evita coordenadas calculadas fora da
matriz. Todo texto interno de uma célula também deve ser o conteúdo de um nó da
matriz, nunca um `node` solto sobre uma conexão.

## Decisões

- “Não” ou o fluxo principal continua verticalmente quando possível.
- “Sim” sai lateralmente por `.east` ou `.west`.
- Rótulos ficam no primeiro segmento com `node[above]`, `node[left]` ou similar.
- Rótulos nunca ocupam cruzamentos ou sobrepõem nós.

## Revisão obrigatória

Antes de versionar o SVG, confirme:

- níveis e colunas estão alinhados pela matriz;
- existe uma coluna principal clara;
- ramos equivalentes estão simétricos;
- não há diagonais, curvas, cruzamentos ou zigue-zagues;
- nenhuma seta atravessa um nó ou começa em outra seta;
- espaçamento, larguras e tipografia são uniformes;
- rótulos e textos estão legíveis.

Se houver problema, reorganize primeiro as células da matriz. A geometria da
matriz é a fonte de verdade; as setas não devem compensar um layout ruim.
