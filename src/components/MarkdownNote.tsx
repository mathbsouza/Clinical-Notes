import { Children, isValidElement, useEffect, useId, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '../lib/headings';

type MarkdownNoteProps = {
  body: string;
};

const flowchartSources = import.meta.glob<string>('../content/**/*.mmd', {
  eager: true,
  query: '?raw',
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

function MermaidDiagram({ definition, expanded }: { definition: string; expanded: boolean }) {
  const diagramId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        htmlLabels: true,
        themeVariables: {
          background: '#0a0a0a',
          primaryColor: '#171717',
          primaryTextColor: '#f5f5f5',
          primaryBorderColor: '#fb923c',
          lineColor: '#fb923c',
          edgeLabelBackground: '#171717',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
        flowchart: {
          defaultRenderer: 'elk',
          curve: 'stepAfter',
          nodeSpacing: 34,
          rankSpacing: 50,
          useMaxWidth: true,
          wrappingWidth: 220,
        },
      });
      return mermaid.render(`mermaid-${diagramId}-${expanded ? 'large' : 'preview'}`, definition);
    }).then(({ svg: renderedSvg }) => {
      if (active) setSvg(renderedSvg);
    }).catch(() => {
      if (active) setError('Não foi possível renderizar o fluxograma.');
    });
    return () => { active = false; };
  }, [definition, diagramId, expanded]);

  if (error) return <p className="flowchart-error">{error}</p>;
  if (!svg) return <div className="flowchart-loading">Montando fluxograma…</div>;
  return <div className={`mermaid-flowchart${expanded ? ' is-expanded' : ''}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function MermaidFlowchart({ source }: { source: string }) {
  const [sourcePath, label, caption] = source.trim().split('|').map((part) => part.trim());
  const definition = flowchartSources[`../content/${sourcePath}`];

  if (!definition) {
    return <p className="flowchart-error">Fluxograma não encontrado: {sourcePath}</p>;
  }

  return (
    <ZoomableFlowchart label={label}>
      {(expanded) => (
        <figure className={`diagnostic-flowchart${expanded ? ' is-expanded' : ''}`} aria-label={label}>
          <MermaidDiagram definition={definition} expanded={expanded} />
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
            if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-mermaid-flowchart') {
              return <MermaidFlowchart source={getNodeText(child.props.children)} />;
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
