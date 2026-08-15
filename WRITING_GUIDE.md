# Guia de Escrita do Clinical Notes

Este guia orienta a escrita e migração de artigos clínicos para o Clinical Notes.

## Objetivo

Cada nota deve funcionar como um artigo clínico geral sobre a entidade, não como um recorte excessivamente estreito. O texto deve ajudar a reconhecer, diagnosticar, estratificar e tratar a condição com base em evidência rastreável.

## Estrutura Recomendada

Use Markdown com frontmatter:

```markdown
---
title: Nome da Entidade
entityGroup: Doenças
category: Especialidade
summary: Resumo clínico curto.
updated: 2026-08-11
tags: tag1, tag2
---
```

## Organização das entidades

Cada artigo deve ser modular e permanecer dentro da pasta da própria entidade:

```text
src/content/
└── Grupo/
    └── Categoria/
        └── Entidade/
            ├── Entidade.md
            └── diagrams/
                ├── diagnosis.tikz
                ├── diagnosis.svg
                ├── etiology.tikz
                └── etiology.svg
```

- `Grupo` define a primeira coluna de navegação: `Clinical Signs`, `Syndromes`, `Disorders`, `Interventions`, `MBE` etc.
- `category` descreve a especialidade ou domínio dentro do grupo.
- A pasta final e o arquivo `.md` devem ter o mesmo nome; o frontend os apresenta como uma única entidade.
- Fontes TikZ e imagens renderizadas pertencem à pasta `diagrams/` da entidade, nunca a uma pasta global.
- O valor `entityGroup` é o nome apresentado ao leitor e pode estar em português, mesmo quando a pasta estrutural usa outro nome.
- `summary` deve ser uma única frase curta e pesquisável.
- `updated` usa `AAAA-MM-DD` e deve refletir a última revisão material.

Cada artigo recebe automaticamente uma URL compartilhável derivada do caminho:

```text
#/artigo/grupo/categoria/entidade
```

Não escreva URLs manualmente no frontmatter.

## Hierarquia de títulos

O título da entidade já é o H1 da página e é gerado pela interface. No corpo do Markdown:

- `##` inicia uma seção principal;
- `###` inicia uma subseção;
- `####` identifica uma divisão interna curta;
- `#####` é reservado a rótulos locais raros;
- não use `#` em artigos regulares, para evitar dois títulos principais na mesma página;
- não salte níveis sem necessidade.

Todos os níveis recebem IDs automáticos para links e navegação por âncora.

Ordem sugerida para doenças:

- Definição
- Epidemiologia, com dados quantitativos quando disponíveis
- Etiologia, com proporções quando disponíveis
- Manifestações Clínicas, com Sn, Sp, LR e PIRD quando houver evidência
- Diagnóstico, com critérios, Sn, Sp, LR e PIRD quando aplicável
- Tratamento, com dose/posologia, PICO, ensaios primários e sínteses
- Prognóstico, com estudos de desfechos
- Footnotes

Nem toda nota precisa ter todas as seções, mas a ausência deve fazer sentido para a entidade.

Evite seções genéricas ou artificiais como:

- “Números Essenciais”
- “Pegadinhas”
- “Resumo de prova”
- “Não Fazer”
- “Pontos-chave”

Se um número é importante, ele deve aparecer dentro da seção clínica correspondente: dose em Tratamento, meta pressórica em Tratamento, recorrência em Prognóstico.

Evite redundância entre texto e tabela. Se a tabela já contém dose, janela, Sn, Sp, LR, porcentagem ou ponto de corte, o parágrafo deve interpretar o dado, não repeti-lo.

## Tom e Redação

Escreva como artigo clínico direto. Evite metatexto.

Não usar:

- “a ficha original”
- “o material mostra”
- “o texto-fonte”
- “no PDF local”
- “esta ficha precisa”
- “leitura do parágrafo”

Preferir:

- “Na prática...”
- “O diagnóstico combina...”
- “A decisão depende de...”
- “O maior ganho ocorre quando...”

O texto principal deve ser sintético, interpretativo e útil. Detalhes extensos de desenho de estudo, percentuais, HR, IC95% e população podem ir para footnotes quando não forem necessários na frase principal.

O artigo deve parecer uma explicação clínica natural, não um checklist de cursinho. Use transições curtas para manter fluxo: definição leva a epidemiologia; epidemiologia leva a etiologia; etiologia explica manifestações; manifestações orientam diagnóstico; diagnóstico seleciona tratamento; tratamento muda prognóstico.

## Citações diretas e paráfrases

O texto principal deve preferir uma paráfrase clínica clara. Preserve o trecho original na footnote quando ele tiver sido copiado de uma fonte.

```markdown
- Deve-se obter ECG em todo paciente com suspeita de síncope.[^uptodate-ecg]

[^uptodate-ecg]: “An ECG should be obtained in all patients with suspected syncope.” — *Syncope in adults: Clinical manifestations and initial diagnostic evaluation*. UpToDate.
```

- Nunca use `>` dentro de uma footnote; ele cria um bloco visual inadequado na seção de referências.
- Mantenha o excerto entre aspas na mesma linha da definição da footnote.
- Mantenha excerto e atribuição em um único parágrafo quando não houver necessidade semântica de separá-los.
- Preserve o idioma original na nota quando a paráfrase em português estiver no corpo.
- Remissões internas que não funcionam fora da plataforma de origem, como `(See "Bifascicular block".)`, devem ser removidas e substituídas por `[...]` no local apropriado.
- Não apresente como fonte primária uma diretriz conhecida apenas por meio de uma fonte secundária; atribua o texto à fonte realmente consultada.
- Não use citação direta no corpo quando uma paráfrase transmitir a recomendação com mais clareza.

## Footnotes

Use footnotes Markdown:

```markdown
Texto clínico.[^chave]

[^chave]: Fonte, desenho, população, desfecho principal e resultado relevante.
```

Escolha chaves descritivas e estáveis, como `[^uptodate-ecg-syncope]`, e reúna todas as definições ao final do artigo. A referência deve aparecer imediatamente após a afirmação, o título ou a linha de tabela que sustenta.

Use o mínimo de footnotes necessário, mas sem perder rastreabilidade. Uma footnote pode agrupar evidências relacionadas, desde que o agrupamento seja coerente.

Footnotes devem conter:

- referência bibliográfica;
- tipo de evidência;
- população estudada, quando relevante;
- comparador;
- desfecho;
- resultado numérico importante;
- limitações quando aplicável.

Use estrutura explícita quando a evidência for central:

- **PIRD** para diagnóstico, manifestações clínicas, sinais, sintomas, escores e exames.
- **PICO** para tratamento, prevenção, prognóstico modificável e intervenções.

Não deixe alegações clínicas sem suporte quando forem diagnósticas, epidemiológicas, fisiopatológicas, terapêuticas, prognósticas ou operacionais.

## PIRD Para Diagnóstico e Acurácia

Use PIRD para evidências de diagnóstico, manifestações clínicas e sinais:

- **P**opulação: em quem o achado/teste foi avaliado.
- **I**ndex test: sinal, sintoma, escore, exame ou ponto de corte avaliado.
- **R**eference standard: padrão de referência usado para confirmar a condição.
- **D**esfecho diagnóstico: LR+, LR-, sensibilidade, especificidade, AUC, VPP/VPN ou reclassificação.

Use essa estrutura para pensar e checar completude. Não escreva literalmente `PIRD:` na nota final.

Formato:

```markdown
[^clinical-lr]: Em adultos com dispneia no pronto atendimento, sinais, sintomas, ECG, radiografia e BNP foram avaliados contra diagnóstico final de IC. Terceira bulha teve LR+ 11, turgência jugular LR+ 5,1, congestão venosa pulmonar no RX LR+ 12 e BNP <100 pg/mL LR- 0,11. Fonte: ...
```

Se a fonte for síntese diagnóstica, diga isso. Se for estudo primário, diga desenho e cenário.

## Evidência Para Diagnóstico e Manifestações Clínicas

Para diagnóstico, manifestações clínicas, acurácia de exames e critérios, sempre que possível combine:

- evidência primária: coortes diagnósticas, ensaios, estudos de validação, estudos prospectivos;
- sínteses: revisões sistemáticas, meta-análises, diretrizes ou revisões clínicas qualificadas.
- medidas de acurácia: sensibilidade, especificidade, LR+, LR-, AUC, VPP/VPN ou calibragem, conforme o tipo de dado.

O texto principal deve trazer as medidas centrais de forma resumida. Deixe detalhes de população, teste, padrão de referência, desenho e limitações para a footnote.

Quando escrever “quando suspeitar”, não liste sinais e sintomas como se todos tivessem o mesmo peso. Sempre que houver síntese diagnóstica, inclua Sn, Sp, LR+ e LR- dos achados principais quando disponíveis.

Formato recomendado:

```markdown
| Achado | Sn | Sp | LR+ | LR- |
| --- | ---: | ---: | ---: | ---: |
| Terceira bulha | 13% | 99% | 11 | 0,88 |
| Turgência jugular | 39% | 92% | 5,1 | 0,66 |
| Crepitações | 60% | 78% | 2,8 | 0,51 |
```

Depois da tabela, escreva a implicação clínica:

```markdown
Terceira bulha e turgência jugular aumentam mais a probabilidade do que sintomas isolados; já a ausência de um único sinal físico raramente exclui IC. BNP baixo, ausência de B-lines no POCUS ou radiografia sem cardiomegalia podem reduzir mais a probabilidade quando o contexto é dispneia aguda.[^clinical-lr]
```

Exemplo:

```markdown
BNP e NT-proBNP têm melhor desempenho para excluir IC aguda do que para confirmá-la. Resultado baixo reduz a probabilidade de IC; resultado alto deve ser interpretado junto da probabilidade pré-teste.[^bnp-ruleout]

[^bnp-ruleout]: Em adultos com dispneia aguda, BNP foi avaliado contra diagnóstico final de IC. Maisel AS et al. validaram BNP em dispneia aguda; BNP > 100 pg/mL teve sensibilidade de 90%, especificidade de 76% e acurácia de 83%. Hill SA et al., em revisão sistemática, sintetizaram que BNP e NT-proBNP têm bom desempenho para rule-out e menor desempenho para rule-in. Fontes: ...
```

Evite transformar um estudo diagnóstico em regra absoluta. Sempre explicite quando o teste é melhor para exclusão do que para confirmação.

## Evidência Para Tratamento

Sempre que falar de tratamento, inclua:

- dose ou posologia;
- evidência primária que embasa a intervenção, quando disponível;
- síntese ou diretriz que contextualiza a recomendação;
- população em que o benefício foi demonstrado;
- desfecho principal;
- magnitude do efeito, quando importante.

Use PICO nas footnotes terapêuticas:

- **P**opulação: fenótipo, gravidade, FEVE, NYHA, cenário ambulatorial/internado.
- **I**ntervenção: fármaco/procedimento com dose.
- **C**omparador: placebo, tratamento usual, enalapril, valsartana etc.
- **O**utcomes: morte, hospitalização, piora de IC, sintomas, eventos adversos.

Use essa estrutura para checar completude. Não escreva literalmente `PICO:` na nota final.

Se citar um medicamento, não deixe sem dose.

Formato recomendado:

```markdown
| Classe | Opção | Dose inicial | Dose-alvo |
| --- | --- | ---: | ---: |
| Inibidor de SGLT2 | Dapagliflozina[^sglt2-primary] | 10 mg 1x/dia | 10 mg 1x/dia |
```

Na footnote:

```markdown
[^sglt2-primary]: Em pacientes com IC-FEr sintomática, dapagliflozina 10 mg/dia foi comparada a placebo sobre terapia recomendada. Desfecho: piora de IC ou morte cardiovascular. No DAPA-HF, o desfecho ocorreu em 16,3% versus 21,2%, HR 0,74. Síntese/diretriz: ACC/AHA/HFSA incorpora SGLT2i como uma das quatro classes da terapia modificadora de prognóstico em IC-FEr. Fontes: ...
```

Para tratamento, prefira evidência nesta ordem:

- ensaio clínico randomizado pivotal;
- meta-análise ou revisão sistemática;
- diretriz recente;
- revisão clínica, quando não houver estudo primário simples ou quando o tema for operacional.

## Uso de Listas

Use `-` estrategicamente para escaneabilidade, não para transformar o artigo inteiro em tópicos.

Quando usar listas, use somente `-` como marcador. Não use `*`, `+` ou listas numeradas, exceto se o usuário pedir explicitamente uma sequência numerada.

Bom uso:

- perguntas práticas;
- sinais e sintomas;
- prioridades iniciais;
- classes terapêuticas;
- checklist de seguimento.

Evite listas longas quando um parágrafo curto resolver melhor.

Evite fragmentação excessiva. Muitos subtítulos curtos fazem a nota parecer uma colagem de cartões. Prefira seções maiores, com parágrafos breves e bullets somente para decisões, critérios, doses, contraindicações ou listas realmente escaneáveis.

Subitens usam dois espaços de indentação. Não escreva `- -` na mesma linha:

```markdown
- Item principal.
  - Subitem.
  - Outro subitem.
    - Terceiro nível, apenas quando indispensável.
```

Deixe uma linha vazia antes de iniciar uma lista, mas não separe o item principal de seus subitens.

## Tabelas

Use tabelas quando houver comparação ou dose.

Boas tabelas:

- classificação por fração de ejeção;
- pontos de corte diagnósticos;
- dose inicial e dose-alvo;
- diferenças entre fenótipos.

Toda tabela com conteúdo clínico deve ter footnote ou referências nas células/linhas relevantes.

- Prefira poucas colunas e textos concisos.
- Células podem e devem quebrar linha; não insira espaços artificiais para alargar a tabela.
- Remova colunas repetitivas. Quando uma classificação se repete em várias linhas, use um subtítulo e uma tabela separada.
- Para comparação clínica, `Achado` e `Interpretação` costumam ser suficientes.
- Evite repetir na interpretação tudo o que já está explícito no achado.

Quando uma tabela tiver abreviações, unidade, ressalva de dose ou nota operacional, coloque a legenda como última linha da própria tabela:

```markdown
| Fármaco | Dose |
| --- | --- |
| Exemplo | 10 mg 1x/dia |
| Legenda: ajustar por função renal quando aplicável. |  |
```

A linha deve começar com `Legenda:`, `Nota:` ou `Abreviações:`. O frontend renderiza essa linha como uma nota que ocupa toda a largura da tabela.

## Páginas e Fontes

Quando a página exata estiver confirmada, inclua página:

```markdown
[^ref]: Fonte X, p. 10.
```

Se a página não estiver confirmada, não invente. Use a referência sem página.

Não escreva “PDF local”. Escreva a fonte bibliográfica diretamente.

## Migração de Conteúdo

Ao migrar do MedFichas:

- preserve a hierarquia de pastas;
- trate a última pasta com `.md` homônimo como o artigo;
- não publique conteúdo clínico sem referência suficiente;
- transforme comandos LaTeX em Markdown limpo;
- remova metatexto de migração;
- substitua `\directquote` por blockquote `>` apenas quando o trecho for realmente importante;
- converta referências em footnotes Markdown.

## Diagramas e imagens

Use o bloco `svg-diagram` para inserir um SVG pré-renderizado da própria entidade:

````markdown
```svg-diagram
Syndromes/Cardiovasculares/Síncope/diagrams/diagnosis.svg|Fluxograma diagnóstico da síncope
```
````

- O arquivo publicado é o `.svg`; o navegador não compila TikZ.
- O SVG deve mostrar o diagrama inteiro, sem recortar o `viewBox` por margens presumidas.
- A prévia se adapta à largura do artigo e pode ser clicada para abrir o lightbox com zoom.
- As fontes precisam estar incorporadas no SVG para que acentos e caracteres especiais funcionem online.
- Antes de publicar alterações em `.tikz`, execute `npm run diagrams`.
- Geometria, setas, matriz, forks e regras de compactação estão documentados em `FLOWCHARTS.md` e são obrigatórios.

## Validação e publicação

Antes do push:

```bash
npm run diagrams   # somente quando houver mudança em TikZ
npm run build
```

- Publique fontes e imagens renderizadas juntas.
- Não inclua `node_modules`, `dist`, logs ou arquivos temporários.
- O workflow do GitHub Pages deve terminar com `success` para que a publicação seja considerada concluída.
- O HTML do GitHub Pages pode permanecer em cache por alguns minutos; use recarga forçada ou um parâmetro de consulta para verificar imediatamente um novo bundle.
- Para o procedimento operacional completo, consulte `ATUALIZAR_GITHUB_PAGES.md`.

## Checklist Antes de Finalizar

- O artigo cobre a entidade de forma geral?
- Diagnóstico e manifestações têm evidência primária e síntese quando possível?
- Diagnóstico, sinais e exames trazem PIRD quando a evidência é central?
- Tratamento tem dose/posologia?
- Tratamento tem evidência primária e síntese/diretriz?
- Tratamento traz PICO quando a evidência é central?
- Existem poucos blockquotes, mas relevantes?
- As footnotes sustentam as alegações clínicas?
- Não há menções metatextuais?
- O texto principal está legível sem virar resumo de estudo?
- `npm run build` passa?
- `npm run lint` passa?
