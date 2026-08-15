import { Children, isValidElement, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ClinicalFlowDefinition } from './ClinicalFlow';
import { headingId } from '../lib/headings';

const ClinicalFlow = lazy(() => import('./ClinicalFlow'));

type MarkdownNoteProps = {
  body: string;
};

const flowchartSources = import.meta.glob<ClinicalFlowDefinition>('../content/**/*.flow.json', {
  eager: true,
  import: 'default',
});

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

function ReactFlowchart({ source }: { source: string }) {
  const [sourcePath, label, caption] = source.trim().split('|').map((part) => part.trim());
  const definition = flowchartSources[`../content/${sourcePath}`];

  if (!definition) {
    return <p className="flowchart-error">Fluxograma não encontrado: {sourcePath}</p>;
  }

  return (
    <ZoomableFlowchart label={label}>
      {(expanded) => (
        <figure className={`diagnostic-flowchart${expanded ? ' is-expanded' : ''}`} aria-label={label}>
          <Suspense fallback={<div className="flowchart-loading">Montando fluxograma…</div>}>
            <ClinicalFlow definition={definition} expanded={expanded} />
          </Suspense>
          <figcaption>{caption}</figcaption>
        </figure>
      )}
    </ZoomableFlowchart>
  );
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
            if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-react-flowchart') {
              return <ReactFlowchart source={getNodeText(child.props.children)} />;
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
