---
title: Modelos de Análise Estatística
entityGroup: MBE
category: Análise Estatística
summary: Escolha do modelo de regressão conforme o tipo de desfecho: contínuo, binário, contagem ou tempo até evento.
updated: 2026-08-15
tags: MBE, estatística, regressão linear, regressão logística, regressão de Poisson, regressão de Cox
---

## Escolha do modelo

- O modelo estatístico deve ser escolhido principalmente pela **natureza do desfecho**, e não apenas pelas variáveis de ajuste.

| Tipo de desfecho | Modelo usual | Exemplo |
|---|---|---|
| Contínuo | Regressão linear | Pressão arterial, glicemia ou tempo de internação. |
| Binário | Regressão logística | Apresentou ou não apresentou pelo menos uma infecção. |
| Contagem ou taxa | Regressão de Poisson | Número de infecções durante um período de seguimento. |
| Tempo até evento | Regressão de Cox | Tempo até a primeira infecção, óbito ou recorrência. |

## Modelos de Análise

### Regressão de Poisson

- A regressão de Poisson é indicada quando o desfecho corresponde ao **número de eventos** observado em determinado intervalo. Seus coeficientes podem ser apresentados como **razões de taxas de incidência** (*incidence rate ratios* — IRR).

Quando os participantes apresentam tempos de observação diferentes, deve-se incorporar o logaritmo do tempo sob risco como *offset*. O modelo permite ajustar simultaneamente para potenciais confundidores.

#### Exemplo

Se um estudo pretende comparar o **número de infecções respiratórias ocorridas durante um ano**, ajustando para variáveis confundidoras, a regressão de Poisson é a escolha inicial mais apropriada.

- A regressão linear é inadequada porque o desfecho é uma contagem discreta, geralmente assimétrica e limitada a valores não negativos.
- A regressão logística responderia se ocorreu **ao menos uma infecção**, mas descartaria a informação sobre o número de episódios.
- A regressão de Cox analisaria o **tempo até um evento**, e não diretamente a quantidade total de infecções.

#### Verificação dos pressupostos

O modelo de Poisson pressupõe que a média e a variância condicionais da contagem sejam semelhantes. Se a variância for substancialmente maior que a média (**sobredispersão**), considere:

- regressão binomial negativa;
- erros-padrão robustos;
- modelos para excesso de zeros, quando clinicamente justificável;
- métodos que considerem correlação intrapaciente, caso existam medidas repetidas ou eventos recorrentes.
