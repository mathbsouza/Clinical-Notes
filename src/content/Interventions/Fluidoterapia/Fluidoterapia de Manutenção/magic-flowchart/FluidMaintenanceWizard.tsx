import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = 'weight' | 'profile' | 'solution' | 'potassium' | 'potassium-product' | 'losses';
type Profile = 'standard' | 'restricted';
type SolutionMode = 'd5' | 'half-and-half';
type PotassiumMode = 'with-k' | 'without-k';
type PotassiumProduct = 'kcl-10' | 'kcl-19.1';
type LossMode = 'none' | 'extra';

type Snapshot = {
  step: Step;
  weight: string;
  profile?: Profile;
  solution?: SolutionMode;
  potassium?: PotassiumMode;
  potassiumProduct?: PotassiumProduct;
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

function buildPrescription(weight: number, profile: Profile, solution: SolutionMode, potassium: PotassiumMode, potassiumProduct: PotassiumProduct | undefined, losses: LossMode) {
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
  const sodiumFromBase = solution === 'half-and-half' ? finalDailyVolume * 0.077 : 0;
  const sodiumToAdd = Math.max(0, sodiumTarget - sodiumFromBase);
  const sodiumFromNaCl20TotalMl = Number((sodiumToAdd / 3.4).toFixed(1));
  const sodiumFromNaCl20PerBagMl = Number((sodiumFromNaCl20TotalMl / roundedBags).toFixed(1));
  const totalSodiumApprox = Math.round(sodiumFromBase + sodiumFromNaCl20PerBagMl * 3.4 * roundedBags);
  const glucoseFromBase = finalDailyVolume * (solution === 'd5' ? 0.05 : 0.025);

  const potassiumTotal = potassium === 'with-k'
    ? Math.min(60, Math.max(20, roundToNearest(weight, 10)))
    : 0;
  const potassiumPerBag = potassiumTotal / roundedBags;
  const selectedKcl = potassiumProduct === 'kcl-10'
    ? { label: 'KCl 10%', concentration: 1.34 }
    : { label: 'KCl 19,1%', concentration: 2.56 };
  const alternativeKcl = potassiumProduct === 'kcl-10'
    ? { label: 'KCl 19,1%', concentration: 2.56 }
    : { label: 'KCl 10%', concentration: 1.34 };
  const selectedKclMlPerBag = potassiumPerBag / selectedKcl.concentration;
  const alternativeKclMlPerBag = potassiumPerBag / alternativeKcl.concentration;
  const glucoseDeficit = Math.max(0, 50 - glucoseFromBase);
  const d50ExtraMl = Math.ceil(glucoseDeficit / 0.5 / 10) * 10;
  const potassiumOrder = potassium === 'with-k'
    ? `${selectedKcl.label} ${formatNumber(selectedKclMlPerBag)} mL`
    : undefined;
  const glucoseOrder = glucoseFromBase < 50
    ? `SG 50% ${d50ExtraMl} mL IV em 24 h.`
    : undefined;
  const additives = [
    ...(sodiumFromNaCl20TotalMl > 0 ? [`NaCl 20% ${formatNumber(sodiumFromNaCl20PerBagMl)} mL`] : []),
    ...(potassiumOrder ? [potassiumOrder] : []),
  ];
  const solutionOrder = solution === 'd5'
    ? [`SG 5% ${bagVolume.toLocaleString('pt-BR')} mL IV — ${roundedBags} bolsa(s).`]
    : [
      `Solução glicofisiológica 1:1 ${bagVolume.toLocaleString('pt-BR')} mL IV — ${roundedBags} bolsa(s).`,
      `Preparar cada bolsa: SG 5% ${formatNumber(bagVolume / 2)} mL + SF 0,9% ${formatNumber(bagVolume / 2)} mL.`,
    ];

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
      solution === 'd5'
        ? `Solução-base: SG 5%. NaCl 20% acrescentado para ofertar ~${totalSodiumApprox} mEq de Na/24 h, próximo da meta estimada de ~${sodiumTarget} mEq/24 h.`
        : `Solução-base: glicofisiológico 1:1. A própria mistura oferta ~${totalSodiumApprox} mEq de Na/24 h para uma meta basal estimada de ~${sodiumTarget} mEq/24 h${totalSodiumApprox > sodiumTarget ? '; a oferta excede a meta calculada e deve ser confirmada conforme o contexto clínico' : ''}.`,
      potassium === 'with-k'
        ? `Necessidade fisiológica estimada de K: ~${potassiumTarget} mEq/24 h. Por segurança, a prescrição inicial foi limitada a ${potassiumTotal} mEq/24 h até nova avaliação de K, função renal e diurese.`
        : 'Potássio retirado da prescrição inicial.',
      potassium === 'with-k'
        ? `${selectedKcl.label}: ${formatNumber(selectedKclMlPerBag)} mL/bolsa = ${formatNumber(potassiumPerBag)} mEq/bolsa. Equivalente com ${alternativeKcl.label}: ${formatNumber(alternativeKclMlPerBag)} mL/bolsa. Preferir bolsa premisturada; KCl concentrado nunca deve ser administrado sem diluição.`
        : 'Sem KCl na solução inicial.',
      `${solution === 'd5' ? 'O SG 5%' : 'A solução 1:1'} fornece ~${Math.round(glucoseFromBase)} g de glicose/24 h${glucoseFromBase < 50 ? `; são necessários mais ${d50ExtraMl} mL de SG 50% para atingir 50 g/dia` : ', portanto já cobre a meta mínima de 50 g/dia'}.`,
      lossesLine,
    ],
    prescription: [
      'FLUIDOTERAPIA DE MANUTENÇÃO',
      '',
      ...solutionOrder,
      ...(additives.length > 0 ? [`Adicionar em cada bolsa: ${additives.join(' + ')}.`] : []),
      `Infundir 1 bolsa em ${bagHours} h.`,
      ...(glucoseOrder ? [glucoseOrder] : []),
      '',
      'Balanço hídrico e diurese.',
      'Controlar Na, K e creatinina; reavaliar em até 24 h.',
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
  const [solution, setSolution] = useState<SolutionMode>();
  const [potassium, setPotassium] = useState<PotassiumMode>();
  const [potassiumProduct, setPotassiumProduct] = useState<PotassiumProduct>();
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
    setHistory((items) => [...items, { step: current, weight: weightInput, profile, solution, potassium, potassiumProduct, losses }]);
  };

  const continueWeight = () => {
    if (!validWeight) return;
    pushHistory();
    setCurrent('profile');
  };

  const chooseProfile = (nextProfile: Profile) => {
    pushHistory();
    setProfile(nextProfile);
    setCurrent('solution');
  };

  const chooseSolution = (nextSolution: SolutionMode) => {
    pushHistory();
    setSolution(nextSolution);
    setCurrent('potassium');
  };

  const choosePotassium = (nextPotassium: PotassiumMode) => {
    pushHistory();
    setPotassium(nextPotassium);
    setPotassiumProduct(undefined);
    setCurrent(nextPotassium === 'with-k' ? 'potassium-product' : 'losses');
  };

  const choosePotassiumProduct = (nextProduct: PotassiumProduct) => {
    pushHistory();
    setPotassiumProduct(nextProduct);
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
    setSolution(previous.solution);
    setPotassium(previous.potassium);
    setPotassiumProduct(previous.potassiumProduct);
    setLosses(previous.losses);
  };

  const reset = () => {
    setCurrent('weight');
    setHistory([]);
    setWeightInput('');
    setProfile(undefined);
    setSolution(undefined);
    setPotassium(undefined);
    setPotassiumProduct(undefined);
    setLosses(undefined);
  };

  const result = validWeight && profile && solution && potassium && losses && (potassium === 'without-k' || potassiumProduct)
    ? buildPrescription(parsedWeight, profile, solution, potassium, potassiumProduct, losses)
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
      {current === 'solution' && <>
        <h4>Solução-base</h4>
        <div className="magic-flowchart__options">
          <button type="button" onClick={() => chooseSolution('d5')}>SG 5%</button>
          <button type="button" onClick={() => chooseSolution('half-and-half')}>Glicofisiológico 1:1</button>
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
      {current === 'potassium-product' && <>
        <h4>Qual apresentação de KCl está disponível?</h4>
        <p>O Magic converterá a dose total diária para mL por bolsa.</p>
        <div className="magic-flowchart__options">
          <button type="button" onClick={() => choosePotassiumProduct('kcl-19.1')}>KCl 19,1% · 2,56 mEq/mL</button>
          <button type="button" onClick={() => choosePotassiumProduct('kcl-10')}>KCl 10% · 1,34 mEq/mL</button>
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
          <RuleCard title="Potássio" text="A necessidade fisiológica é próxima de 1 mEq/kg/dia, mas o Magic limita a prescrição inicial a 60 mEq/24 h até reavaliação. KCl 10% fornece 1,34 mEq/mL; KCl 19,1%, 2,56 mEq/mL. Não repor automaticamente em oligúria, anúria, hipercalemia ou sem avaliação renal e laboratorial; preferir bolsas padronizadas/premisturadas." />
          <RuleCard title="Perdas em curso" text="Vômitos, diarreia, débito de sonda, poliúria e febre importante exigem reposição adicional à parte. Isso não deve ser embutido na manutenção basal." />
          <RuleCard title="Composições úteis" text="NaCl 20% contém ~3,4 mEq de sódio por mL. Glicofisiológico 1:1 pode ser preparado com 500 mL de SG 5% + 500 mL de SF 0,9%, gerando 1.000 mL com ~77 mEq de Na e 25 g de glicose." />
          <RuleCard title="Glicose" text="Quando a mistura escolhida não atingir 50 g/dia, o bloco sugere complementação com SG 50%. Como referência prática, 20 mL de SG 50% fornecem 10 g de glicose." />
        </div>
      </div>
    </div>, document.body)}
  </div>;
}
