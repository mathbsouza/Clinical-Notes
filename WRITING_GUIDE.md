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

## Uso de Citações Diretas

Use blockquotes com `>` apenas para trechos centrais que sustentam decisões importantes.

Não coloque uma citação direta antes de todo parágrafo. Prefira poucos blocos mais densos.

Bom padrão:

```markdown
> “Trecho traduzido importante, com dado ou conclusão central. Segundo trecho complementar se necessário.”[^referencia]

Texto clínico interpretando a implicação prática daquela evidência.[^referencia]
```

As citações em `>` devem ser:

- traduzidas para português;
- fiéis ao sentido original;
- curtas ou moderadas;
- usadas quando sustentam uma decisão diagnóstica, terapêutica ou prognóstica importante.

Se o trecho original for em inglês, a footnote deve deixar claro qual é a fonte.

## Footnotes

Use footnotes Markdown:

```markdown
Texto clínico.[^chave]

[^chave]: Fonte, desenho, população, desfecho principal e resultado relevante.
```

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

Bom uso:

- perguntas práticas;
- sinais e sintomas;
- prioridades iniciais;
- classes terapêuticas;
- checklist de seguimento.

Evite listas longas quando um parágrafo curto resolver melhor.

Evite fragmentação excessiva. Muitos subtítulos curtos fazem a nota parecer uma colagem de cartões. Prefira seções maiores, com parágrafos breves e bullets somente para decisões, critérios, doses, contraindicações ou listas realmente escaneáveis.

## Tabelas

Use tabelas quando houver comparação ou dose.

Boas tabelas:

- classificação por fração de ejeção;
- pontos de corte diagnósticos;
- dose inicial e dose-alvo;
- diferenças entre fenótipos.

Toda tabela com conteúdo clínico deve ter footnote ou referências nas células/linhas relevantes.

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
