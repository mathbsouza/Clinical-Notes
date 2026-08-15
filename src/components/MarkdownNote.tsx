import { Children, isValidElement, type ReactNode } from 'react';
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

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return '';
}

function Flowchart({ source }: { source: string }) {
  const [root = 'Etiologia', ...branchLines] = source.trim().split(/\r?\n/).filter(Boolean);
  const branches: FlowchartBranch[] = branchLines.map((line) => {
    const [title, ...items] = line.split('|').map((part) => part.trim());
    return { title, items };
  });

  return (
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
              return <Flowchart source={getNodeText(child.props.children)} />;
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
