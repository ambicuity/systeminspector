import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const sourceRoot = resolve('src');
const docsIndex = resolve('docs/index.html');
const currentDependents = '0';

function listTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listTypeScriptFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function countLines(file: string): number {
  const content = readFileSync(file, 'utf8');
  if (!content) {
    return 0;
  }
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function sourceLineCount(): number {
  return listTypeScriptFiles(sourceRoot).reduce((total, file) => total + countLines(file), 0);
}

const formattedLineCount = formatNumber(sourceLineCount());
const html = readFileSync(docsIndex, 'utf8');
const lineCountPattern = /<div class="numbers">([\d,]+)<\/div>\s*\n\s*<div class="title">Lines of code<\/div>/;
const dependentsPattern = /<div class="numbers">([\d,]+)<\/div>\s*\n\s*<div class="title">Dependents<\/div>/;
const currentLineCount = html.match(lineCountPattern)?.[1];
const currentDependentsMetric = html.match(dependentsPattern)?.[1];

if (!currentLineCount) {
  throw new Error('Unable to find the current homepage Lines of code metric.');
}

if (!currentDependentsMetric) {
  throw new Error('Unable to find the current homepage Dependents metric.');
}

const updated = html
  .replace(lineCountPattern, `<div class="numbers">${formattedLineCount}</div>\n          <div class="title">Lines of code</div>`)
  .replace(dependentsPattern, `<div class="numbers">${currentDependents}</div>\n          <div class="title">Dependents</div>`);
if (updated !== html) {
  writeFileSync(docsIndex, updated);
}

console.log('SystemInspector Website Metrics');
console.log('');
console.log(`Lines of code     ${formattedLineCount}`);
console.log(`Dependents        ${currentDependents}`);
console.log(`Status            ${currentLineCount === formattedLineCount && currentDependentsMetric === currentDependents ? 'Already current' : 'Updated docs/index.html'}`);
