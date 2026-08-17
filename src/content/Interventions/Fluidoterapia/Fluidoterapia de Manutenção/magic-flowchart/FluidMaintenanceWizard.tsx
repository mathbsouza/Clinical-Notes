import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = 'weight' | 'profile' | 'potassium' | 'losses';
type Profile = 'standard' | 'restricted';
type PotassiumMode = 'with-k' | 'without-k';
type LossMode = 'none' | 'extra';

type Snapshot = {
  step: Step;
  weight: string;
  profile?: Profile;
  potassium?: PotassiumMode;
  losses?: LossMode;
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

function roundToNearest(value: number, base: number) {
  return Math.round(value / base) * base;
}

function formatRange(low: number, high: number) {
  return `${Math.round(low).toLocaleString('pt-BR')}–${Math.round(high).toLocaleString('pt-BR')}`;
}

function buildPrescription(weight: number, profile: Profile, potassium: PotassiumMode, losses: LossMode) {
  const lowPerKg = profile === 'restricted' ? 20 : 25;
  const highPerKg = profile === 'restricted' ? 25 : 30;
  const volumeLow = weight * lowPerKg;
  const volumeHigh = weight * highPerKg;
  const hourlyLow = volumeLow / 24;
  const hourlyHigh = volumeHigh / 24;
  const practicalDaily = roundToNearest((volumeLow + volumeHigh) / 2, 50);
  const sodiumTarget = Math.round(weight);
  const potassiumTarget = Math.round(weight);
  const profileLabel = profile === 'restricted'
    ? 'restrição relativa de volume (idoso, IC, DRC ou risco de sobrecarga)'
    : 'manutenção basal habitual';

  const potassiumLine = potassium === 'with-k'
    ? `Potássio: ~${potassiumTarget} mmol/24 h, se creatinina, diurese e K sérico permitirem.`
    : 'Potássio: não repor de rotina até reavaliar função renal, diurese e K sérico.';

  const lossesLine = losses === 'extra'
    ? '4. Prescrever as perdas em curso à parte; não somar tudo dentro da manutenção.'
    : '4. Sem perdas extras identificadas no momento.';

  return {
    title: 'Prescrição inicial',
    text: [
      'Fluidoterapia de manutenção',
      `Peso: ${weight.toLocaleString('pt-BR')} kg`,
      `Perfil: ${profileLabel}.`,
      `Meta hídrica: ${formatRange(volumeLow, volumeHigh)} mL/24 h (${Math.round(hourlyLow)}–${Math.round(hourlyHigh)} mL/h).`,
      `Volume prático inicial: ${practicalDaily.toLocaleString('pt-BR')} mL/24 h, com ajuste diário.`,
      `Sódio/cloreto: ~${sodiumTarget} mmol/24 h.`,
      potassiumLine,
      'Glicose: 50–100 g/24 h.',
      '',
      'Prescrição:',
      '1. Programar solução de manutenção IV para correr em 24 h, conforme a padronização local.',
      '2. Descontar dieta, medicações diluídas, antibióticos, nutrição e outras infusões do volume total.',
      '3. Monitorar balanço hídrico, diurese, Na, K e creatinina.',
      lossesLine,
      '5. Reavaliar a prescrição em 24 h ou antes se houver instabilidade clínica ou laboratorial.',
    ].join('\n'),
  };
}

function RuleCard({ title, text }: { title: string; text: string }) {
  return <section className="magic-flowchart__result">
    <div className="magic-flowchart__result-head"><h4>{title}</h4></div>
    <p>{text}</p>
  </section>;
}

export default function FluidMaintenanceWizard() {
  const [current, setCurrent] = useState<Step>('weight');
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [weightInput, setWeightInput] = useState('');
  const [profile, setProfile] = useState<Profile>();
  const [potassium, setPotassium] = useState<PotassiumMode>();
  const [losses, setLosses] = useState<LossMode>();
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!showRules) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setShowRules(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showRules]);

  const parsedWeight = Number(weightInput.replace(',', '.'));
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0;

  const pushHistory = () => {
    setHistory((items) => [...items, { step: current, weight: weightInput, profile, potassium, losses }]);
  };

  const continueWeight = () => {
    if (!validWeight) return;
    pushHistory();
    setCurrent('profile');
  };

  const chooseProfile = (nextProfile: Profile) => {
    pushHistory();
    setProfile(nextProfile);
    setCurrent('potassium');
  };

  const choosePotassium = (nextPotassium: PotassiumMode) => {
    pushHistory();
    setPotassium(nextPotassium);
    setCurrent('losses');
  };

  const chooseLosses = (nextLosses: LossMode) => {
    pushHistory();
    setLosses(nextLosses);
  };

  const back = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setCurrent(previous.step);
    setWeightInput(previous.weight);
    setProfile(previous.profile);
    setPotassium(previous.potassium);
    setLosses(previous.losses);
  };

  const reset = () => {
    setCurrent('weight');
    setHistory([]);
    setWeightInput('');
    setProfile(undefined);
    setPotassium(undefined);
    setLosses(undefined);
  };

  const result = validWeight && profile && potassium && losses
    ? buildPrescription(parsedWeight, profile, potassium, losses)
    : undefined;

  return <div className="magic-flowchart" id="prescricao-de-fluidoterapia-de-manutencao">
    <span className="magic-flowchart__badge">Magic Flowchart</span>
    <div className="magic-flowchart__top">
      <h3>Prescrição de Fluidoterapia de Manutenção</h3>
      <button type="button" onClick={() => setShowRules(true)}>Ver regras</button>
    </div>
    {result ? <section className="magic-flowchart__result">
      <div className="magic-flowchart__result-head"><h4>{result.title}</h4><CopyButton text={result.text} /></div>
      <p>{result.text}</p>
    </section> : <div className="magic-flowchart__question">
      {current === 'weight' && <>
        <h4>Peso do paciente</h4>
        <div className="magic-flowchart__input-wrap">
          <input
            className="magic-flowchart__input"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.1"
            placeholder="kg"
            value={weightInput}
            onChange={(event) => setWeightInput(event.target.value)}
          />
          <button type="button" onClick={continueWeight} disabled={!validWeight}>Continuar</button>
        </div>
      </>}
      {current === 'profile' && <>
        <h4>Perfil de volume</h4>
        <div className="magic-flowchart__options">
          <button type="button" onClick={() => chooseProfile('standard')}>25–30 mL/kg/dia</button>
          <button type="button" onClick={() => chooseProfile('restricted')}>20–25 mL/kg/dia</button>
        </div>
      </>}
      {current === 'potassium' && <>
        <h4>Repor potássio de rotina?</h4>
        <p>Depende de creatinina, diurese e K sérico.</p>
        <div className="magic-flowchart__options">
          <button type="button" onClick={() => choosePotassium('with-k')}>Sim</button>
          <button type="button" onClick={() => choosePotassium('without-k')}>Não</button>
        </div>
      </>}
      {current === 'losses' && <>
        <h4>Há perdas extras em curso?</h4>
        <p>Vômitos, diarreia, débito de sonda, poliúria ou febre importante.</p>
        <div className="magic-flowchart__options">
          <button type="button" onClick={() => chooseLosses('none')}>Não</button>
          <button type="button" onClick={() => chooseLosses('extra')}>Sim</button>
        </div>
      </>}
    </div>}
    <div className="magic-flowchart__nav">
      {(history.length > 0 || result) && <button type="button" onClick={back}>Voltar</button>}
      {(history.length > 0 || result || weightInput) && <button type="button" onClick={reset}>Reiniciar</button>}
    </div>
    {showRules && createPortal(<div className="magic-flowchart__modal" role="dialog" aria-modal="true" aria-label="Regras da fluidoterapia de manutenção" onClick={() => setShowRules(false)}>
      <div className="magic-flowchart__modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="magic-flowchart__modal-head"><h3>Regras usadas</h3><button type="button" onClick={() => setShowRules(false)} aria-label="Fechar">×</button></div>
        <div className="magic-flowchart__modal-list">
          <RuleCard title="Faixa basal" text="Manutenção isolada no adulto: 25–30 mL/kg/dia de água, ~1 mmol/kg/dia de sódio, potássio e cloreto, e 50–100 g/dia de glicose." />
          <RuleCard title="Faixa reduzida" text="Usar 20–25 mL/kg/dia quando houver maior risco de sobrecarga, como em idosos, insuficiência cardíaca ou insuficiência renal." />
          <RuleCard title="Potássio" text="Não repor K automaticamente sem conhecer creatinina, diurese e K sérico. Em oligúria importante, anúria ou hipercalemia, retirar K da manutenção." />
          <RuleCard title="Perdas em curso" text="Vômitos, diarreia, débito de sonda, poliúria e febre importante exigem reposição adicional à parte. Isso não deve ser embutido na manutenção basal." />
        </div>
      </div>
    </div>, document.body)}
  </div>;
}
