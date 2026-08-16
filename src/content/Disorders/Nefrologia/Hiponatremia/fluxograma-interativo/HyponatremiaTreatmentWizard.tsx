import { useEffect, useState } from 'react';

type Result = { id: string; title: string; text: string };
type Choice = { label: string; next?: string; result?: string };
type Step = { question: string; hint?: string; choices: Choice[] };

const results: Result[] = [
  { id: 'acute-auto', title: 'Aguda · assintomática · autocorreção', text: 'Não administrar NaCl 3%.\nMonitorar Na e diurese de hora em hora até aumento de 4–6 mmol/L.\nSe o Na cair: NaCl 3% 50 mL IV em bolus.' },
  { id: 'acute-no-auto', title: 'Aguda · assintomática · sem autocorreção', text: 'NaCl 3% 50 mL IV em bolus.\nMonitorar Na e diurese de hora em hora.' },
  { id: 'bolus', title: 'Sintomática ou com patologia intracraniana', text: 'NaCl 3% 100 mL IV em 10 minutos.\nSe persistirem sintomas, repetir até 2 vezes (máximo inicial: 300 mL).\nDosar Na após cada bolus; meta inicial: aumento de 4–6 mmol/L.\nSem atingir a meta: continuar NaCl 3% em infusão controlada, visando +1 mmol/L/h.\nMeta atingida sem melhora: suspender a correção rápida e investigar outra causa dos sintomas.' },
  { id: 'chronic-moderate-symptoms', title: 'Crônica · Na ≥120 · sintomas leves/moderados', text: 'Internar. Não administrar NaCl 3% de rotina.\nTratar a causa, suspender soluções hipotônicas e restringir água livre.\nMonitorar Na a cada 6–12 horas.' },
  { id: 'chronic-moderate-asymptomatic', title: 'Crônica · Na ≥120 · assintomática', text: 'Não administrar NaCl 3%.\nTratar a causa, revisar fármacos e restringir água livre.\nSeguimento ambulatorial se não houver outra indicação de internação.' },
  { id: 'water-intoxication', title: 'Crônica · Na <120 · intoxicação hídrica', text: 'Internar e interromper a ingestão excessiva de água.\nNão usar desmopressina profilática.\nMonitorar Na a cada 6–12 horas.' },
  { id: 'edematous', title: 'Crônica · Na <120 · insuficiência cardíaca/cirrose com edema', text: 'NaCl 3% IV a 15–30 mL/h + furosemida 40 mg IV ou dose diária maior, conforme congestão.\nMonitorar Na a cada 2–4 horas; meta: aumento de 4–6 mmol/L/24 h.\nSuspender o esquema quando Na ≥125 mmol/L. Não usar desmopressina profilática.' },
  { id: 'ddavp', title: 'Crônica · Na <120 · causa reversível ou alto risco de desmielinização', text: 'NaCl 3% IV a 15–30 mL/h + desmopressina 1–2 µg IV/SC a cada 6–8 horas.\nMonitorar Na e diurese a cada 2–3 horas; após estabilização, a cada 4–6 horas.\nMeta: aumento de 4–6 mmol/L/24 h. Suspender o esquema quando Na ≥125 mmol/L.' },
  { id: 'no-ddavp', title: 'Crônica · Na <120 · baixo risco de desmielinização', text: 'NaCl 3% IV a 15–30 mL/h, sem desmopressina profilática.\nMonitorar Na e diurese a cada 4–6 horas.\nMeta: aumento de 4–6 mmol/L/24 h. Suspender o esquema quando Na ≥125 mmol/L.' },
];

const steps: Record<string, Step> = {
  duration: { question: 'Qual é a duração?', hint: 'Se desconhecida, selecionar crônica.', choices: [{ label: 'Aguda (<48 h)', next: 'acuteSymptoms' }, { label: 'Crônica ou desconhecida', next: 'chronicSevere' }] },
  acuteSymptoms: { question: 'Há algum sintoma atribuível à hiponatremia?', choices: [{ label: 'Sim', result: 'bolus' }, { label: 'Não', next: 'autocorrection' }] },
  autocorrection: { question: 'A hiponatremia está em autocorreção por diurese aquosa?', choices: [{ label: 'Sim', result: 'acute-auto' }, { label: 'Não', result: 'acute-no-auto' }] },
  chronicSevere: { question: 'Há sintomas graves?', hint: 'Convulsão, torpor, coma ou parada respiratória.', choices: [{ label: 'Sim', result: 'bolus' }, { label: 'Não', next: 'intracranial' }] },
  intracranial: { question: 'Há patologia intracraniana conhecida?', choices: [{ label: 'Sim', result: 'bolus' }, { label: 'Não', next: 'under120' }] },
  under120: { question: 'O Na sérico é <120 mmol/L?', choices: [{ label: 'Sim', next: 'selfInduced' }, { label: 'Não', next: 'mildSymptoms' }] },
  mildSymptoms: { question: 'Há sintomas leves ou moderados?', choices: [{ label: 'Sim', result: 'chronic-moderate-symptoms' }, { label: 'Não', result: 'chronic-moderate-asymptomatic' }] },
  selfInduced: { question: 'É intoxicação hídrica autoinduzida?', choices: [{ label: 'Sim', result: 'water-intoxication' }, { label: 'Não', next: 'edema' }] },
  edema: { question: 'Há edema por insuficiência cardíaca ou cirrose?', choices: [{ label: 'Sim', result: 'edematous' }, { label: 'Não', next: 'reversible' }] },
  reversible: { question: 'A causa é rapidamente reversível?', hint: 'Hipovolemia, insuficiência adrenal ou SIAD transitória.', choices: [{ label: 'Sim', result: 'ddavp' }, { label: 'Não', next: 'odsRisk' }] },
  odsRisk: { question: 'Há alto risco de desmielinização osmótica?', hint: 'Na ≤105, hipocalemia, alcoolismo, desnutrição ou hepatopatia.', choices: [{ label: 'Sim', result: 'ddavp' }, { label: 'Não', result: 'no-ddavp' }] },
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

export default function HyponatremiaTreatmentWizard() {
  const [current, setCurrent] = useState('duration');
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
  const reset = () => { setCurrent('duration'); setHistory([]); setResultId(undefined); };
  const result = results.find((item) => item.id === resultId);
  const step = steps[current];

  return <div className="magic-flowchart">
    <span className="magic-flowchart__badge">Magic Flowchart</span>
    <div className="magic-flowchart__top">
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
    {showAll && <div className="magic-flowchart__modal" role="dialog" aria-modal="true" aria-label="Todas as condutas" onClick={() => setShowAll(false)}>
      <div className="magic-flowchart__modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="magic-flowchart__modal-head"><h3>Todas as condutas</h3><button type="button" onClick={() => setShowAll(false)} aria-label="Fechar">×</button></div>
        <div className="magic-flowchart__modal-list">{results.map((item) => <TreatmentCard key={item.id} result={item} />)}</div>
      </div>
    </div>}
  </div>;
}