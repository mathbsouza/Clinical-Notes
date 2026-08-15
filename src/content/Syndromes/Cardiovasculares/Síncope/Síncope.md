---
title: Síncope
entityGroup: Síndromes
category: Cardiovasculares
summary: Perda transitória da consciência por hipoperfusão cerebral global, de início rápido, curta duração e recuperação espontânea completa.
updated: 2026-08-14
tags: síncope, perda de consciência, cardiovascular
---

## Definição

Síncope é uma **perda transitória da consciência causada por hipoperfusão cerebral global**, caracterizada por início rápido, curta duração e recuperação espontânea completa. Em geral, há perda do tônus postural. Deve ser diferenciada de outras causas de perda transitória da consciência, como crises epilépticas, intoxicações, distúrbios metabólicos e causas psicogênicas.

## Etiologia

```etiology-flowchart
flowchart TD
    A([Síncope]) --> B[Reflexa / neuromediada]
    A --> C[Hipotensão ortostática]
    A --> D[Cardíaca]
    B --> B1[Vasovagal]
    B --> B2[Situacional:<br/>tosse, micção, defecação ou deglutição]
    B --> B3[Síndrome do seio carotídeo]
    B --> B4[Formas atípicas]
    C --> C1[Disfunção autonômica primária]
    C --> C2[Disfunção autonômica secundária]
    C --> C3[Induzida por fármacos]
    C --> C4[Hipovolemia]
    D --> D1[Arritmias:<br/>bradi ou taquiarritmias]
    D --> D2[Doença estrutural cardíaca]
    D --> D3[Doença cardiopulmonar:<br/>TEP ou hipertensão pulmonar]
    D --> D4[Isquemia miocárdica]

    classDef root fill:#ea580c,stroke:#fdba74,color:#fff7ed,stroke-width:2px;
    classDef group fill:#431407,stroke:#fb923c,color:#ffedd5,stroke-width:2px;
    classDef cause fill:#262626,stroke:#fb923c,color:#f5f5f5;
    class A root;
    class B,C,D group;
    class B1,B2,B3,B4,C1,C2,C3,C4,D1,D2,D3,D4 cause;
```

## Diagnóstico

```diagnostic-flowchart
flowchart TD
    A([Perda transitória da consciência]) --> B{Instabilidade clínica ou<br/>condição tempo-dependente?}
    B -- Sim --> C[ABCDE + monitorização<br/>glicemia + ECG]
    C --> C1[Tratar imediatamente conforme o contexto:<br/>arritmia grave, SCA, TEP, dissecção,<br/>hemorragia, choque ou causa neurológica]
    B -- Não --> D{O evento foi síncope?<br/>Início rápido, curta duração,<br/>perda do tônus e recuperação completa}
    D -- Não ou duvidoso --> E[Investigar mimetizadores:<br/>causa metabólica, epilepsia, PTC psicogênica,<br/>queda, cataplexia ou déficit neurológico]
    D -- Sim ou provável --> F[Avaliação inicial obrigatória:<br/>história + testemunha + exame físico<br/>ortostase + ECG + glicemia]
    F --> G{Há causa provável<br/>após avaliação inicial?}
    G -- Reflexa --> H[Gatilho típico, pródromos autonômicos<br/>ou situação característica]
    G -- Ortostática --> I[Sintomas ao levantar + queda da PA<br/>PAS ≥ 20 ou PAD ≥ 10 mmHg em até 3 min]
    G -- Cardíaca / alto risco --> J[Monitorização e avaliação cardiológica urgente<br/>± ecocardiograma, teste de esforço<br/>e exames dirigidos]
    G -- Incerta --> K{Estratificação de risco}
    H --> L[Baixo risco:<br/>diagnóstico clínico e seguimento]
    I --> K
    J --> M[Observação monitorizada<br/>ou internação]
    K -- Alto --> M
    K -- Intermediário --> N[Unidade de observação<br/>e monitorização dirigida]
    K -- Baixo --> O[Alta com seguimento<br/>ou investigação ambulatorial]
    M --> P{Síncope permanece<br/>inexplicada ou recorrente?}
    N --> P
    O --> P
    P -- Não --> Q([Seguimento clínico])
    P -- Sim --> R[Investigação dirigida à hipótese]
    R --> R1[Arritmia: Holter, monitor externo<br/>ou monitor implantável]
    R --> R2[Reflexa / ortostática:<br/>teste de inclinação ± testes autonômicos]
    R --> R3[Doença estrutural / ECG anormal:<br/>eco ± ressonância ± estudo eletrofisiológico]
    R --> R4[Outras hipóteses: exames dirigidos;<br/>neuroimagem e EEG não são rotina]
    R1 --> Q
    R2 --> Q
    R3 --> Q
    R4 --> Q

    classDef start fill:#ea580c,stroke:#fdba74,color:#fff7ed,stroke-width:2px;
    classDef decision fill:#431407,stroke:#fb923c,color:#ffedd5,stroke-width:2px;
    classDef urgent fill:#450a0a,stroke:#f87171,color:#fee2e2,stroke-width:2px;
    classDef action fill:#262626,stroke:#fb923c,color:#f5f5f5;
    classDef endpoint fill:#14532d,stroke:#4ade80,color:#dcfce7,stroke-width:2px;
    class A start;
    class B,D,G,K,P decision;
    class C,C1,J,M urgent;
    class F,H,I,N,O,R,R1,R2,R3,R4,E action;
    class L,Q endpoint;
```
