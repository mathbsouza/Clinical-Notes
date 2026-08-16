import { Children, isValidElement, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { headingId } from '../lib/headings';
import HyponatremiaTreatmentWizard from '../content/Disorders/Nefrologia/Hiponatremia/magic-flowchart/HyponatremiaTreatmentWizard';

type MarkdownNoteProps = { body: string };

const diagramSources = import.meta.glob<string>('../content/**/diagrams/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

type MarkdownAstNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownAstNode[];
  data?: { hName?: string; hProperties?: Record<string, unknown> };
};

type MarkdownAstRoot = MarkdownAstNode & { children: MarkdownAstNode[] };

function getAstText(node: MarkdownAstNode): string {
  if (node.value) return node.value;
  return node.children?.map(getAstText).join('') ?? '';
}

function remarkH2Accordions() {
  return (tree: MarkdownAstRoot) => {
    const output: MarkdownAstNode[] = [];
    let section: MarkdownAstNode[] | undefined;

    const flush = () => {
      if (!section) return;
      output.push({
        type: 'blockquote',
        data: { hName: 'details', hProperties: { className: ['note-accordion'] } },
        children: section,
      });
      section = undefined;
    };

    for (const node of tree.children) {
      if (node.type === 'heading' && node.depth === 2) {
        flush();
        const title = getAstText(node);
        section = [{
          ...node,
          data: { hName: 'summary', hProperties: { id: headingId(title), className: ['note-accordion-summary'] } },
        }];
      } else if (section) {
        section.push(node);
      } else {
        output.push(node);
      }
    }

    flush();
    tree.children = output;
  };
}
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
  const [sourcePath, label = 'Fluxograma', captionRaw = ''] = source.trim().split('|').map((part) => part.trim());
  const caption = captionRaw;
  const imageUrl = diagramSources[`../content/${sourcePath}`];
  if (!imageUrl) return <p className="flowchart-error">Diagrama não encontrado: {sourcePath}</p>;

  return <ZoomableFlowchart label={label}>{(expanded) =>
<figure className={`diagnostic-flowchart static-flowchart${/\.svg$/i.test(sourcePath) ? '' : ' is-raster'}${expanded ? ' is-expanded' : ''}`} aria-label={label}>
      <img className="static-flowchart-image" src={imageUrl} alt={label} />
      {caption && <figcaption>{caption.split('↵').map((line, index) => <span key={index}>{line}</span>)}</figcaption>}
    </figure>
  }</ZoomableFlowchart>;
}

function CopyTreatmentBlock({ children }: { children: ReactNode }) {
  const text = getNodeText(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return <div className="copy-treatment">
    <button type="button" onClick={copy} aria-label="Copiar conduta">{copied ? 'Copiado!' : 'Copiar'}</button>
    <pre><code>{text}</code></pre>
  </div>;
}
type TocItem = { depth: number; id: string; label: string };

function markdownHeadings(body: string): TocItem[] {
  return body.split(/\r?\n/).flatMap((line) => {
    const match = /^(#{2,5})\s+(.+?)\s*$/.exec(line);
    if (!match) return [];
    const label = match[2].replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`~]/g, '').trim();
    return [{ depth: match[1].length, id: headingId(label), label }];
  });
}

function NoteToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const toggle = () => setCollapsed((value) => !value);
    window.addEventListener('clinical-notes:toc-toggle', toggle);
    return () => window.removeEventListener('clinical-notes:toc-toggle', toggle);
  }, []);
  const goTo = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    const accordion = target.closest('details');
    if (accordion) accordion.open = true;
    setActiveId(id);
    window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  if (!items.length) return null;
  return <aside className={`note-toc${collapsed ? ' is-collapsed' : ''}`} aria-label="Sumário do artigo">
    <div className="note-toc-head">
      <div className="note-toc-title">Sumário</div>
    </div>
    <nav>{items.map((item) => <button className={activeId === item.id ? 'is-active' : ''}
      key={`${item.depth}-${item.id}`} onClick={() => goTo(item.id)}
      style={{ paddingLeft: `${0.65 + (item.depth - 2) * 0.8}rem` }} type="button">{item.label}</button>)}</nav>
  </aside>;
}
export default function MarkdownNote({ body }: MarkdownNoteProps) {
  const tocItems = useMemo(() => markdownHeadings(body), [body]);
  const articleRef = useRef<HTMLElement>(null);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const toggleAccordions = (event: Event) => {
      const expand = (event as CustomEvent<'expand' | 'collapse'>).detail === 'expand';
      articleRef.current?.querySelectorAll<HTMLDetailsElement>('details.note-accordion').forEach((item) => { item.open = expand; });
    };
    const resizeFont = (event: Event) => {
      const delta = (event as CustomEvent<number>).detail;
      setFontScale((current) => Math.min(1.3, Math.max(0.85, Number((current + delta).toFixed(2)))));
    };
    window.addEventListener('clinical-notes:accordions', toggleAccordions);
    window.addEventListener('clinical-notes:font-size', resizeFont);
    return () => {
      window.removeEventListener('clinical-notes:accordions', toggleAccordions);
      window.removeEventListener('clinical-notes:font-size', resizeFont);
    };
  }, []);

  return <div className="note-layout"><article className="prose-notes" ref={articleRef} style={{ '--note-font-scale': fontScale } as CSSProperties}>
    <ReactMarkdown components={{
      h1: ({ children }) => <h1 id={headingId(getNodeText(children))}>{children}</h1>,
      h2: ({ children }) => <h2 id={headingId(getNodeText(children))}>{children}</h2>,
      h3: ({ children }) => <h3 id={headingId(getNodeText(children))}>{children}</h3>,
      h4: ({ children }) => <h4 id={headingId(getNodeText(children))}>{children}</h4>,
      h5: ({ children }) => <h5 id={headingId(getNodeText(children))}>{children}</h5>,
      section: ({ children, className, node: _node, ...props }) => className?.includes('footnotes')
        ? <details className="note-accordion footnotes-accordion">
            <summary className="note-accordion-summary">Notas e referências</summary>
            <div className="footnotes-accordion-content">{children}</div>
          </details>
        : <section className={className} {...props}>{children}</section>,      table: ({ children }) => <div className="table-scroll" role="region" aria-label="Tabela com rolagem horizontal"><table>{children}</table></div>,
      pre: ({ children }) => {
        const child = Children.toArray(children)[0];
        if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-svg-diagram') {
          return <StaticFlowchart source={getNodeText(child.props.children)} />;
        }
        if (isValidElement<{ className?: string }>(child) && child.props.className === 'language-hyponatremia-treatment') {
          return <HyponatremiaTreatmentWizard />;
        }
        if (isValidElement<{ className?: string; children?: ReactNode }>(child) && child.props.className === 'language-copy-treatment') {
          return <CopyTreatmentBlock>{child.props.children}</CopyTreatmentBlock>;
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
    }} remarkPlugins={[remarkGfm, remarkH2Accordions]}>{body}</ReactMarkdown>
  </article><NoteToc items={tocItems} /></div>;
}
