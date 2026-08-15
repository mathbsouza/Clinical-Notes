import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import tikzjax from 'node-tikzjax';

const tex2svg = tikzjax.default;

const contentRoot = path.resolve('src/content');

async function findTikzFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findTikzFiles(fullPath) : entry.name.endsWith('.tikz') ? [fullPath] : [];
  }));
  return nested.flat();
}

const files = await findTikzFiles(contentRoot);

for (const inputPath of files) {
  const source = await readFile(inputPath, 'utf8');
  const svg = await tex2svg(`\\begin{document}\n${source}\n\\end{document}`, {
    tikzLibraries: 'positioning,arrows.meta,shapes.geometric',
    embedFontCss: true,
    fontCssUrl: 'https://cdn.jsdelivr.net/npm/node-tikzjax@1.0.5/css/fonts.css',
  });
  const outputPath = inputPath.replace(/\.tikz$/i, '.svg');
  await writeFile(outputPath, svg, 'utf8');
  console.log(`${path.relative(process.cwd(), inputPath)} -> ${path.relative(process.cwd(), outputPath)}`);
}

console.log(`${files.length} diagrama(s) renderizado(s).`);
