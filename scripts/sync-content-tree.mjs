import { mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';

const sourceRoot = '../MedFichas/Entidades';
const targetRoot = 'src/content';

const preserved = new Map();
const legacyFiles = ['cirrose.md', 'suporte-nutricional.md'];

for (const file of legacyFiles) {
  const path = join(targetRoot, file);
  if (existsSync(path)) {
    preserved.set(file, readFileSync(path, 'utf8'));
  }
}

rmSync(targetRoot, { recursive: true, force: true });
mkdirSync(targetRoot, { recursive: true });

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const sourcePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(sourcePath);
      continue;
    }

    if (!entry.isFile() || extname(entry.name) !== '.tex' || entry.name === 'index.tex') {
      continue;
    }

    const relativePath = relative(sourceRoot, sourcePath);
    const markdownPath = join(targetRoot, relativePath).replace(/\.tex$/, '.md');
    mkdirSync(dirname(markdownPath), { recursive: true });

    const parts = relativePath.split('/');
    const title = basename(entry.name, '.tex');
    const entityGroup = parts[0] ?? 'Entidades';
    const category = parts[1] ?? entityGroup;
    const legacyKey =
      title === 'Cirrose' ? 'cirrose.md' : title === 'Suporte Nutricional' ? 'suporte-nutricional.md' : null;

    if (legacyKey && preserved.has(legacyKey)) {
      writeFileSync(markdownPath, preserved.get(legacyKey));
      continue;
    }

    writeFileSync(
      markdownPath,
      `---\ntitle: ${title}\nentityGroup: ${entityGroup}\ncategory: ${category}\nsummary: Conteudo pendente de migracao a partir da ficha LaTeX original.\nupdated: 2026-08-11\ntags: migracao\n---\n\n## Em migracao\n\nEsta ficha ainda precisa ser convertida do formato LaTeX para Markdown com referencias conferidas.\n`
    );
  }
}

walk(sourceRoot);
