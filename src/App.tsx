import { useEffect, useMemo, useState } from 'react';
import { AArrowDown, AArrowUp, ArrowLeft, ArrowRight, CalendarDays, ChevronsDownUp, ChevronsUpDown, FileText, Folder, Menu, Search, Tags } from 'lucide-react';
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

const articleHashPrefix = '#/artigo/';

function articleHash(slug: string) {
  return `${articleHashPrefix}${slug.split('/').map(encodeURIComponent).join('/')}`;
}

function articleSlugFromHash() {
  if (!window.location.hash.startsWith(articleHashPrefix)) return '';
  try {
    return window.location.hash
      .slice(articleHashPrefix.length)
      .split('/')
      .map(decodeURIComponent)
      .join('/');
  } catch {
    return '';
  }
}

function validArticleSlugFromHash() {
  const slug = articleSlugFromHash();
  return notes.some((note) => note.slug === slug) ? slug : '';
}

function ReaderControls() {
  const accordions = (detail: 'expand' | 'collapse') => window.dispatchEvent(new CustomEvent('clinical-notes:accordions', { detail }));
  const fontSize = (detail: number) => window.dispatchEvent(new CustomEvent('clinical-notes:font-size', { detail }));
  const buttonClass = 'inline-flex h-9 w-9 items-center justify-center rounded-md text-neutral-400 transition hover:bg-orange-300/10 hover:text-orange-200';
  return <div className="reader-controls flex items-center gap-0.5" aria-label="Controles do artigo">
    <button aria-label="Expandir todos os accordions" className={buttonClass} onClick={() => accordions('expand')} title="Expandir tudo" type="button"><ChevronsUpDown size={18} aria-hidden="true" /></button>
    <button aria-label="Recolher todos os accordions" className={buttonClass} onClick={() => accordions('collapse')} title="Recolher tudo" type="button"><ChevronsDownUp size={18} aria-hidden="true" /></button>
    <button aria-label="Aumentar tamanho da letra" className={buttonClass} onClick={() => fontSize(0.08)} title="Aumentar letra" type="button"><AArrowUp size={18} aria-hidden="true" /></button>
    <button aria-label="Diminuir tamanho da letra" className={buttonClass} onClick={() => fontSize(-0.08)} title="Diminuir letra" type="button"><AArrowDown size={18} aria-hidden="true" /></button>
  </div>;
}
export default function App() {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [activeSlug, setActiveSlug] = useState(validArticleSlugFromHash);
  const [view, setView] = useState<'home' | 'article'>(() => validArticleSlugFromHash() ? 'article' : 'home');
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches);
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

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktop(media.matches);

    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const syncArticleWithUrl = () => {
      const slug = validArticleSlugFromHash();
      setActiveSlug(slug);
      setView(slug ? 'article' : 'home');
    };

    window.addEventListener('hashchange', syncArticleWithUrl);
    window.addEventListener('popstate', syncArticleWithUrl);
    return () => {
      window.removeEventListener('hashchange', syncArticleWithUrl);
      window.removeEventListener('popstate', syncArticleWithUrl);
    };
  }, []);

  function selectNode(node: NavNode) {
    if (node.note) {
      openArticle(node.note.slug);
      return;
    }

    setSelectedPath(node.path);
  }

  function openArticle(slug: string) {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${articleHash(slug)}`);
    setActiveSlug(slug);
    setView('article');
  }

  function retractTo(index: number) {
    setSelectedPath(selectedPath.slice(0, Math.max(index, 0)));
  }

  function returnHome() {
    window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    setActiveSlug('');
    setView('home');
    setSelectedPath([]);
    setQuery('');
  }

  if (isDesktop) {
    return (
      <DesktopReader
        activeNote={activeNote}
        menuColumns={visibleColumns}
        onOpenArticle={openArticle}
        onRetract={retractTo}
        onSelectNode={selectNode}
        query={query}
        searchResults={hasQuery ? searchResults : notes}
        setQuery={setQuery}
      />
    );
  }

  if (view === 'article') {
    return (
      <main className="page-enter min-h-screen bg-neutral-950 text-neutral-100">
        <header className="border-b border-orange-300/10 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <button
              className="inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-orange-200"
              onClick={returnHome}
              type="button"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Voltar
            </button>
            <button
              className="hidden text-lg font-semibold tracking-tight text-neutral-200 transition hover:text-orange-200 sm:block"
              onClick={returnHome}
              type="button"
            >
              Clinical Notes
            </button>
            <ReaderControls />

          </div>
        </header>

        <article className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
          {activeNote ? (
            <>
              <div className="border-b border-orange-300/10 pb-5">
                <div className="flex flex-wrap items-center gap-3 text-[0.82rem] font-medium text-neutral-500">
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
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.025em] text-neutral-50 sm:text-5xl">
                  {activeNote.title}
                </h1>
                <p className="mt-4 max-w-2xl text-[1.03rem] leading-7 text-neutral-400">{activeNote.summary}</p>
              </div>

              <div className="pt-0">
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
            className="text-4xl font-semibold leading-none tracking-[-0.025em] text-neutral-50 transition hover:text-orange-200"
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

type DesktopReaderProps = {
  activeNote?: Note;
  menuColumns: NavNode[];
  query: string;
  searchResults: Note[];
  setQuery: (query: string) => void;
  onOpenArticle: (slug: string) => void;
  onRetract: (index: number) => void;
  onSelectNode: (node: NavNode) => void;
};

function DesktopReader({
  activeNote,
  menuColumns,
  query,
  searchResults,
  setQuery,
  onOpenArticle,
  onRetract,
  onSelectNode,
}: DesktopReaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuStep = Math.max(menuColumns.length - 1, 0);

  return (
    <main className={`flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100${sidebarOpen ? ' sidebar-is-open' : ''}`}>
      <header className="relative z-10 grid h-16 shrink-0 grid-cols-[1fr_minmax(22rem,38rem)_1fr] items-center border-b border-orange-300/10 bg-neutral-950/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            aria-label={sidebarOpen ? 'Fechar menu de artigos' : 'Abrir menu de artigos'}
            aria-expanded={sidebarOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-neutral-400 transition hover:bg-orange-300/10 hover:text-orange-200"
            onClick={() => setSidebarOpen((open) => !open)}
            type="button"
          >
            <Menu size={21} aria-hidden="true" />
          </button>
          <span className="text-xl font-semibold tracking-tight text-neutral-100">Clinical Notes</span>
        </div>

        <label className="search-shell group relative block w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 transition group-focus-within:text-orange-300" size={17} />
          <input
            aria-label="Pesquisar artigos"
            className="h-10 w-full rounded-md border border-orange-300/10 bg-neutral-900/65 pl-10 pr-3 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-orange-300/35"
            placeholder="Pesquisar artigos"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="flex justify-end">{activeNote ? <ReaderControls /> : null}</div>
      </header>

      <div className={`grid min-h-0 flex-1 transition-[grid-template-columns] duration-200 ${sidebarOpen ? 'grid-cols-[19rem_minmax(0,1fr)]' : 'grid-cols-[0_minmax(0,1fr)]'}`}>
      <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-orange-300/10 bg-neutral-950">
        <nav aria-label="Artigos" className="relative min-h-0 flex-1 overflow-hidden">
          {query.trim() ? (
            <div className="sidebar-scroll h-full overflow-y-auto px-2 py-3">
              {searchResults.map((note) => {
                const isActive = note.slug === activeNote?.slug;

                return (
                  <button
                    className={`desktop-note-link w-full rounded-md px-3 py-2.5 text-left ${isActive ? 'is-active' : ''}`}
                    key={note.slug}
                    onClick={() => onOpenArticle(note.slug)}
                    type="button"
                  >
                    <span className="block truncate text-[0.68rem] uppercase tracking-[0.12em] text-neutral-600">
                      {note.pathSegments.slice(0, -1).join(' / ')}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.9rem] font-medium text-neutral-300">{note.title}</span>
                  </button>
                );
              })}

              {searchResults.length === 0 ? (
                <p className="px-3 py-4 text-sm text-neutral-500">Nenhum artigo encontrado.</p>
              ) : null}
            </div>
          ) : (
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${menuStep * 100}%)` }}
            >
              {menuColumns.map((node, index) => (
                <div className="sidebar-scroll h-full w-full shrink-0 overflow-y-auto bg-neutral-950 px-3 py-3" key={node.path.join('/') || 'root'}>
                  <NavColumn
                    node={node}
                    onRetract={index > 0 ? () => onRetract(index - 1) : undefined}
                    onReturn={() => onRetract(index)}
                    onSelect={onSelectNode}
                    query=""
                  />
                </div>
              ))}
            </div>
          )}
        </nav>
      </aside>

      <section className="min-w-0 overflow-y-auto">
        {activeNote ? (
          <article className="mx-auto max-w-[50rem] px-10 py-12 xl:px-12">
            <header className="border-b border-white/[0.07] pb-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-neutral-600">
                {activeNote.pathSegments.slice(0, -1).join(' / ')}
              </p>
              <h1 className="mt-3 text-5xl font-semibold leading-[1.06] tracking-[-0.035em] text-neutral-50">
                {activeNote.title}
              </h1>
              {activeNote.summary ? (
                <p className="mt-3 text-[1.04rem] leading-6 text-neutral-400">{activeNote.summary}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-neutral-600">
                <span>{activeNote.category}</span>
                <span aria-hidden="true">·</span>
                <span>{activeNote.updated || 'Sem data'}</span>
                {activeNote.tags.length ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{activeNote.tags.slice(0, 3).join(', ')}</span>
                  </>
                ) : null}
              </div>
            </header>
            <div className="pt-0">
              <MarkdownNote body={activeNote.body} />
            </div>
          </article>
        ) : (
          <section className="mx-auto flex min-h-full max-w-[50rem] items-center px-10 py-12 xl:px-12">
            <div className="w-full max-w-2xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-orange-300/10 bg-orange-400/[0.06] text-orange-200/70">
                <FileText size={19} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-orange-200/45">
                Biblioteca clínica
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.035em] text-neutral-100">
                Bem-vindo ao Clinical Notes
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">
                Um espaço para consultar notas clínicas organizadas por entidade e especialidade, com conteúdo direto e referências rastreáveis.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-white/[0.06] bg-neutral-900/35 p-4">
                  <p className="text-sm font-medium text-neutral-300">Explore o conteúdo</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Use o menu à esquerda para navegar entre categorias e artigos.
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-neutral-900/35 p-4">
                  <p className="text-sm font-medium text-neutral-300">Encontre rapidamente</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    Pesquise títulos, especialidades, tags ou termos do conteúdo.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs text-neutral-700">{notes.length} notas disponíveis</p>
            </div>
          </section>
        )}
      </section>
      </div>
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
                <h3 className="mt-1 text-xl font-semibold leading-tight tracking-[-0.02em] text-neutral-100 transition group-hover:translate-x-0.5 group-hover:text-orange-100">
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
      <div className="mb-3 px-2 pb-2 pt-1">
        <div className="flex items-center gap-2">
          {onRetract ? (
            <button
              aria-label="Voltar ao nível anterior"
              className="-ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-800 hover:text-orange-200"
              onClick={onRetract}
              type="button"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
          ) : (
            <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400/80 shadow-[0_0_10px_rgb(251_146_60/0.35)]" />
          )}
          <button className="min-w-0 flex-1 text-left" onClick={onReturn} type="button">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-neutral-600">
              {node.path.length === 0 ? 'Biblioteca' : node.path.slice(0, -1).at(-1) ?? 'Conteúdo'}
            </p>
            <h2 className="mt-0.5 truncate text-[0.95rem] font-semibold tracking-tight text-neutral-200">{title}</h2>
          </button>
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[0.68rem] tabular-nums text-neutral-500 ring-1 ring-inset ring-white/[0.06]">
            {visibleChildren.length}
          </span>
        </div>
      </div>

      <div className="sidebar-scroll flex-1 overflow-y-auto">
        {visibleChildren.map((child, index) => {
          const isArticle = Boolean(child.note);
          const Icon = isArticle ? FileText : Folder;
          const count = isArticle ? null : child.children.filter((item) => nodeHasMatch(item, query)).length;

          return (
            <button
              className="menu-option group mb-1 w-full rounded-lg px-2.5 py-2.5 text-left"
              key={child.path.join('/')}
              onClick={() => onSelect(child)}
              style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="menu-option-icon inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/[0.05] bg-neutral-900 text-neutral-500 shadow-sm shadow-black/20">
                  <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[0.88rem] font-medium leading-5 tracking-[-0.01em] text-neutral-300">
                    {isArticle ? child.note?.title : child.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] leading-4 text-neutral-600">
                    <span className="truncate">{isArticle ? child.note?.category : `${count} ${count === 1 ? 'item' : 'itens'}`}</span>
                  </div>
                </div>
                {!isArticle ? (
                  <ArrowRight className="shrink-0 text-neutral-700 transition group-hover:translate-x-0.5 group-hover:text-neutral-400" size={14} />
                ) : null}
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
