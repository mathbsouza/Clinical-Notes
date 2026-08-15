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

### Renderização e visualização

- O SVG publicado deve ser autocontido: o renderizador incorpora somente as
  fontes Computer Modern efetivamente usadas e não mantém `@import` externo.
- Caracteres acentuados no TikZ usam comandos LaTeX explícitos, como `{\'a}` e
  `{\c c}`, para permanecer compatíveis com o motor TeX embarcado.
- A imagem pronta mantém fundo branco e desenho preto.
- No tema escuro, somente a prévia recebe inversão de cores. Ao abrir o lightbox,
  o SVG recupera as cores originais.
- O lightbox oferece zoom de 50% a 250%, em passos de 25%, com botões para
  reduzir, restaurar e ampliar. Atalhos: `-`, `0` e `+`.
- Quando o conteúdo ampliado exceder a janela, o painel deve conservar rolagem
  horizontal e vertical; o zoom não pode deformar a proporção da imagem.

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

### Algoritmo de compactação

Depois de definir a topologia, compacte a grade nesta ordem:

1. Remova toda coluna sem função lógica. Uma coluna vazia não pode existir apenas
   para criar distância; use `column sep` para isso.
2. Preserve somente as colunas exigidas por nós, ramos e corredores ortogonais de
   setas. Ramos equivalentes continuam simétricos em relação à coluna central.
3. Seja `W` a maior largura de nó equivalente. Use como ponto inicial
   `column sep = clamp(4 mm, 0,08 × W, 8 mm)`.
4. Use `row sep = clamp(5 mm, 0,12 × H, 10 mm)`, em que `H` é a altura mediana dos
   nós. Aumente uma separação local somente se pontas de seta ou textos colidirem.
5. Renderize e revise os corredores. Se houver espaço excessivo, reduza primeiro
   `column sep`; não desloque nós individualmente e não entorte conectores.
6. O renderizador remove automaticamente a margem técnica de 72 pt do TikZJax e
   conserva 18 pt nas laterais e 24 pt acima e abaixo. Não acrescente células
   vazias para simular margem externa.

A ordem é obrigatória: eliminar colunas supérfluas → calcular separação global →
renderizar → revisar colisões. A compactação nunca pode quebrar a simetria, mudar
as colunas lógicas ou criar setas diagonais.

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
- A âncora de entrada corresponde obrigatoriamente ao último segmento: chegada
  horizontal da esquerda usa `.west`; chegada horizontal da direita usa `.east`;
  chegada vertical de cima usa `.north`; chegada vertical de baixo usa `.south`.
- O operador também deve preservar essa orientação: use `|-` quando o último
  segmento precisa ser horizontal e `-|` quando o último segmento precisa ser
  vertical.
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

### Informação entre etapas

- Toda informação clínica ou quantitativa que participa da lógica do fluxo deve
  ser um nó visível em uma célula própria da matriz.
- Probabilidades pré-teste, critérios, resultados intermediários e qualificadores
  não devem ser escritos como `node[...]` sobre uma seta.
- O nó informativo recebe uma conexão de entrada e outra de saída, ambas com
  âncoras explícitas; no fluxo vertical, use `.north` para entrada e `.south` para
  saída.
- Rótulos sobre setas ficam reservados a respostas curtas de decisão, como
  “Sim” e “Não”, quando não constituem uma etapa independente.

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
