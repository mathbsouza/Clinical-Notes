import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '../lib/headings';

type MarkdownNoteProps = {
  body: string;
};

type FlowchartBranch = {
  title: string;
  items: string[];
};

type DiagnosticStage = {
  kind: 'start' | 'decision' | 'process';
  title: string;
  items: string[];
};

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return '';
}

function ZoomableFlowchart({ label, children }: { label: string; children: (expanded: boolean) => ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && setExpanded(false);
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [expanded]);

  return (
    <>
      <div
        className="flowchart-preview"
        role="button"
        tabIndex={0}
        aria-label={`Ampliar ${label}`}
        onClick={() => setExpanded(true)}
        onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && setExpanded(true)}
      >
        {children(false)}
        <span className="flowchart-expand-hint">Clique para ampliar</span>
      </div>
      {expanded && (
        <div className="flowchart-lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={() => setExpanded(false)}>
          <div className="flowchart-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button className="flowchart-close" type="button" onClick={() => setExpanded(false)} aria-label="Fechar fluxograma ampliado">×</button>
            {children(true)}
          </div>
        </div>
      )}
    </>
  );
}

function EtiologyFlowchart({ source }: { source: string }) {
  const [root = 'Etiologia', ...branchLines] = source.trim().split(/\r?\n/).filter(Boolean);
  const branches: FlowchartBranch[] = branchLines.map((line) => {
    const [title, ...items] = line.split('|').map((part) => part.trim());
    return { title, items };
  });

  const chart = (
    <figure className="etiology-flowchart" aria-label={`Fluxograma: ${root}`}>
      <div className="flowchart-root">{root}</div>
      <div className="flowchart-trunk" aria-hidden="true" />
      <div className="flowchart-branches">
        {branches.map((branch, index) => (
          <div className="flowchart-branch" key={`${branch.title}-${index}`}>
            <div className="flowchart-connector" aria-hidden="true" />
            <section className="flowchart-card">
              <h3>{branch.title}</h3>
              <ul>
                {branch.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>
        ))}
      </div>
      <figcaption>Fluxograma de {root.toLocaleLowerCase('pt-BR')}</figcaption>
    </figure>
  );

  return <ZoomableFlowchart label={`Fluxograma: ${root}`}>{() => chart}</ZoomableFlowchart>;
}

function DiagnosticFlowchart({ source }: { source: string }) {
  const stages: DiagnosticStage[] = source.trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [kind, title, ...items] = line.split('|').map((part) => part.trim());
    return { kind: kind as DiagnosticStage['kind'], title, items };
  });

  const renderChart = (expanded: boolean) => (
    <figure className={`diagnostic-flowchart${expanded ? ' is-expanded' : ''}`} aria-label="Fluxograma diagnóstico da síncope">
      <div className="diagnostic-sequence">
        {stages.map((stage, stageIndex) => (
          <div className="diagnostic-stage" key={`${stage.kind}-${stage.title}`}>
            {stageIndex > 0 && <div className="diagnostic-arrow" aria-hidden="true">↓</div>}
            <div className={`diagnostic-node diagnostic-node-${stage.kind}`}>
              <strong>{stage.title}</strong>
            </div>
            {stage.items.length > 0 && (
              <div className={`diagnostic-options${stage.kind === 'decision' ? ' is-decision' : ''}`}>
                {stage.items.map((item, itemIndex) => {
                  const [label, detail = ''] = item.split('→').map((part) => part.trim());
                  return (
                    <div className={`diagnostic-option${itemIndex === stage.items.length - 1 ? ' continues' : ''}`} key={item}>
                      {detail && <b>{label}</b>}
                      <span>{detail || label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <figcaption>Fluxo de avaliação, estratificação e investigação da síncope</figcaption>
    </figure>
  );

  return <ZoomableFlowchart label="Fluxograma diagnóstico da síncope">{renderChart}</ZoomableFlowchart>;
}

export default function MarkdownNote({ body }: MarkdownNoteProps) {
  return (
    <article className="prose-notes">
      <ReactMarkdown
        components={{
          h2: ({ children }) => <h2 id={headingId(getNodeText(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(getNodeText(children))}>{children}</h3>,
          table: ({ children }) => (
            <div className="table-scroll" role="region" aria-label="Tabela com rolagem horizontal">
              <table>{children}</table>
            </div>
          ),
          pre: ({ children }) => {
            const child = Children.toArray(children)[0];
            if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-etiology-flowchart') {
              return <EtiologyFlowchart source={getNodeText(child.props.children)} />;
            }
            if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-diagnostic-flowchart') {
              return <DiagnosticFlowchart source={getNodeText(child.props.children)} />;
            }

            return <pre>{children}</pre>;
          },
          tr: ({ children }) => {
            const cells = Children.toArray(children);
            const firstCell = cells[0];
            const firstText = getNodeText(firstCell).trim();
            const hasOnlyEmptyTrailingCells = cells.slice(1).every((cell) => getNodeText(cell).trim().length === 0);

            if (/^(Legenda|Nota|Abreviações):/i.test(firstText) && hasOnlyEmptyTrailingCells) {
              return (
                <tr className="table-note-row">
                  <td colSpan={Math.max(cells.length, 1)}>{isValidElement<{ children?: ReactNode }>(firstCell) ? firstCell.props.children : firstCell}</td>
                </tr>
              );
            }

            return <tr>{children}</tr>;
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
