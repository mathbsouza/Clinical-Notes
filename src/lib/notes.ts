export type Note = {
  slug: string;
  title: string;
  pathSegments: string[];
  entityGroup: string;
  category: string;
  summary: string;
  updated: string;
  tags: string[];
  body: string;
};

type RawNoteModule = {
  default?: string;
};

const noteModules = import.meta.glob<RawNoteModule>('../content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
});

function parseFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: markdown };
  }

  const meta = Object.fromEntries(
    match[1]
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...value] = line.split(':');
        return [key.trim(), value.join(':').trim()];
      })
  );

  return { meta, body: match[2].trim() };
}

function parseTags(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return [];
  }

  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function slugFromPath(path: string) {
  return pathSegmentsFromPath(path)
    .map((part) =>
      part
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    )
    .join('/');
}

function pathSegmentsFromPath(path: string) {
  const segments = path.replace('../content/', '').replace(/\.md$/, '').split('/');
  const fileSegment = segments.at(-1);
  const parentSegment = segments.at(-2);

  if (fileSegment && parentSegment && fileSegment === parentSegment) {
    return segments.slice(0, -1);
  }

  return segments;
}

export const notes: Note[] = Object.entries(noteModules)
  .map(([path, raw]) => {
    const markdown = String(raw);
    const { meta, body } = parseFrontmatter(markdown);
    const pathSegments = pathSegmentsFromPath(path);

    return {
      slug: slugFromPath(path),
      title: String(meta.title ?? slugFromPath(path)),
      pathSegments,
      entityGroup: String(meta.entityGroup ?? pathSegments[0] ?? 'Entidades'),
      category: String(meta.category ?? pathSegments[1] ?? 'Sem categoria'),
      summary: String(meta.summary ?? ''),
      updated: String(meta.updated ?? ''),
      tags: parseTags(meta.tags),
      body
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

export const categories = Array.from(new Set(notes.map((note) => note.category))).sort((a, b) =>
  a.localeCompare(b, 'pt-BR')
);
