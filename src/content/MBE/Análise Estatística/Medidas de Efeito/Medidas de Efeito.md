---
title: Medidas de Efeito
entityGroup: MBE
category: Análise Estatística
summary: Interpretação das medidas de efeito produzidas pelos principais modelos estatísticos.
updated: 2026-08-15
tags: MBE, estatística, medidas de efeito, odds ratio, razão de chances, regressão logística
---

## Razão de chances

- A **razão de chances** (*odds ratio* — OR) é a medida de efeito obtida pela regressão logística.

- A regressão logística modela o logaritmo natural das chances, denominado **logit**:

`ln(odds) = β₀ + β₁x`

- Ao exponenciar o coeficiente `β₁`, obtém-se a razão de chances associada à variável `x`:

`odds ratio = e^β₁`

- Portanto, o uso da OR não corresponde a uma escolha metodológica adicional: é uma característica intrínseca da formulação matemática da regressão logística.

## Interpretação

- `OR = 1`: não há associação entre a variável explicativa e as chances do desfecho.
- `OR > 1`: a variável está associada a maiores chances do desfecho.
- `OR < 1`: a variável está associada a menores chances do desfecho.

A OR exponenciada de `β₁` expressa a mudança multiplicativa nas chances do desfecho para cada aumento de uma unidade em `x`, mantendo constantes as demais variáveis do modelo.
