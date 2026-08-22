import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Result = { id: string; title: string; text: string };
type Choice = { label: string; next?: string; result?: string };
type Step = { question: string; hint?: string; choices: Choice[] };
type WizardConfig = {
  title: string;
  anchorId: string;
  start: string;
  steps: Record<string, Step>;
  results: Result[];
};

const configs: Record<string, WizardConfig> = {
  hypernatremia: {
    title: 'Tratamento de Hipernatremia',
    anchorId: 'tratamento-de-hipernatremia',
    start: 'instability',
    steps: {
      instability: { question: 'Há choque ou instabilidade hemodinâmica?', choices: [{ label: 'Sim', result: 'resuscitate' }, { label: 'Não', next: 'duration' }] },
      duration: { question: 'Qual é a duração?', hint: 'Se desconhecida, conduzir como crônica.', choices: [{ label: 'Aguda (<48 h) por carga de sódio', result: 'acute-sodium' }, { label: 'Crônica ou desconhecida', next: 'volume' }] },
      volume: { question: 'Qual é o estado volêmico predominante?', choices: [{ label: 'Hipovolêmica', result: 'hypovolemic' }, { label: 'Euvolêmica', result: 'euvolemic' }, { label: 'Hipervolêmica', result: 'hypervolemic' }] },
    },
    results: [
      { id: 'resuscitate', title: 'Instável', text: 'Priorizar ABC e perfusão.\nAdministrar cristaloide isotônico até estabilização hemodinâmica.\nApós estabilizar, recalcular déficit de água livre e planejar correção do Na.' },
      { id: 'acute-sodium', title: 'Aguda por carga hipertônica de sódio', text: 'Interromper a fonte de sódio.\nUsar água livre enteral ou glicose 5% IV para queda mais rápida do Na nas primeiras horas.\nConsiderar diálise se carga maciça, insuficiência renal ou sintomas graves.' },
      { id: 'hypovolemic', title: 'Hipernatremia hipovolêmica', text: 'Restaurar volume com cristaloide isotônico.\nQuando perfusão estiver adequada, repor déficit de água livre com água enteral ou glicose 5%.\nMonitorar Na a cada 4-6 horas no início.' },
      { id: 'euvolemic', title: 'Hipernatremia euvolêmica', text: 'Pensar em diabetes insipidus ou perda insensível sem reposição.\nRepor água livre e medir diurese/osmolaridade urinária.\nSe diabetes insipidus central provável, testar resposta à desmopressina.' },
      { id: 'hypervolemic', title: 'Hipernatremia hipervolêmica', text: 'Interromper sódio hipertônico.\nUsar glicose 5% associada a diurético de alça se houver congestão.\nConsiderar diálise em insuficiência renal, hipervolemia grave ou sódio muito elevado.' },
    ],
  },
  hypokalemia: {
    title: 'Tratamento de Hipocalemia',
    anchorId: 'tratamento-de-hipocalemia',
    start: 'severe',
    steps: {
      severe: { question: 'Há arritmia, paralisia, fraqueza grave, insuficiência respiratória ou K <= 2,5?', choices: [{ label: 'Sim', result: 'iv-urgent' }, { label: 'Não', next: 'oral' }] },
      oral: { question: 'Via oral é possível e trato gastrointestinal funciona?', choices: [{ label: 'Sim', result: 'oral' }, { label: 'Não', result: 'iv-nonurgent' }] },
    },
    results: [
      { id: 'iv-urgent', title: 'Hipocalemia grave ou sintomática', text: 'Monitorização cardíaca.\nKCl IV em solução sem glicose; bolus/infusão conforme protocolo institucional.\nDosar K a cada 2-4 horas e corrigir magnésio.' },
      { id: 'oral', title: 'Reposição oral', text: 'Preferir KCl oral em doses divididas.\nReavaliar perdas, diuréticos e distúrbio ácido-base.\nCorrigir magnésio se baixo ou suspeito.' },
      { id: 'iv-nonurgent', title: 'Reposição IV não emergencial', text: 'Usar KCl IV em ritmo controlado, preferencialmente em solução sem glicose.\nMonitorar função renal, acesso venoso e K seriado.\nMigrar para via oral quando possível.' },
    ],
  },
  hyperkalemia: {
    title: 'Tratamento de Hipercalemia',
    anchorId: 'tratamento-de-hipercalemia',
    start: 'ecg',
    steps: {
      ecg: { question: 'Há alteração no ECG, arritmia, fraqueza/paralisia ou K muito elevado?', choices: [{ label: 'Sim', result: 'calcium' }, { label: 'Não', next: 'renal' }] },
      renal: { question: 'Há DRC avançada, injúria renal importante ou liberação contínua de K?', choices: [{ label: 'Sim', result: 'dialysis-consider' }, { label: 'Não', result: 'remove' }] },
    },
    results: [
      { id: 'calcium', title: 'Emergência hipercalêmica', text: 'Administrar cálcio IV para estabilizar membrana.\nFazer insulina com glicose; beta-agonista pode ser adjuvante.\nPlanejar remoção de K e repetir ECG/K seriado.' },
      { id: 'dialysis-consider', title: 'Alto risco de remoção insuficiente', text: 'Acionar nefrologia precocemente.\nUsar medidas temporizadoras enquanto organiza remoção definitiva.\nConsiderar diálise se DRC avançada, IRA grave ou lise/rabdomiólise persistente.' },
      { id: 'remove', title: 'Sem critérios imediatos de emergência', text: 'Suspender fontes de K e fármacos causais.\nPromover eliminação com diurético se houver diurese, quelante se indicado, e tratar acidose/hiperglicemia.\nMonitorar K seriado.' },
    ],
  },
  hypocalcemia: {
    title: 'Tratamento de Hipocalcemia',
    anchorId: 'tratamento-de-hipocalcemia',
    start: 'symptoms',
    steps: {
      symptoms: { question: 'Há tetania, convulsão, laringoespasmo, arritmia ou QT muito prolongado?', choices: [{ label: 'Sim', result: 'iv-calcium' }, { label: 'Não', next: 'magnesium' }] },
      magnesium: { question: 'Magnésio está baixo ou há suspeita clínica?', choices: [{ label: 'Sim', result: 'mg-correct' }, { label: 'Não', result: 'oral-calcium' }] },
    },
    results: [
      { id: 'iv-calcium', title: 'Hipocalcemia sintomática', text: 'Gluconato de cálcio IV com monitorização cardíaca.\nRepetir bolus se sintomas persistirem e considerar infusão contínua.\nInvestigar e tratar causa associada.' },
      { id: 'mg-correct', title: 'Hipocalcemia com hipomagnesemia', text: 'Repor magnésio; hipocalcemia pode ser refratária sem essa correção.\nAssociar cálcio oral ou IV conforme sintomas e gravidade.\nReavaliar PTH, vitamina D e fósforo.' },
      { id: 'oral-calcium', title: 'Hipocalcemia leve ou crônica', text: 'Usar cálcio oral e vitamina D conforme etiologia.\nMonitorar cálcio, fósforo, magnésio e função renal.\nAjustar tratamento conforme PTH e 25-OH vitamina D.' },
    ],
  },
  hypercalcemia: {
    title: 'Tratamento de Hipercalcemia',
    anchorId: 'tratamento-de-hipercalcemia',
    start: 'severity',
    steps: {
      severity: { question: 'Cálcio >= 14 mg/dL, sintomas neurológicos, arritmia ou injúria renal?', choices: [{ label: 'Sim', result: 'severe' }, { label: 'Não', next: 'pth' }] },
      pth: { question: 'PTH está alto ou inapropriadamente normal?', choices: [{ label: 'Sim', result: 'pth-mediated' }, { label: 'Não', result: 'pth-suppressed' }] },
    },
    results: [
      { id: 'severe', title: 'Hipercalcemia grave', text: 'Hidratar com cristaloide isotônico se não houver contraindicação.\nAdicionar calcitonina para resposta rápida quando sintomática/grave.\nUsar bisfosfonato IV ou denosumabe conforme função renal e etiologia.' },
      { id: 'pth-mediated', title: 'PTH-mediada', text: 'Avaliar hiperparatireoidismo primário/terciário e lítio.\nHidratar se necessário e evitar tiazídicos/cálcio excessivo.\nEncaminhar para manejo definitivo quando houver critério cirúrgico.' },
      { id: 'pth-suppressed', title: 'PTH suprimido', text: 'Investigar malignidade, vitamina D, granulomatose e tireotoxicose.\nTratar causa; em malignidade, preferir antirreabsortivo e controle de recorrência.\nMonitorar cálcio, fósforo e função renal.' },
    ],
  },
  hypomagnesemia: {
    title: 'Tratamento de Hipomagnesemia',
    anchorId: 'tratamento-de-hipomagnesemia',
    start: 'severe',
    steps: {
      severe: { question: 'Há arritmia, convulsão, tetania ou Mg muito baixo?', choices: [{ label: 'Sim', result: 'iv' }, { label: 'Não', next: 'oral' }] },
      oral: { question: 'Via oral é possível?', choices: [{ label: 'Sim', result: 'oral' }, { label: 'Não', result: 'iv-controlled' }] },
    },
    results: [
      { id: 'iv', title: 'Hipomagnesemia sintomática', text: 'Sulfato de magnésio IV com monitorização conforme gravidade.\nCorrigir K e Ca associados.\nReavaliar Mg seriado, pois o estoque corporal pode permanecer baixo.' },
      { id: 'oral', title: 'Reposição oral', text: 'Usar sal de magnésio oral em doses divididas.\nAtenção a diarreia como efeito limitante.\nSuspender perdas e fármacos causais quando possível.' },
      { id: 'iv-controlled', title: 'Reposição IV controlada', text: 'Usar magnésio IV em infusão lenta.\nReduzir dose e monitorar reflexos/função renal em DRC.\nMigrar para via oral após estabilização.' },
    ],
  },
  hypermagnesemia: {
    title: 'Tratamento de Hipermagnesemia',
    anchorId: 'tratamento-de-hipermagnesemia',
    start: 'toxicity',
    steps: {
      toxicity: { question: 'Há hipotensão, bradicardia, hiporreflexia profunda ou depressão respiratória?', choices: [{ label: 'Sim', result: 'calcium-dialysis' }, { label: 'Não', next: 'kidney' }] },
      kidney: { question: 'Há insuficiência renal significativa?', choices: [{ label: 'Sim', result: 'renal' }, { label: 'Não', result: 'supportive' }] },
    },
    results: [
      { id: 'calcium-dialysis', title: 'Toxicidade grave', text: 'Suspender magnésio.\nAdministrar cálcio IV para antagonizar efeitos cardíacos/neuromusculares.\nConsiderar diálise, especialmente se insuficiência renal.' },
      { id: 'renal', title: 'Hipermagnesemia com insuficiência renal', text: 'Suspender antiácidos, laxativos, enemas e reposições.\nMonitorar ECG, reflexos e respiração.\nConsiderar diálise se níveis altos ou sintomas.' },
      { id: 'supportive', title: 'Leve e rim funcionante', text: 'Suspender fontes de magnésio.\nHidratar e promover diurese se apropriado.\nMonitorar Mg até queda sustentada.' },
    ],
  },
  hypophosphatemia: {
    title: 'Tratamento de Hipofosfatemia',
    anchorId: 'tratamento-de-hipofosfatemia',
    start: 'severe',
    steps: {
      severe: { question: 'Fósforo <1 mg/dL, sintomas graves ou impossibilidade de via oral?', choices: [{ label: 'Sim', result: 'iv' }, { label: 'Não', result: 'oral' }] },
    },
    results: [
      { id: 'iv', title: 'Hipofosfatemia grave', text: 'Repor fosfato IV com monitorização de cálcio, potássio, magnésio e função renal.\nEscolher fosfato de potássio se também houver hipocalemia; evitar excesso se K alto.\nReduzir dose em insuficiência renal.' },
      { id: 'oral', title: 'Hipofosfatemia leve/moderada', text: 'Repor fosfato oral em doses divididas.\nTratar realimentação, alcoolismo, perdas ou ligadores de fosfato.\nMonitorar eletrólitos e sintomas musculares/respiratórios.' },
    ],
  },
  hyperphosphatemia: {
    title: 'Tratamento de Hiperfosfatemia',
    anchorId: 'tratamento-de-hiperfosfatemia',
    start: 'acute',
    steps: {
      acute: { question: 'Há lise tumoral, rabdomiólise, IRA ou hipocalcemia sintomática?', choices: [{ label: 'Sim', result: 'acute' }, { label: 'Não', next: 'ckd' }] },
      ckd: { question: 'É doença renal crônica com hiperfosfatemia persistente?', choices: [{ label: 'Sim', result: 'ckd' }, { label: 'Não', result: 'cause' }] },
    },
    results: [
      { id: 'acute', title: 'Hiperfosfatemia aguda', text: 'Tratar lise/rabdomiólise/IRA e suspender fósforo exógeno.\nMonitorar cálcio e ECG se hipocalcemia.\nConsiderar diálise se grave, persistente ou com insuficiência renal.' },
      { id: 'ckd', title: 'Hiperfosfatemia na DRC', text: 'Reduzir fósforo dietético considerando fontes e aditivos.\nUsar quelante se persistente; limitar quelante à base de cálcio quando houver hipercalcemia ou risco de calcificação.\nAjustar diálise quando aplicável.' },
      { id: 'cause', title: 'Sem DRC persistente', text: 'Repetir exame e revisar hemólise, enemas, suplementos e vitamina D.\nTratar causa específica.\nMonitorar fósforo, cálcio, PTH e função renal conforme cenário.' },
    ],
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <button className="magic-flowchart__copy" type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>;
}

function TreatmentCard({ result }: { result: Result }) {
  return <section className="magic-flowchart__result">
    <div className="magic-flowchart__result-head"><h4>{result.title}</h4><CopyButton text={result.text} /></div>
    <p>{result.text}</p>
  </section>;
}

export default function ElectrolyteTreatmentWizard({ kind }: { kind: keyof typeof configs }) {
  const config = configs[kind];
  const [current, setCurrent] = useState(config.start);
  const [history, setHistory] = useState<string[]>([]);
  const [resultId, setResultId] = useState<string>();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!showAll) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setShowAll(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showAll]);

  const choose = (choice: Choice) => {
    setHistory((items) => [...items, current]);
    if (choice.result) setResultId(choice.result);
    if (choice.next) setCurrent(choice.next);
  };
  const back = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setCurrent(previous);
    setResultId(undefined);
  };
  const reset = () => { setCurrent(config.start); setHistory([]); setResultId(undefined); };
  const result = config.results.find((item) => item.id === resultId);
  const step = config.steps[current];

  return <div className="magic-flowchart" id={config.anchorId}>
    <span className="magic-flowchart__badge">Magic Flowchart</span>
    <div className="magic-flowchart__top">
      <h3>{config.title}</h3>
      <button type="button" onClick={() => setShowAll(true)}>Ver todas</button>
    </div>
    {result ? <TreatmentCard result={result} /> : <div className="magic-flowchart__question">
      <h4>{step.question}</h4>
      {step.hint && <p>{step.hint}</p>}
      <div className="magic-flowchart__options">{step.choices.map((choice) => <button key={choice.label} type="button" onClick={() => choose(choice)}>{choice.label}</button>)}</div>
    </div>}
    <div className="magic-flowchart__nav">
      {(history.length > 0 || result) && <button type="button" onClick={back}>Voltar</button>}
      {(history.length > 0 || result) && <button type="button" onClick={reset}>Reiniciar</button>}
    </div>
    {showAll && createPortal(<div className="magic-flowchart__modal" role="dialog" aria-modal="true" aria-label="Todas as condutas" onClick={() => setShowAll(false)}>
      <div className="magic-flowchart__modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="magic-flowchart__modal-head"><h3>Todas as condutas</h3><button type="button" onClick={() => setShowAll(false)} aria-label="Fechar">×</button></div>
        <div className="magic-flowchart__modal-list">{config.results.map((item) => <TreatmentCard key={item.id} result={item} />)}</div>
      </div>
    </div>, document.body)}
  </div>;
}
