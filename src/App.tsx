import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, FileText, Folder, Search, Tags } from 'lucide-react';
import MarkdownNote from './components/MarkdownNote';
import { type Note, notes } from './lib/notes';

type NavNode = {
  name: string;
  path: string[];
  children: NavNode[];
  note?: Note;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildTree(noteList: Note[]) {
  const root: NavNode = { name: 'Conteudo', path: [], children: [] };

  for (const note of noteList) {
    let cursor = root;

    note.pathSegments.forEach((segment, index) => {
      const path = note.pathSegments.slice(0, index + 1);
      let child = cursor.children.find((node) => node.name === segment);

      if (!child) {
        child = { name: segment, path, children: [] };
        cursor.children.push(child);
      }

      if (index === note.pathSegments.length - 1) {
        child.note = note;
      }

      cursor = child;
    });
  }

  function sortNode(node: NavNode) {
    node.children.sort((a, b) => {
      if (a.note && !b.note) return 1;
      if (!a.note && b.note) return -1;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
    node.children.forEach(sortNode);
  }

  sortNode(root);
  return root;
}

function findNode(root: NavNode, path: string[]) {
  return path.reduce<NavNode | undefined>(
    (cursor, segment) => cursor?.children.find((node) => node.name === segment),
    root
  );
}

function noteMatches(note: Note, query: string) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return true;

  return normalizeText(
    [note.title, note.entityGroup, note.category, note.summary, note.tags.join(' '), note.pathSegments.join(' '), note.body].join(' ')
  ).includes(normalizedQuery);
}

function nodeHasMatch(node: NavNode, query: string): boolean {
  if (node.note) return noteMatches(node.note, query);
  return node.children.some((child) => nodeHasMatch(child, query));
}

function scoreNote(note: Note, query: string) {
  const normalizedQuery = normalizeText(query.trim());
  if (!normalizedQuery) return 0;

  const title = normalizeText(note.title);
  const category = normalizeText(note.category);
  const entityGroup = normalizeText(note.entityGroup);
  const path = normalizeText(note.pathSegments.join(' '));
  const summary = normalizeText(note.summary);
  const tags = normalizeText(note.tags.join(' '));
  const body = normalizeText(note.body);

  let score = 0;
  if (title === normalizedQuery) score += 120;
  if (title.startsWith(normalizedQuery)) score += 80;
  if (title.includes(normalizedQuery)) score += 55;
  if (tags.includes(normalizedQuery)) score += 35;
  if (category.includes(normalizedQuery)) score += 28;
  if (entityGroup.includes(normalizedQuery)) score += 24;
  if (path.includes(normalizedQuery)) score += 20;
  if (summary.includes(normalizedQuery)) score += 14;
  if (body.includes(normalizedQuery)) score += 5;

  return score;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [activeSlug, setActiveSlug] = useState(notes[0]?.slug ?? '');
  const [view, setView] = useState<'home' | 'article'>('home');
  const hasQuery = query.trim().length > 0;

  const tree = useMemo(() => buildTree(notes), []);
  const searchResults = useMemo(
    () =>
      notes
        .map((note) => ({ note, score: scoreNote(note, query) }))
        .filter((result) => result.score > 0)
        .sort((a, b) => b.score - a.score || a.note.title.localeCompare(b.note.title, 'pt-BR'))
        .map((result) => result.note),
    [query]
  );
  const visibleColumns = useMemo(() => {
    const columns: NavNode[] = [tree];

    for (let index = 0; index < selectedPath.length; index += 1) {
      const node = findNode(tree, selectedPath.slice(0, index + 1));
      if (node && !node.note) {
        columns.push(node);
      }
    }

    return columns;
  }, [selectedPath, tree]);

  const activeNote = notes.find((note) => note.slug === activeSlug);
  const mobileStep = Math.max(visibleColumns.length - 1, 0);

  function selectNode(node: NavNode) {
    if (node.note) {
      openArticle(node.note.slug);
      return;
    }

    setSelectedPath(node.path);
  }

  function openArticle(slug: string) {
    setActiveSlug(slug);
    setView('article');
  }

  function retractTo(index: number) {
    setSelectedPath(selectedPath.slice(0, Math.max(index, 0)));
  }

  function returnHome() {
    setView('home');
    setSelectedPath([]);
    setQuery('');
  }

  if (view === 'article') {
    return (
      <main className="page-enter min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-orange-300/10 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
            <button
              className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-orange-200"
              onClick={() => setView('home')}
              type="button"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Voltar
            </button>
            <button
              className="hidden font-serif text-lg font-medium text-neutral-200 transition hover:text-orange-200 sm:block"
              onClick={returnHome}
              type="button"
            >
              Clinical Notes
            </button>
            <span className="text-xs uppercase tracking-[0.18em] text-orange-200/35">
              {activeNote?.pathSegments.slice(0, -1).join(' / ')}
            </span>
          </div>
        </header>

        <article className="mx-auto max-w-3xl px-5 py-8">
          {activeNote ? (
            <>
              <div className="border-b border-orange-300/10 pb-6">
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                  <span>{activeNote.category}</span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={15} aria-hidden="true" />
                    {activeNote.updated || 'Sem data'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Tags size={15} aria-hidden="true" />
                    {activeNote.tags.join(', ') || 'Sem tags'}
                  </span>
                </div>
                <h1 className="mt-4 font-serif text-4xl font-medium leading-tight tracking-normal text-neutral-50 sm:text-5xl">
                  {activeNote.title}
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-neutral-400">{activeNote.summary}</p>
              </div>

              <div className="pt-7">
                <MarkdownNote body={activeNote.body} />
              </div>
            </>
          ) : (
            <p className="text-neutral-400">Artigo não encontrado.</p>
          )}
        </article>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <section className="page-enter mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-7">
        <header className="pb-6">
          <button
            className="font-serif text-4xl font-medium leading-none tracking-normal text-neutral-50 transition hover:text-orange-200"
            onClick={returnHome}
            type="button"
          >
            Clinical Notes
          </button>
          <p className="mt-2 text-sm text-orange-200/45">{notes.length} notas</p>
        </header>

        <label className="search-shell group relative block">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-neutral-500 transition group-focus-within:text-orange-300" size={18} />
          <input
            autoFocus
            className="h-11 w-full border-0 border-b border-orange-300/10 bg-transparent pl-7 pr-3 text-base text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-orange-300/50"
            placeholder="Pesquisar"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {hasQuery ? (
          <SearchResults results={searchResults} onOpenArticle={openArticle} />
        ) : (
          <>
            <div className="mt-7 hidden justify-center md:flex">
              <div
                className="cascade-grid grid min-h-[430px] gap-x-9"
                style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(210px, 240px))` }}
              >
                {visibleColumns.map((node, index) => (
                  <NavColumn
                    key={node.path.join('/') || 'root'}
                    node={node}
                    onReturn={() => setSelectedPath(node.path)}
                    onRetract={index > 0 ? () => retractTo(index - 1) : undefined}
                    onSelect={selectNode}
                    query={query}
                  />
                ))}
              </div>
            </div>

            <div className="relative mt-6 min-h-[calc(100vh-150px)] overflow-hidden md:hidden">
              <div
                className="flex h-full min-h-[calc(100vh-160px)] transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${mobileStep * 100}%)` }}
              >
                {visibleColumns.map((node, index) => (
                  <div className="w-full shrink-0 bg-neutral-950" key={node.path.join('/') || 'root'}>
                    <NavColumn
                      node={node}
                      onReturn={() => setSelectedPath(node.path)}
                      onRetract={index > 0 ? () => retractTo(index - 1) : undefined}
                      onSelect={selectNode}
                      query={query}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

type SearchResultsProps = {
  results: Note[];
  onOpenArticle: (slug: string) => void;
};

function SearchResults({ results, onOpenArticle }: SearchResultsProps) {
  return (
    <section className="panel-enter mx-auto mt-7 w-full max-w-2xl">
      <div className="column-heading mb-2 rounded-md border border-orange-300/10 bg-neutral-900/70 px-3 py-2 shadow-sm shadow-black/30">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-orange-200/35">Busca</p>
        <h2 className="mt-0.5 text-sm font-medium tracking-normal text-neutral-300">
          {results.length} resultado{results.length === 1 ? '' : 's'}
        </h2>
      </div>

      <div className="divide-y divide-orange-300/10">
        {results.map((note, index) => (
          <button
            className="article-row group relative w-full overflow-hidden py-4 text-left"
            key={note.slug}
            onClick={() => onOpenArticle(note.slug)}
            style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
            type="button"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-xs text-orange-200/40">{note.pathSegments.slice(0, -1).join(' / ')}</p>
                <h3 className="mt-1 font-serif text-xl font-medium leading-tight tracking-normal text-neutral-100 transition group-hover:translate-x-0.5 group-hover:text-orange-100">
                  {note.title}
                </h3>
                {note.summary ? (
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">{note.summary}</p>
                ) : null}
              </div>
              <ArrowRight className="mt-1 shrink-0 text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-orange-300" size={16} />
            </div>
          </button>
        ))}

        {results.length === 0 ? (
          <p className="py-5 text-sm text-neutral-500">Nenhum artigo encontrado.</p>
        ) : null}
      </div>
    </section>
  );
}

type NavColumnProps = {
  node: NavNode;
  query: string;
  onReturn: () => void;
  onRetract?: () => void;
  onSelect: (node: NavNode) => void;
};

function NavColumn({ node, query, onReturn, onRetract, onSelect }: NavColumnProps) {
  const visibleChildren = node.children.filter((child) => nodeHasMatch(child, query));
  const title = node.path.length === 0 ? 'Conteúdo' : node.name;

  return (
    <section className="panel-enter flex h-full flex-col">
      <div className="column-heading mb-2 rounded-md border border-orange-300/10 bg-neutral-900/70 px-3 py-2 shadow-sm shadow-black/30">
        <div className="flex items-center justify-between gap-3">
          <button
            className="min-w-0 flex-1 text-left transition hover:text-orange-200"
            onClick={onReturn}
            type="button"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-orange-200/35">
              {node.path.length === 0 ? 'Início' : node.note ? 'Artigo' : 'Pasta'}
            </p>
            <h2 className="mt-0.5 truncate text-sm font-medium tracking-normal text-neutral-300">{title}</h2>
          </button>
          {onRetract ? (
            <button
              aria-label="Retrair menu"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-orange-300/10 hover:text-orange-200"
              onClick={onRetract}
              type="button"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleChildren.map((child, index) => {
          const isArticle = Boolean(child.note);
          const Icon = isArticle ? FileText : Folder;
          const count = isArticle ? null : child.children.filter((item) => nodeHasMatch(item, query)).length;

          return (
            <button
              className="menu-option group w-full border-b border-orange-300/10 py-4 text-left"
              key={child.path.join('/')}
              onClick={() => onSelect(child)}
              style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              type="button"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-neutral-500">
                    <Icon size={15} aria-hidden="true" />
                    <span className="text-xs">{isArticle ? child.note?.category : count}</span>
                  </div>
                  <h3 className="truncate font-serif text-xl font-medium leading-tight tracking-normal text-neutral-200">
                    {isArticle ? child.note?.title : child.name}
                  </h3>
                  {isArticle && child.note?.summary ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-neutral-500">{child.note.summary}</p>
                  ) : null}
                </div>
                <ArrowRight className="shrink-0 text-neutral-600 transition group-hover:translate-x-0.5 group-hover:text-orange-300" size={16} />
              </div>
            </button>
          );
        })}

        {visibleChildren.length === 0 ? (
          <p className="py-4 text-sm text-neutral-500">Nada encontrado.</p>
        ) : null}
      </div>
    </section>
  );
}
