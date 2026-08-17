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

Todo SVG clínico próprio deve ter um arquivo `.tikz` homônimo como fonte de
verdade. SVG escrito manualmente não é aceito como fonte final: migre-o para
TikZ e gere novamente o SVG pelo script. Imagens externas reproduzidas como
documento original, como figuras de diretrizes ou artigos, são exceções e devem
permanecer no formato publicado pela fonte, com atribuição explícita.

### Renderização e visualização

- O SVG publicado deve ser autocontido: o renderizador incorpora somente as
  fontes Computer Modern efetivamente usadas e não mantém `@import` externo.
- Caracteres acentuados no TikZ usam comandos LaTeX explícitos, como `{\'a}` e
  `{\c c}`, para permanecer compatíveis com o motor TeX embarcado.
- A imagem pronta mantém fundo branco e desenho preto.
- A apresentação no site usa moldura fina e sóbria, coerente com a cor de destaque,
  `border-radius` externo de `0.9rem` e raio interno da imagem de `0.55rem`.
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
  nodes in empty cells,
  nodes={anchor=center}
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
- use obrigatoriamente `nodes={anchor=center}` na matriz;
- nós do mesmo nível ficam na mesma linha da matriz;
- nós da mesma coluna lógica ficam na mesma coluna da matriz;
- preserve uma coluna central para o fluxo principal;
- ramos equivalentes ocupam células simétricas;
- descendentes permanecem preferencialmente na coluna do ramo;
- células podem ficar vazias para preservar alinhamento e espaçamento;
- use `row sep` e `column sep` globais e uniformes;
- não use cascatas de `below=of`, `right=of` ou coordenadas `at (x,y)` como
  mecanismo principal.

### Rows, alinhamento e cotovelos

- Uma `row` representa um mesmo nível lógico e visual. Nós que devem compartilhar
  uma conexão horizontal pertencem à mesma `row`.
- Com `nodes={anchor=center}`, as âncoras `.east` e `.west` dos nós da mesma row
  compartilham o mesmo eixo Y, mesmo quando losangos e retângulos têm alturas
  diferentes.
- Entre nós da mesma row, use conexão horizontal direta:
  `(A.east) -- (B.west)`. Não crie um cotovelo para compensar diferença aparente
  de altura, baseline ou formato do nó.
- Entre nós da mesma coluna, use conexão vertical direta:
  `(A.south) -- (B.north)`.
- O cotovelo existe somente quando origem e destino ocupam simultaneamente rows
  e colunas diferentes. Nesse caso, use uma row de corredor ou uma `junction`
  pertencente à matriz.
- Antes de acrescentar uma row, confirme que ela possui função lógica: nó,
  fork, merge ou corredor ortogonal. Não crie rows apenas para gerar espaço.
- Um acotovelamento desnecessário deve ser removido mesmo que seja ortogonal;
  ortogonalidade não justifica geometria redundante.

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
6. Preserve integralmente o `viewBox` emitido pelo TikZJax. É proibido cortar a
   margem externa por valores presumidos, pois setas e pontas podem ocupar essa
   área. Não acrescente células vazias para simular margem externa.

A ordem é obrigatória: eliminar colunas supérfluas → calcular separação global →
renderizar → revisar colisões. A compactação nunca pode quebrar a simetria, mudar
as colunas lógicas ou criar setas diagonais.

## Nós, cores e estilo acadêmico

- Defina estilos reutilizáveis `terminal`, `process`, `decision` e `arrow`.
- Fundo geral branco e texto preto. Processos neutros podem permanecer brancos,
  mas decisões, alertas e desfechos usam cores semânticas discretas.
- Fonte `\sffamily\small` ou `\sffamily\footnotesize`.
- Use `text width` explícito e `align=center`.
- Nós equivalentes têm largura e dimensões consistentes.
- Processos são retângulos simples, decisões são losangos e terminais têm cantos
  discretamente arredondados.
- Sem sombras, gradientes, cores saturadas ou efeitos decorativos.

### Paleta semântica

Use como padrão as cores consolidadas nos diagramas de hiponatremia:

```tex
\definecolor{floworange}{RGB}{194,91,0}
\definecolor{floworangefill}{RGB}{255,248,239}
\definecolor{flowred}{RGB}{165,29,45}
\definecolor{flowredfill}{RGB}{255,243,243}
\definecolor{flowgreen}{RGB}{39,103,73}
\definecolor{flowgreenfill}{RGB}{241,250,245}
\definecolor{flowblue}{RGB}{45,86,130}
\definecolor{flowbluefill}{RGB}{242,247,252}
```

- laranja/creme: decisões, mecanismos em avaliação e pontos de bifurcação;
- vermelho/rosa: urgências, riscos, contraindicações e resgate;
- verde: condutas, metas atingidas, ramos terapêuticos e desfechos favoráveis;
- azul: início, contexto, informação laboratorial e nós de orientação;
- branco/preto: processos neutros e informação sem prioridade semântica.

A cor deve comunicar função. Não alterne cores apenas para decorar e não use a
mesma cor para significados contraditórios dentro do mesmo diagrama. A prévia no
tema escuro será invertida pelo frontend; por isso, valide tanto o SVG original
quanto sua apresentação no artigo.

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
- Em nós da mesma row com `anchor=center`, prefira a conexão horizontal direta;
  não introduza `++(...,0)`, `|-` ou `-|` sem mudança real de row.
- `--` entre nós só é permitido quando ambos compartilham exatamente o mesmo
  eixo horizontal ou vertical.
- **Proibição absoluta de conexão oblíqua:** antes de usar `--`, confirme que origem e destino têm a mesma coordenada X ou a mesma coordenada Y. Se ambas variarem, a conexão é inválida, mesmo quando a inclinação for discreta.
- Quando dois nós logicamente consecutivos ocuparem colunas diferentes, acrescente uma `row` exclusiva com uma `junction` alinhada verticalmente à origem ou ao destino. Conecte por segmentos horizontais/verticais com `|-` ou `-|`; o acotovelamento ortogonal é obrigatório e tem prioridade sobre a compactação.
- Troncos de fork devem ser verticais: a `junction` fica obrigatoriamente na mesma coluna da origem. Nunca use `(A.south) -- (fork)` se o fork estiver em outra coluna.
- Na revisão, toda ocorrência de `--` entre dois nós ou entre nó e junção deve ser rejeitada quando as células não compartilham linha ou coluna. Corrija a matriz; não tente mascarar a diagonal alterando espessura, comprimento ou âncora.
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

- As respostas `Sim` e `Não` pertencem às saídas da decisão e são escritas sobre o primeiro segmento da seta; é proibido prefixar o texto do nó de destino com `SIM`, `NÃO`, `SIM:` ou `NÃO:`.
- Se uma resposta precisar de explicação além de `Sim` ou `Não`, crie um nó intermediário próprio para essa informação e conecte-o normalmente. Não transforme a resposta em título do processo seguinte.
- Quando vários tratamentos levarem a uma vigilância comum sem representar sequência terapêutica direta, use conexões `densely dotted`, sempre ortogonais, para uni-los ao nó comum. Linhas pontilhadas não substituem as setas sólidas do fluxo decisório.

- “Não” ou o fluxo principal continua verticalmente quando possível.
- “Sim” sai lateralmente por `.east` ou `.west`.
- Rótulos ficam no primeiro segmento com `node[above]`, `node[left]` ou similar.
- Rótulos nunca ocupam cruzamentos ou sobrepõem nós.

## Revisão obrigatória

Antes de versionar o SVG, confirme:

- existe um `.tikz` homônimo para cada SVG próprio;
- níveis e colunas estão alinhados pela matriz;
- a matriz usa `nodes={anchor=center}`;
- existe uma coluna principal clara;
- ramos equivalentes estão simétricos;
- não há diagonais, curvas, cruzamentos ou zigue-zagues;
- nós da mesma row usam ligações diretas, sem cotovelos redundantes;
- nenhuma seta atravessa um nó ou começa em outra seta;
- espaçamento, larguras e tipografia são uniformes;
- rótulos e textos estão legíveis.

Depois de renderizar, abra o SVG ou faça uma captura da imagem final. A revisão
somente do código TikZ não detecta diferenças visuais de âncora, texto cortado,
quebra em múltiplas páginas ou conectores que atravessam nós.

Se houver problema, reorganize primeiro as células da matriz. A geometria da
matriz é a fonte de verdade; as setas não devem compensar um layout ruim.
