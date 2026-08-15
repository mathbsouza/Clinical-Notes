import { Children, isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '../lib/headings';

type MarkdownNoteProps = { body: string };

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

  return <>
    <div className="flowchart-preview" role="button" tabIndex={0} aria-label={`Ampliar ${label}`}
      onClick={() => setExpanded(true)} onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && setExpanded(true)}>
      {children(false)}
      <span className="flowchart-expand-hint">Clique para ampliar</span>
    </div>
    {expanded && <div className="flowchart-lightbox" role="dialog" aria-modal="true" aria-label={label} onClick={() => setExpanded(false)}>
      <div className="flowchart-lightbox-panel" onClick={(event) => event.stopPropagation()}>
        <button className="flowchart-close" type="button" onClick={() => setExpanded(false)} aria-label="Fechar fluxograma ampliado">×</button>
        {children(true)}
      </div>
    </div>}
  </>;
}

function TikzFrame({ source, label, expanded }: { source: string; label: string; expanded: boolean }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const frameId = useMemo(() => `tikz-${crypto.randomUUID()}`, []);
  const safeSource = source.replace(/<\/script/gi, '<\\/script');
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://tikzjax.com/v1/fonts.css">
<style>html,body{margin:0;background:transparent}body{display:flex;justify-content:center;overflow:hidden;padding:8px;box-sizing:border-box}svg{display:block;max-width:100%;height:auto}</style>
</head><body><script type="text/tikz">${safeSource}</script>
<script>const report=()=>parent.postMessage({type:'tikz-height',id:'${frameId}',height:Math.ceil(document.documentElement.scrollHeight)},'*');new MutationObserver(report).observe(document.body,{childList:true,subtree:true});addEventListener('load',report);<\/script>
<script src="https://tikzjax.com/v1/tikzjax.js"><\/script></body></html>`;

  useEffect(() => {
    const resize = (event: MessageEvent) => {
      if (event.data?.type !== 'tikz-height' || event.data.id !== frameId || !frameRef.current) return;
      frameRef.current.style.height = `${Math.max(Number(event.data.height) || 0, 120)}px`;
    };
    window.addEventListener('message', resize);
    return () => window.removeEventListener('message', resize);
  }, [frameId]);

  return <iframe ref={frameRef} className={`tikz-frame${expanded ? ' is-expanded' : ''}`} title={label} srcDoc={srcDoc} sandbox="allow-scripts allow-same-origin" />;
}

function TikzFlowchart({ source }: { source: string }) {
  const firstLineBreak = source.indexOf('\n');
  const metadata = (firstLineBreak >= 0 ? source.slice(0, firstLineBreak) : '').match(/^%\s*([^|]+)\|\s*(.+)$/);
  const label = metadata?.[1].trim() || 'Fluxograma TikZ';
  const caption = metadata?.[2].trim() || '';
  const tikz = firstLineBreak >= 0 && metadata ? source.slice(firstLineBreak + 1).trim() : source.trim();

  return <ZoomableFlowchart label={label}>{(expanded) =>
    <figure className={`diagnostic-flowchart tikz-flowchart${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <TikzFrame source={tikz} label={label} expanded={expanded} />
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
        if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-tikz') {
          return <TikzFlowchart source={getNodeText(child.props.children)} />;
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
