import { Children, isValidElement, useEffect, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '../lib/headings';

type MarkdownNoteProps = { body: string };

const diagramSources = import.meta.glob<string>('../content/**/diagrams/*.svg', {
  eager: true,
  query: '?url',
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
  const [zoom, setZoom] = useState(1);
  const changeZoom = (delta: number) => setZoom((current) => Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))));
  const open = () => { setZoom(1); setExpanded(true); };

  useEffect(() => {
    if (!expanded) return;
    const handleKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
      if (event.key === '+' || event.key === '=') changeZoom(0.25);
      if (event.key === '-') changeZoom(-0.25);
      if (event.key === '0') setZoom(1);
    };
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [expanded]);

  return <>
    <div className="flowchart-preview" role="button" tabIndex={0} aria-label={`Ampliar ${label}`}
      onClick={open} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && open()}>
      {children(false)}
    </div>
    {expanded && <div className="flowchart-lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={() => setExpanded(false)}>
      <div className="flowchart-lightbox-panel" onClick={(event) => event.stopPropagation()}>
        <div className="flowchart-toolbar" aria-label="Controles de zoom">
          <button type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label="Reduzir zoom">−</button>
          <button type="button" onClick={() => setZoom(1)} aria-label="Restaurar zoom">{Math.round(zoom * 100)}%</button>
          <button type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label="Aumentar zoom">+</button>
        </div>
        <button className="flowchart-close" type="button" onClick={() => setExpanded(false)} aria-label="Fechar fluxograma ampliado">×</button>
        <div className="flowchart-zoom-content" style={{ width: `${zoom * 100}%`, minWidth: `${zoom * 75}rem` }}>
          {children(true)}
        </div>
      </div>
    </div>}
  </>;
}

function StaticFlowchart({ source }: { source: string }) {
  const [sourcePath, label = 'Fluxograma', caption = ''] = source.trim().split('|').map((part) => part.trim());
  const imageUrl = diagramSources[`../content/${sourcePath}`];
  if (!imageUrl) return <p className="flowchart-error">Diagrama não encontrado: {sourcePath}</p>;

  return <ZoomableFlowchart label={label}>{(expanded) =>
    <figure className={`diagnostic-flowchart static-flowchart${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <img className="static-flowchart-image" src={imageUrl} alt={label} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  }</ZoomableFlowchart>;
}

export default function MarkdownNote({ body }: MarkdownNoteProps) {
  return <article className="prose-notes">
    <ReactMarkdown components={{
      h2: ({ children }) => <h2 id={headingId(getNodeText(children))}>{children}</h2>,
      h3: ({ children }) => <h3 id={headingId(getNodeText(children))}>{children}</h3>,
      table: ({ children }) => <div className="table-scroll" role="region" aria-label="Tabela com rolagem horizontal"><table>{children}</table></div>,
      pre: ({ children }) => {
        const child = Children.toArray(children)[0];
        if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-svg-diagram') {
          return <StaticFlowchart source={getNodeText(child.props.children)} />;
        }
        return <pre>{children}</pre>;
      },
      tr: ({ children }) => {
        const cells = Children.toArray(children);
        const firstCell = cells[0];
        const firstText = getNodeText(firstCell).trim();
        const hasOnlyEmptyTrailingCells = cells.slice(1).every((cell) => getNodeText(cell).trim().length === 0);
        if (/^(Legenda|Nota|Abreviações):/i.test(firstText) && hasOnlyEmptyTrailingCells) {
          return <tr className="table-note-row"><td colSpan={Math.max(cells.length, 1)}>{isValidElement<{ children?: ReactNode }>(firstCell) ? firstCell.props.children : firstCell}</td></tr>;
        }
        return <tr>{children}</tr>;
      },
    }} remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
  </article>;
}
