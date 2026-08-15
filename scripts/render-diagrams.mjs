import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import tikzjax from 'node-tikzjax';

const tex2svg = tikzjax.default;

const contentRoot = path.resolve('src/content');
const fontRoot = path.resolve('node_modules/node-tikzjax/css/bakoma/ttf');

async function embedUsedFonts(svg) {
  const families = [...new Set(
    [...svg.matchAll(/font-family="([^"]+)"/g)].map((match) => match[1]),
  )];
  const declarations = await Promise.all(families.map(async (family) => {
    const font = await readFile(path.join(fontRoot, `${family}.ttf`));
    return `@font-face{font-family:${family};src:url(data:font/ttf;base64,${font.toString('base64')}) format('truetype')}`;
  }));
  const styles = `<defs><style>${declarations.join('')}</style></defs>`;
  return svg.replace(/<defs><style>[\s\S]*?<\/style><\/defs>/, styles);
}

function addWhiteBackground(svg) {
  const values = svg.match(/viewBox="([^"]+)"/)?.[1]?.trim().split(/\s+/).map(Number);
  if (!values || values.length !== 4 || values.some(Number.isNaN)) {
    throw new Error('O SVG gerado não contém um viewBox válido.');
  }
  const [x, y, width, height] = values;
  const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>`;
  return svg.replace(/<svg\b[^>]*>/, (tag) => `${tag}${rect}`);
}

async function findTikzFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? findTikzFiles(fullPath) : entry.name.endsWith('.tikz') ? [fullPath] : [];
  }));
  return nested.flat();
}

const filters = process.argv.slice(2).map((value) => value.toLowerCase());
const allFiles = await findTikzFiles(contentRoot);
const files = filters.length
  ? allFiles.filter((file) => filters.some((filter) => file.toLowerCase().includes(filter)))
  : allFiles;

if (files.length === 0) {
  throw new Error(`Nenhum diagrama encontrado para: ${filters.join(', ')}`);
}

for (const inputPath of files) {
  const source = await readFile(inputPath, 'utf8');
  const svg = await tex2svg(`\\begin{document}\n${source}\n\\end{document}`, {
    showConsole: process.env.DIAGRAM_DEBUG === '1',
    tikzLibraries: 'matrix,positioning,arrows.meta,shapes.geometric,calc',
    embedFontCss: true,
    fontCssUrl: 'https://cdn.jsdelivr.net/npm/node-tikzjax@1.0.5/css/fonts.css',
  });
  const outputPath = inputPath.replace(/\.tikz$/i, '.svg');
  await writeFile(outputPath, addWhiteBackground(await embedUsedFonts(svg)), 'utf8');
  console.log(`${path.relative(process.cwd(), inputPath)} -> ${path.relative(process.cwd(), outputPath)}`);
}

console.log(`${files.length} diagrama(s) renderizado(s).`);
