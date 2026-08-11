import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownNoteProps = {
  body: string;
};

function getNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return getNodeText(node.props.children);
  return '';
}

export default function MarkdownNote({ body }: MarkdownNoteProps) {
  return (
    <article className="prose-notes">
      <ReactMarkdown
        components={{
          table: ({ children }) => (
            <div className="table-scroll" role="region" aria-label="Tabela com rolagem horizontal">
              <table>{children}</table>
            </div>
          ),
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
