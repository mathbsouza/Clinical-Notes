import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Step = 'strategy' | 'anticoagulation' | 'renal-function' | 'p2y12';
type Strategy = 'immediate' | 'early' | 'delayed';
type Anticoagulation = 'enoxaparin' | 'ufh' | 'fondaparinux';
type RenalFunction = 'standard' | 'severe-impairment';
type P2Y12 = 'defer' | 'ticagrelor' | 'clopidogrel';

type Selection = {
  strategy?: Strategy;
  anticoagulation?: Anticoagulation;
  renalFunction?: RenalFunction;
  p2y12?: P2Y12;
};

type Snapshot = { step: Step; selection: Selection };

const BASE_PRESCRIPTION = `1. DIETA ZERO até definição da estratégia invasiva, se cinecoronariografia prevista precocemente.

2. AAS 300 mg VO, mastigar, agora.
   Após: AAS 100 mg VO 1x/dia.

3. ANTICOAGULAÇÃO – escolher UMA opção:
   - Enoxaparina 1 mg/kg SC 12/12h.
     Se ClCr <30 mL/min: 1 mg/kg SC 1x/dia.
   OU
   - HNF: bolus 60 U/kg IV (máx. 4.000 U), seguido de 12 U/kg/h
     (máx. inicial 1.000 U/h), ajustar conforme TTPa/protocolo institucional.
   OU
   - Fondaparinux 2,5 mg SC 1x/dia, se estratégia não for PCI imediata
     (se for para PCI, requer HNF adicional durante o procedimento).

4. P2Y12:
   - NÃO fazer automaticamente antes de conhecer anatomia se cinecoronariografia precoce planejada.
   - Quando indicado:
     Ticagrelor 180 mg VO ataque → 90 mg VO 12/12h
     OU clopidogrel 300–600 mg ataque → 75 mg VO/dia.
   [Escolha conforme estratégia invasiva, risco hemorrágico e eventual necessidade de CABG.]

5. Atorvastatina 80 mg VO 1x/dia.

6. Nitroglicerina 0,4 mg SL se dor anginosa, podendo repetir a cada 5 min até 3 doses,
   se PAS adequada e sem contraindicações.
   Se dor/isquemia persistente: considerar nitroglicerina IV titulada.

7. Metoprolol tartarato 25 mg VO 12/12h, SE:
   - sem IC aguda;
   - sem baixo débito/choque;
   - sem bradicardia/BAV;
   - sem broncoespasmo importante.
   Titular conforme FC e PA.

8. Dipirona 1 g IV/VO 6/6h se dor não anginosa/febre, se necessário.
   Evitar AINE.

9. Oxigênio SOMENTE se SpO₂ <90%, desconforto respiratório ou hipoxemia.

10. Omeprazol 20–40 mg VO/IV 1x/dia se risco aumentado de sangramento gastrointestinal.

11. Monitorização cardíaca contínua.
    Controle de PA/FC/SpO₂.
    ECG se recorrência da dor.
    Troponina seriada conforme protocolo.`;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <button className="magic-flowchart__copy" type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>;
}

function anticoagulationText(selection: Selection) {
  if (selection.anticoagulation === 'enoxaparin') {
    return selection.renalFunction === 'severe-impairment'
      ? '3. Enoxaparina 1 mg/kg SC 1x/dia (ClCr <30 mL/min).'
      : '3. Enoxaparina 1 mg/kg SC 12/12h.';
  }

  if (selection.anticoagulation === 'ufh') {
    return '3. HNF: bolus 60 U/kg IV (máx. 4.000 U), seguido de 12 U/kg/h\n   (máx. inicial 1.000 U/h), ajustar conforme TTPa/protocolo institucional.';
  }

  return '3. Fondaparinux 2,5 mg SC 1x/dia, se estratégia não for PCI imediata.\n   Se for para PCI, administrar HNF adicional durante o procedimento.';
}

function p2y12Text(selection: Selection) {
  if (selection.p2y12 === 'ticagrelor') {
    return '4. Ticagrelor 180 mg VO ataque → 90 mg VO 12/12h, quando indicado.\n   Escolha conforme estratégia invasiva, risco hemorrágico e eventual necessidade de CABG.';
  }

  if (selection.p2y12 === 'clopidogrel') {
    return '4. Clopidogrel 300–600 mg VO ataque → 75 mg VO 1x/dia, quando indicado.\n   Escolha conforme estratégia invasiva, risco hemorrágico e eventual necessidade de CABG.';
  }

  return `4. P2Y12:
   - NÃO fazer automaticamente antes de conhecer anatomia se cinecoronariografia precoce planejada.
   - Quando indicado:
     Ticagrelor 180 mg VO ataque → 90 mg VO 12/12h
     OU clopidogrel 300–600 mg ataque → 75 mg VO/dia.
   [Escolha conforme estratégia invasiva, risco hemorrágico e eventual necessidade de CABG.]`;
}

function buildPrescription(selection: Selection) {
  const diet = selection.strategy === 'delayed'
    ? '1. Dieta conforme tolerância. Programar jejum quando a cinecoronariografia for definida.'
    : '1. DIETA ZERO até definição da estratégia invasiva, pois há cinecoronariografia precoce prevista.';

  return `${diet}

2. AAS 300 mg VO, mastigar, agora.
   Após: AAS 100 mg VO 1x/dia.

${anticoagulationText(selection)}

${p2y12Text(selection)}

5. Atorvastatina 80 mg VO 1x/dia.

6. Nitroglicerina 0,4 mg SL se dor anginosa, podendo repetir a cada 5 min até 3 doses,
   se PAS adequada e sem contraindicações.
   Se dor/isquemia persistente: considerar nitroglicerina IV titulada.

7. Metoprolol tartarato 25 mg VO 12/12h, SE:
   - sem IC aguda;
   - sem baixo débito/choque;
   - sem bradicardia/BAV;
   - sem broncoespasmo importante.
   Titular conforme FC e PA.

8. Dipirona 1 g IV/VO 6/6h se dor não anginosa/febre, se necessário.
   Evitar AINE.

9. Oxigênio SOMENTE se SpO₂ <90%, desconforto respiratório ou hipoxemia.

10. Omeprazol 20–40 mg VO/IV 1x/dia se risco aumentado de sangramento gastrointestinal.

11. Monitorização cardíaca contínua.
    Controle de PA/FC/SpO₂.
    ECG se recorrência da dor.
    Troponina seriada conforme protocolo.`;
}

function Choice({ children, onClick }: { children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick}>{children}</button>;
}

export default function NsteAcsPrescriptionWizard() {
  const [step, setStep] = useState<Step>('strategy');
  const [selection, setSelection] = useState<Selection>({});
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [complete, setComplete] = useState(false);
  const [showBase, setShowBase] = useState(false);

  useEffect(() => {
    if (!showBase) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setShowBase(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showBase]);

  const advance = (updates: Partial<Selection>, next?: Step) => {
    setHistory((items) => [...items, { step, selection }]);
    setSelection((current) => ({ ...current, ...updates }));
    if (next) setStep(next);
    else setComplete(true);
  };

  const back = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setStep(previous.step);
    setSelection(previous.selection);
    setHistory((items) => items.slice(0, -1));
    setComplete(false);
  };

  const reset = () => {
    setStep('strategy');
    setSelection({});
    setHistory([]);
    setComplete(false);
  };

  const selectAnticoagulation = (anticoagulation: Anticoagulation) => {
    advance({ anticoagulation, renalFunction: undefined }, anticoagulation === 'enoxaparin' ? 'renal-function' : 'p2y12');
  };

  const prescription = complete ? buildPrescription(selection) : '';

  return <div className="magic-flowchart" id="prescricao-de-sca-sem-supra-de-st">
    <span className="magic-flowchart__badge">Magic Selector</span>
    <div className="magic-flowchart__top">
      <h3>Prescrição de SCA sem Supra de ST</h3>
      <button type="button" onClick={() => setShowBase(true)}>Ver modelo-base</button>
    </div>

    {complete ? <section className="magic-flowchart__result">
      <div className="magic-flowchart__result-head">
        <h4>Prescrição pronta</h4>
        <CopyButton text={prescription} />
      </div>
      <div className="magic-flowchart__copy-block"><pre>{prescription}</pre></div>
    </section> : <div className="magic-flowchart__question">
      {step === 'strategy' && <>
        <h4>Qual é a estratégia invasiva prevista?</h4>
        <p>A resposta ajusta o jejum, o fondaparinux e o momento do P2Y12.</p>
        <div className="magic-flowchart__options">
          <Choice onClick={() => advance({ strategy: 'immediate' }, 'anticoagulation')}>PCI imediata</Choice>
          <Choice onClick={() => advance({ strategy: 'early' }, 'anticoagulation')}>Cine precoce, sem PCI imediata</Choice>
          <Choice onClick={() => advance({ strategy: 'delayed' }, 'anticoagulation')}>Estratégia tardia ou conservadora</Choice>
        </div>
      </>}

      {step === 'anticoagulation' && <>
        <h4>Qual anticoagulante será prescrito?</h4>
        <p>Escolha somente uma opção. Fondaparinux não é oferecido para PCI imediata.</p>
        <div className="magic-flowchart__options">
          <Choice onClick={() => selectAnticoagulation('enoxaparin')}>Enoxaparina</Choice>
          <Choice onClick={() => selectAnticoagulation('ufh')}>Heparina não fracionada</Choice>
          {selection.strategy !== 'immediate' && <Choice onClick={() => selectAnticoagulation('fondaparinux')}>Fondaparinux</Choice>}
        </div>
      </>}

      {step === 'renal-function' && <>
        <h4>Qual é a depuração de creatinina?</h4>
        <p>Este dado define o intervalo da enoxaparina.</p>
        <div className="magic-flowchart__options">
          <Choice onClick={() => advance({ renalFunction: 'standard' }, 'p2y12')}>ClCr ≥30 mL/min</Choice>
          <Choice onClick={() => advance({ renalFunction: 'severe-impairment' }, 'p2y12')}>ClCr &lt;30 mL/min</Choice>
        </div>
      </>}

      {step === 'p2y12' && <>
        <h4>Qual será a conduta com P2Y12?</h4>
        <p>{selection.strategy === 'delayed'
          ? 'Se a angiografia ocorrer após 24 h, o pré-tratamento pode ser considerado conforme riscos isquêmico e hemorrágico.'
          : 'Com anatomia desconhecida e cine precoce, não fazer pré-tratamento automaticamente.'}</p>
        <div className="magic-flowchart__options">
          <Choice onClick={() => advance({ p2y12: 'defer' })}>Aguardar anatomia / manter opções</Choice>
          <Choice onClick={() => advance({ p2y12: 'ticagrelor' })}>Ticagrelor quando indicado</Choice>
          <Choice onClick={() => advance({ p2y12: 'clopidogrel' })}>Clopidogrel quando indicado</Choice>
        </div>
      </>}
    </div>}

    <div className="magic-flowchart__nav">
      {history.length > 0 && <button type="button" onClick={back}>Voltar</button>}
      {(history.length > 0 || complete) && <button type="button" onClick={reset}>Reiniciar</button>}
    </div>

    {showBase && createPortal(<div className="magic-flowchart__modal" role="dialog" aria-modal="true" aria-label="Modelo-base da prescrição" onClick={() => setShowBase(false)}>
      <div className="magic-flowchart__modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="magic-flowchart__modal-head">
          <h3>Modelo-base completo</h3>
          <button type="button" onClick={() => setShowBase(false)} aria-label="Fechar">×</button>
        </div>
        <section className="magic-flowchart__result">
          <div className="magic-flowchart__result-head"><h4>Prescrição com todas as opções</h4><CopyButton text={BASE_PRESCRIPTION} /></div>
          <div className="magic-flowchart__copy-block"><pre>{BASE_PRESCRIPTION}</pre></div>
        </section>
      </div>
    </div>, document.body)}
  </div>;
}
