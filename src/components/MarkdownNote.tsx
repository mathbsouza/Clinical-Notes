import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownNoteProps = {
  body: string;
};

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
        }}
        remarkPlugins={[remarkGfm]}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
