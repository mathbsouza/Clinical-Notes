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

function formatNumber(value: number) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
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
  const roundedBags = Math.max(1, Math.round(practicalDaily / 500));
  const bagVolume = roundToNearest(practicalDaily / roundedBags, 50);
  const finalDailyVolume = bagVolume * roundedBags;
  const bagHours = Math.round(24 / roundedBags);
  const sodiumFromNaCl20TotalMl = Number((sodiumTarget / 3.4).toFixed(1));
  const sodiumFromNaCl20PerBagMl = Number((sodiumFromNaCl20TotalMl / roundedBags).toFixed(1));
  const bagSodiumApprox = Math.round(sodiumFromNaCl20PerBagMl * 3.4);
  const totalSodiumApprox = bagSodiumApprox * roundedBags;
  const glucoseFromD5 = finalDailyVolume * 0.05;

  const potassiumPerBag = potassium === 'with-k'
    ? finalDailyVolume <= 1500 ? 20 : 30
    : 0;
  const potassiumTotal = potassiumPerBag * roundedBags;
  const glucoseDeficit = Math.max(0, 50 - glucoseFromD5);
  const d50ExtraMl = Math.ceil(glucoseDeficit / 0.5 / 10) * 10;

  const optionA = [
    'Opção preferencial',
    `Programar ${roundedBags} bolsa(s) de SG 5% ${bagVolume.toLocaleString('pt-BR')} mL, uma a cada ${bagHours} h.`,
    `Adicionar NaCl 20% ${formatNumber(sodiumFromNaCl20PerBagMl)} mL em cada bolsa (total diário ~${formatNumber(sodiumFromNaCl20TotalMl)} mL = ~${totalSodiumApprox} mEq de Na).`,
    potassium === 'with-k'
      ? `Adicionar KCl ${potassiumPerBag} mEq em cada bolsa (total diário ~${potassiumTotal} mEq), se função renal, diurese e K sérico permitirem.`
      : 'Não adicionar KCl de rotina; reavaliar conforme creatinina, diurese e K sérico.',
    glucoseFromD5 >= 50
      ? `A glicose do próprio SG 5% já fornece ~${Math.round(glucoseFromD5)} g/24 h.`
      : `A glicose do SG 5% fornece ~${Math.round(glucoseFromD5)} g/24 h; complementar SG 50% ${d50ExtraMl} mL ao longo de 24 h para atingir pelo menos 50 g/dia.`,
  ].join('\n');

  const alternativeMixLiters = finalDailyVolume / 1000;
  const alternativeSodium = Math.round(alternativeMixLiters * 77);
  const alternativeGlucose = Math.round(alternativeMixLiters * 25 + Math.max(0, 50 - alternativeMixLiters * 25));
  const extraD50ForAlt = Math.max(0, 50 - finalDailyVolume / 1000 * 25);
  const extraD50ForAltMl = Math.ceil(extraD50ForAlt / 0.5 / 10) * 10;
  const extraNaCl20Alt = Math.max(0, Number(((sodiumTarget - alternativeSodium) / 3.4).toFixed(1)));

  const optionB = [
    'Alternativa sem depender de NaCl 20% em toda a prescrição',
    `Usar glicofisiológico 1:1 no volume diário planejado: metade SG 5% + metade SF 0,9%.`,
    `Preparo: para cada 1.000 mL finais, misturar 500 mL de SG 5% + 500 mL de SF 0,9%.`,
    `Nesse esquema, o volume diário fornece ~${alternativeSodium} mEq de Na e ~${Math.round(finalDailyVolume / 1000 * 25)} g de glicose.`,
    extraNaCl20Alt > 0
      ? `Se quiser aproximar-se da meta de sódio de ~${sodiumTarget} mEq/dia, acrescentar ainda NaCl 20% total de ${formatNumber(extraNaCl20Alt)} mL/24 h.`
      : 'A meta de sódio já fica próxima com o glicofisiológico 1:1, sem necessidade adicional de NaCl 20%.',
    potassium === 'with-k'
      ? `Adicionar KCl ${potassiumPerBag} mEq por bolsa ou fracionar para um total diário em torno de ${potassiumTotal} mEq.`
      : 'Sem KCl de rotina até nova avaliação laboratorial.',
    extraD50ForAltMl > 0
      ? `Como essa alternativa oferece menos glicose, complementar SG 50% ${extraD50ForAltMl} mL/24 h para atingir pelo menos 50 g/dia.`
      : `A glicose desta alternativa já atinge a faixa mínima desejada (~${alternativeGlucose} g/24 h).`,
  ].join('\n');

  const lossesLine = losses === 'extra'
    ? 'Há perdas extras em curso: prescrever a reposição à parte, além da manutenção.'
    : 'Sem perdas extras identificadas no momento.';

  return {
    title: 'Prescrição inicial',
    rationale: [
      `Peso: ${weight.toLocaleString('pt-BR')} kg`,
      `Perfil: ${profileLabel}.`,
      `Meta hídrica: ${formatRange(volumeLow, volumeHigh)} mL/24 h (${Math.round(hourlyLow)}–${Math.round(hourlyHigh)} mL/h).`,
      `Volume prático adotado aqui: ${finalDailyVolume.toLocaleString('pt-BR')} mL/24 h.`,
      `Meta de Na/cloreto: ~${sodiumTarget} mEq/24 h.`,
      potassium === 'with-k'
        ? `Meta de K: aproximadamente ${potassiumTarget} mEq/24 h; na prática inicial, o bloco monta ~${potassiumTotal} mEq/24 h.`
        : 'Potássio retirado da prescrição inicial.',
      'Meta de glicose: pelo menos 50 g/24 h.',
      lossesLine,
    ],
    prescription: [
      'FLUIDOTERAPIA DE MANUTENÇÃO',
      '',
      optionA,
      '',
      optionB,
      '',
      'Observações:',
      '1. Descontar dieta, medicações diluídas, antibióticos, nutrição e outras infusões do volume total.',
      `2. ${lossesLine}`,
      '3. Monitorar balanço hídrico, diurese, Na, K e creatinina.',
      '4. Reavaliar a prescrição em 24 h ou antes se houver instabilidade clínica ou laboratorial.',
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
      <div className="magic-flowchart__result-head"><h4>{result.title}</h4></div>
      <div className="magic-flowchart__rationale">
        <strong>Racional</strong>
        <ul>{result.rationale.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="magic-flowchart__copy-block">
        <div className="magic-flowchart__result-head"><strong>Prescrição pronta</strong><CopyButton text={result.prescription} /></div>
        <pre>{result.prescription}</pre>
      </div>
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
          <RuleCard title="Faixa basal" text="Manutenção isolada no adulto: 25–30 mL/kg/dia de água, ~1 mEq/kg/dia de sódio, potássio e cloreto, e 50–100 g/dia de glicose." />
          <RuleCard title="Faixa reduzida" text="Usar 20–25 mL/kg/dia quando houver maior risco de sobrecarga, como em idosos, insuficiência cardíaca ou insuficiência renal." />
          <RuleCard title="Potássio" text="Não repor K automaticamente sem conhecer creatinina, diurese e K sérico. Em oligúria importante, anúria ou hipercalemia, retirar K da manutenção." />
          <RuleCard title="Perdas em curso" text="Vômitos, diarreia, débito de sonda, poliúria e febre importante exigem reposição adicional à parte. Isso não deve ser embutido na manutenção basal." />
          <RuleCard title="Composições úteis" text="NaCl 20% contém ~3,4 mEq de sódio por mL. Glicofisiológico 1:1 pode ser preparado com 500 mL de SG 5% + 500 mL de SF 0,9%, gerando 1.000 mL com ~77 mEq de Na e 25 g de glicose." />
          <RuleCard title="Glicose" text="Quando a mistura escolhida não atingir 50 g/dia, o bloco sugere complementação com SG 50%. Como referência prática, 20 mL de SG 50% fornecem 10 g de glicose." />
        </div>
      </div>
    </div>, document.body)}
  </div>;
}
