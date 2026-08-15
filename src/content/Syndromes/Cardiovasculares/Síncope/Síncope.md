---
title: Síncope
entityGroup: Síndromes
category: Cardiovasculares
summary: Perda transitória da consciência por hipoperfusão cerebral global, de início rápido, curta duração e recuperação espontânea completa.
updated: 2026-08-14
tags: síncope, perda de consciência, cardiovascular
---

## Definição

- Síncope é uma **perda transitória da consciência causada por hipoperfusão cerebral global**, caracterizada por início rápido, curta duração e recuperação espontânea completa.[^UpToDate-Syncope-in-adults]
- Em geral, há perda do tônus postural. Deve ser diferenciada de outras causas de perda transitória da consciência, como crises epilépticas, intoxicações, distúrbios metabólicos e causas psicogênicas.

## Etiologia

```tikz
% Fluxograma etiológico da síncope | Principais grupos etiológicos da síncope
\usetikzlibrary{positioning,arrows.meta}
\begin{tikzpicture}[
  font=\sffamily,
  >={Stealth[length=2.6mm]},
  flow/.style={draw=orange!70!black, line width=.8pt, rounded corners=3pt,
    fill=black!92, text=white, align=left, text width=4.5cm, inner sep=9pt},
  title/.style={flow, text width=3cm, align=center, font=\sffamily\bfseries},
  arrow/.style={->, orange!78!white, line width=1pt, rounded corners=2pt}
]
  \node[title] (syncope) {Síncope};
  \node[flow, below left=18mm and 31mm of syncope] (reflex) {\textbf{Reflexa / neuromediada}\\[3pt]
    $\bullet$ Vasovagal\\ $\bullet$ Situacional: tosse, micção, defecação ou deglutição\\
    $\bullet$ Síndrome do seio carotídeo\\ $\bullet$ Formas atípicas};
  \node[flow, below=18mm of syncope] (orthostatic) {\textbf{Hipotensão ortostática}\\[3pt]
    $\bullet$ Disfunção autonômica primária\\ $\bullet$ Disfunção autonômica secundária\\
    $\bullet$ Induzida por fármacos\\ $\bullet$ Hipovolemia};
  \node[flow, below right=18mm and 31mm of syncope] (cardiac) {\textbf{Cardíaca}\\[3pt]
    $\bullet$ Arritmias: bradi ou taquiarritmias\\ $\bullet$ Doença estrutural cardíaca\\
    $\bullet$ Doença cardiopulmonar: TEP ou hipertensão pulmonar\\ $\bullet$ Isquemia miocárdica};

  \draw[arrow] (syncope.south) -- ++(0,-7mm) -| (reflex.north);
  \draw[arrow] (syncope.south) -- (orthostatic.north);
  \draw[arrow] (syncope.south) -- ++(0,-7mm) -| (cardiac.north);
\end{tikzpicture}
```

## Diagnóstico

```tikz
% Fluxograma diagnóstico da síncope | Fluxo de avaliação, estratificação e investigação da síncope
\usetikzlibrary{positioning,arrows.meta,shapes.geometric}
\begin{tikzpicture}[
  font=\sffamily\scriptsize,
  >={Stealth[length=2.3mm]},
  box/.style={draw=orange!65!black, line width=.75pt, rounded corners=2pt,
    fill=black!92, text=white, align=center, text width=4.2cm, minimum height=10mm, inner sep=6pt},
  decision/.style={box, diamond, aspect=2.3, text width=3.6cm, inner sep=2pt},
  urgent/.style={box, draw=red!75!orange, fill=red!14!black},
  endpoint/.style={box, draw=green!60!orange},
  arrow/.style={->, orange!80!white, line width=.9pt, rounded corners=2pt},
  answer/.style={font=\sffamily\tiny\bfseries, text=orange!35!white, fill=black, inner sep=2pt}
]
  \node[box] (start) {Perda transitória da consciência};
  \node[decision, below=12mm of start] (unstable) {Instabilidade clínica ou condição tempo-dependente?};
  \node[urgent, left=35mm of unstable] (stabilize) {\textbf{ABCDE + monitorização}\\Glicemia + ECG; tratar imediatamente a condição grave};
  \node[decision, below=14mm of unstable] (syncope) {O evento foi síncope?};
  \node[box, left=35mm of syncope] (mimics) {\textbf{Investigar mimetizadores}\\Metabólicas, epilepsia, PTC psicogênica, queda, cataplexia ou déficit focal};
  \node[box, below=14mm of syncope] (initial) {\textbf{Avaliação inicial obrigatória}\\História e testemunha, exame físico, ortostase, ECG e glicemia};
  \node[decision, below=14mm of initial] (cause) {Há causa provável após a avaliação inicial?};

  \node[box, below left=20mm and 45mm of cause] (reflex) {\textbf{Reflexa}\\Gatilho típico, pródromos autonômicos ou situação característica};
  \node[box, below left=20mm and 8mm of cause] (orthostatic) {\textbf{Ortostática}\\Sintomas ao levantar e queda da pressão arterial};
  \node[urgent, below right=20mm and 8mm of cause] (cardiac) {\textbf{Cardíaca / alto risco}\\Monitorização e avaliação cardiológica urgente};
  \node[decision, below right=20mm and 45mm of cause] (risk) {Estratificação de risco};

  \node[endpoint, below=15mm of reflex] (clinical) {\textbf{Baixo risco}\\Diagnóstico clínico e seguimento};
  \node[urgent, below=15mm of cardiac] (admit) {\textbf{Alto risco}\\Observação monitorizada ou internação};
  \node[box, right=8mm of admit] (observe) {\textbf{Risco intermediário}\\Observação e monitorização dirigida};
  \node[endpoint, right=8mm of observe] (discharge) {\textbf{Baixo risco}\\Alta com seguimento ambulatorial};
  \node[decision, below=22mm of observe] (unexplained) {Síncope inexplicada ou recorrente?};
  \node[box, below=16mm of unexplained] (investigate) {Investigação dirigida à hipótese};

  \node[box, below left=18mm and 45mm of investigate] (arrhythmia) {\textbf{Arritmia}\\Holter, monitor externo ou implantável};
  \node[box, below left=18mm and 8mm of investigate] (reflextests) {\textbf{Reflexa / ortostática}\\Inclinação e testes autonômicos selecionados};
  \node[box, below right=18mm and 8mm of investigate] (structural) {\textbf{Doença estrutural / ECG anormal}\\Eco, ressonância ou estudo eletrofisiológico};
  \node[box, below right=18mm and 45mm of investigate] (other) {\textbf{Outras hipóteses}\\Exames dirigidos; neuroimagem e EEG não são rotina};
  \node[endpoint, below=25mm of investigate] (followup) {Seguimento clínico};

  \draw[arrow] (start.south) -- (unstable.north);
  \draw[arrow] (unstable.west) -- node[answer,above]{Sim} (stabilize.east);
  \draw[arrow] (unstable.south) -- node[answer,right]{Não} (syncope.north);
  \draw[arrow] (syncope.west) -- node[answer,above]{Não ou duvidoso} (mimics.east);
  \draw[arrow] (syncope.south) -- node[answer,right]{Sim ou provável} (initial.north);
  \draw[arrow] (initial.south) -- (cause.north);
  \draw[arrow] (cause.west) -- ++(-8mm,0) |- node[answer,pos=.25,left]{Reflexa} (reflex.north);
  \draw[arrow] (cause.south) -- ++(0,-7mm) -| node[answer,pos=.25,left]{Ortostática} (orthostatic.north);
  \draw[arrow] (cause.east) -- ++(8mm,0) |- node[answer,pos=.25,right]{Cardíaca} (cardiac.north);
  \draw[arrow] (cause.east) -- ++(16mm,0) |- node[answer,pos=.25,right]{Incerta} (risk.north);
  \draw[arrow] (reflex.south) -- (clinical.north);
  \draw[arrow] (orthostatic.south) -- ++(0,-6mm) -| (unexplained.west);
  \draw[arrow] (cardiac.south) -- (admit.north);
  \draw[arrow] (risk.west) -- node[answer,above]{Alto} (admit.east);
  \draw[arrow] (risk.south) |- node[answer,pos=.25,right]{Intermediário} (observe.east);
  \draw[arrow] (risk.east) -- ++(7mm,0) |- node[answer,pos=.25,right]{Baixo} (discharge.north);
  \draw[arrow] (admit.south) |- (unexplained.west);
  \draw[arrow] (observe.south) -- (unexplained.north);
  \draw[arrow] (discharge.south) |- (unexplained.east);
  \draw[arrow] (unexplained.south) -- node[answer,right]{Sim} (investigate.north);
  \draw[arrow] (unexplained.west) -- ++(-12mm,0) |- node[answer,pos=.25,left]{Não} (followup.west);
  \draw[arrow] (investigate.west) -- ++(-8mm,0) |- (arrhythmia.north);
  \draw[arrow] (investigate.south) -- ++(0,-6mm) -| (reflextests.north);
  \draw[arrow] (investigate.south) -- ++(0,-10mm) -| (structural.north);
  \draw[arrow] (investigate.east) -- ++(8mm,0) |- (other.north);
  \draw[arrow] (arrhythmia.south) |- (followup.west);
  \draw[arrow] (reflextests.south) |- (followup.west);
  \draw[arrow] (structural.south) |- (followup.east);
  \draw[arrow] (other.south) |- (followup.east);
\end{tikzpicture}
```
[^UpToDate-Syncope-in-adults] "Syncope is a clinical syndrome in which transient loss of consciousness (TLOC) is caused by a period of inadequate cerebral blood flow and oxygenation, most often the result of an abrupt drop of systemic blood pressure." Syncope in adults: Clinical manifestations and initial diagnostic evaluation, UpToDate.
