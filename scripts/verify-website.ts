import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const docsRoot = resolve('docs');
const sourceRoot = resolve('src');
const distIndex = resolve('dist/index.d.ts');
const sourceIndex = resolve('src/index.ts');
const sourceTypes = resolve('src/types.ts');
const lineWidth = 76;
const rule = process.env.SYSTEMINSPECTOR_ASCII === '1' ? '-' : '─';
const htmlFiles: string[] = [];
const missingRefs: string[] = [];
const docsAuditFailures: string[] = [];
const requiredPages = [
  'index.html',
  'gettingstarted.html',
  'general.html',
  'system.html',
  'cpu.html',
  'memory.html',
  'battery.html',
  'graphics.html',
  'os.html',
  'processes.html',
  'filesystem.html',
  'usb.html',
  'printer.html',
  'audio.html',
  'network.html',
  'wifi.html',
  'bluetooth.html',
  'docker.html',
  'vbox.html',
  'statsfunctions.html'
];

const functionPages: Record<string, string> = {
  version: 'general.html',
  time: 'general.html',
  get: 'general.html',
  getStaticData: 'general.html',
  getDynamicData: 'general.html',
  getAllData: 'general.html',
  observe: 'statsfunctions.html',
  diagnostics: 'general.html',
  clearDiagnostics: 'general.html',
  powerShellStart: 'general.html',
  powerShellRelease: 'general.html',
  system: 'system.html',
  bios: 'system.html',
  baseboard: 'system.html',
  chassis: 'system.html',
  cpu: 'cpu.html',
  cpuFlags: 'cpu.html',
  cpuCache: 'cpu.html',
  cpuCurrentSpeed: 'cpu.html',
  cpuTemperature: 'cpu.html',
  currentLoad: 'cpu.html',
  fullLoad: 'cpu.html',
  mem: 'memory.html',
  memLayout: 'memory.html',
  battery: 'battery.html',
  graphics: 'graphics.html',
  osInfo: 'os.html',
  versions: 'os.html',
  shell: 'os.html',
  uuid: 'os.html',
  users: 'os.html',
  fsSize: 'filesystem.html',
  fsOpenFiles: 'filesystem.html',
  blockDevices: 'filesystem.html',
  fsStats: 'filesystem.html',
  disksIO: 'filesystem.html',
  diskLayout: 'filesystem.html',
  networkInterfaceDefault: 'network.html',
  networkGatewayDefault: 'network.html',
  networkInterfaces: 'network.html',
  networkStats: 'network.html',
  networkConnections: 'network.html',
  inetChecksite: 'network.html',
  inetLatency: 'network.html',
  wifiNetworks: 'wifi.html',
  wifiInterfaces: 'wifi.html',
  wifiConnections: 'wifi.html',
  services: 'processes.html',
  processes: 'processes.html',
  processLoad: 'processes.html',
  dockerInfo: 'docker.html',
  dockerImages: 'docker.html',
  dockerContainers: 'docker.html',
  dockerContainerStats: 'docker.html',
  dockerContainerProcesses: 'docker.html',
  dockerVolumes: 'docker.html',
  dockerAll: 'docker.html',
  vboxInfo: 'vbox.html',
  printer: 'printer.html',
  usb: 'usb.html',
  audio: 'audio.html',
  bluetoothDevices: 'bluetooth.html'
};

const extraTypePages: Record<string, string> = {
  CurrentLoadCpuData: 'cpu.html'
};

function walk(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith('.html')) {
      htmlFiles.push(fullPath);
    }
  }
}

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

function currentDocsHtmlFiles(): string[] {
  return readdirSync(docsRoot)
    .filter((entry) => entry.endsWith('.html'))
    .map((entry) => join(docsRoot, entry));
}

function readCurrentDocsHtml(): string {
  return currentDocsHtmlFiles()
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
}

function parsePublicExports(content: string): string[] {
  const names = new Set<string>();
  for (const match of content.matchAll(/^export (?:declare )?(?:const|function)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

function normalizeResultType(typeName: string): string {
  return typeName
    .replace(/^Promise</, '')
    .replace(/^Partial</, '')
    .replace(/^MaybeUnsupported</, '')
    .replace(/\[\]$/g, '')
    .replace(/[>]/g, '')
    .trim();
}

function parseExportResultTypes(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of content.matchAll(/^export declare const\s+([A-Za-z_$][\w$]*):[^\n;]*=>\s+Promise<([^;]+)>;/gm)) {
    result[match[1]] = normalizeResultType(match[2]);
  }
  for (const match of content.matchAll(/^export declare function\s+([A-Za-z_$][\w$]*)\([^)]*\):\s+Promise<([^;]+)>;/gm)) {
    if (!result[match[1]]) {
      result[match[1]] = normalizeResultType(match[2]);
    }
  }
  for (const match of content.matchAll(/^export declare const\s+([A-Za-z_$][\w$]*):[^\n;]*=>\s+([^;]+);/gm)) {
    if (!result[match[1]]) {
      result[match[1]] = normalizeResultType(match[2]);
    }
  }
  return result;
}

function parseInterfaceFields(content: string): Record<string, string[]> {
  const interfaces: Record<string, string[]> = {};
  for (const match of content.matchAll(/^export interface\s+(\w+)\s+\{([\s\S]*?)\n\}/gm)) {
    interfaces[match[1]] = [...match[2].matchAll(/^\s*([A-Za-z_$][\w$]*)\??:/gm)].map((field) => field[1]);
  }
  return interfaces;
}

function allDataFields(interfaces: Record<string, string[]>): string[] {
  return [...new Set([...(interfaces.StaticData || []), ...(interfaces.DynamicData || [])])];
}

function htmlContainsToken(html: string, token: string): boolean {
  return new RegExp(`(^|[^A-Za-z0-9_$])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z0-9_$]|$)`, 'i').test(html);
}

function htmlContainsFunctionCall(html: string, name: string): boolean {
  return new RegExp(`\\bsi\\.${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`).test(html);
}

function auditDocsAgainstCode(): void {
  const srcExports = parsePublicExports(readFileSync(sourceIndex, 'utf8'));
  const distContent = readFileSync(distIndex, 'utf8');
  const distExports = parsePublicExports(distContent);
  const srcOnly = srcExports.filter((name) => !distExports.includes(name));
  const distOnly = distExports.filter((name) => !srcExports.includes(name));

  for (const name of srcOnly) {
    docsAuditFailures.push(`Export missing from dist/index.d.ts: ${name}`);
  }
  for (const name of distOnly) {
    docsAuditFailures.push(`Export missing from src/index.ts: ${name}`);
  }

  const currentDocsHtml = readCurrentDocsHtml();
  const publicExports = [...new Set([...srcExports, ...distExports])].sort();
  for (const name of publicExports) {
    if (!htmlContainsFunctionCall(currentDocsHtml, name)) {
      docsAuditFailures.push(`Public API not documented in current docs: si.${name}()`);
    }
    if (!functionPages[name]) {
      docsAuditFailures.push(`No docs audit page mapping for public API: ${name}`);
    }
  }

  const resultTypes = parseExportResultTypes(distContent);
  const interfaces = parseInterfaceFields(readFileSync(sourceTypes, 'utf8'));
  for (const [name, page] of Object.entries(functionPages)) {
    const typeName = resultTypes[name];
    const fields = typeName === 'AllData' ? allDataFields(interfaces) : interfaces[typeName] || [];
    if (!fields.length) {
      continue;
    }
    const pagePath = join(docsRoot, page);
    if (!existsSync(pagePath)) {
      docsAuditFailures.push(`Docs audit page missing for ${name}: ${page}`);
      continue;
    }
    const pageHtml = readFileSync(pagePath, 'utf8');
    const missingFields = fields.filter((field) => !htmlContainsToken(pageHtml, field));
    if (missingFields.length) {
      docsAuditFailures.push(`${page} missing ${name} result fields: ${missingFields.join(', ')}`);
    }
  }

  for (const [typeName, page] of Object.entries(extraTypePages)) {
    const pagePath = join(docsRoot, page);
    const pageHtml = readFileSync(pagePath, 'utf8');
    const missingFields = (interfaces[typeName] || []).filter((field) => !htmlContainsToken(pageHtml, field));
    if (missingFields.length) {
      docsAuditFailures.push(`${page} missing ${typeName} fields: ${missingFields.join(', ')}`);
    }
  }
}

function isExternal(ref: string): boolean {
  return (
    ref.startsWith('//') ||
    ref.startsWith('http://') ||
    ref.startsWith('https://') ||
    ref.startsWith('mailto:') ||
    ref.startsWith('javascript:') ||
    ref.startsWith('#')
  );
}

function resolveLocalRef(file: string, ref: string): string {
  if (ref === '.') {
    return join(dirname(file), 'index.html');
  }
  if (ref.startsWith('/')) {
    return join(docsRoot, ref.replace(/^\/+/, ''));
  }
  return resolve(dirname(file), ref);
}

function localRefExists(target: string): boolean {
  return existsSync(target) || (!extname(target) && existsSync(`${target}.html`));
}

function row(label: string, value: string): string {
  return `${label.padEnd(18)} ${value}`;
}

console.log('SystemInspector Website Verification');

console.log('\nChecks');
console.log(rule.repeat(lineWidth));

if (!existsSync(docsRoot)) {
  console.log('FAIL  Docs directory        Missing docs/');
  process.exit(1);
}

walk(docsRoot);

const missingPages = requiredPages.filter((page) => !existsSync(join(docsRoot, page)));
console.log(`${missingPages.length ? 'FAIL' : 'PASS'}  Required pages       ${requiredPages.length - missingPages.length}/${requiredPages.length}`);

const attrPattern = /(?:href|src)=["']([^"'#?]+)(?:#[^"']*)?(?:\?[^"']*)?["']/g;
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(html))) {
    const ref = match[1].trim();
    if (!ref || isExternal(ref)) {
      continue;
    }
    const target = resolveLocalRef(file, ref);
    if (!localRefExists(target)) {
      missingRefs.push(`${relative(docsRoot, file)} -> ${ref}`);
    }
  }
}
console.log(`${missingRefs.length ? 'FAIL' : 'PASS'}  Local links/assets    ${missingRefs.length ? `${missingRefs.length} missing` : `${htmlFiles.length} pages checked`}`);

const indexHtml = readFileSync(join(docsRoot, 'index.html'), 'utf8');
const hasDownloadsApiCall = indexHtml.includes('api.npmjs.org/downloads/point/last-month/systeminspector') && indexHtml.includes('getDownloads();');
console.log(`${hasDownloadsApiCall ? 'FAIL' : 'PASS'}  Homepage console      No failing npm downloads call on load`);

const expectedLineCount = formatNumber(listTypeScriptFiles(sourceRoot).reduce((total, file) => total + countLines(file), 0));
const lineCountMatch = indexHtml.match(/<div class="numbers">([\d,]+)<\/div>\s*\n\s*<div class="title">Lines of code<\/div>/);
const actualLineCount = lineCountMatch?.[1] || 'Missing';
const hasCurrentLineCount = actualLineCount === expectedLineCount;
console.log(`${hasCurrentLineCount ? 'PASS' : 'FAIL'}  Lines of code       ${actualLineCount}${hasCurrentLineCount ? '' : ` expected ${expectedLineCount}`}`);

const expectedDependents = '0';
const dependentsMatch = indexHtml.match(/<div class="numbers">([\d,]+)<\/div>\s*\n\s*<div class="title">Dependents<\/div>/);
const actualDependents = dependentsMatch?.[1] || 'Missing';
const hasCurrentDependents = actualDependents === expectedDependents;
console.log(`${hasCurrentDependents ? 'PASS' : 'FAIL'}  Dependents          ${actualDependents}${hasCurrentDependents ? '' : ` expected ${expectedDependents}`}`);

auditDocsAgainstCode();
console.log(`${docsAuditFailures.length ? 'FAIL' : 'PASS'}  Docs/code audit    ${docsAuditFailures.length ? `${docsAuditFailures.length} issues` : 'Public API and result fields covered'}`);

const failures = [
  ...missingPages.map((page) => `Missing page: ${page}`),
  ...missingRefs,
  ...docsAuditFailures,
  ...(hasCurrentLineCount ? [] : [`Lines of code is ${actualLineCount}; expected ${expectedLineCount}`]),
  ...(hasCurrentDependents ? [] : [`Dependents is ${actualDependents}; expected ${expectedDependents}`])
];

console.log('\nResult');
console.log(rule.repeat(lineWidth));
console.log(row('Status', failures.length || hasDownloadsApiCall ? 'FAIL' : 'PASS'));
console.log(row('Summary', failures.length || hasDownloadsApiCall ? 'Website verification found issues.' : 'Website checks completed successfully.'));

if (failures.length) {
  console.log('\nDetails');
  console.log(rule.repeat(lineWidth));
  for (const failure of failures.slice(0, 50)) {
    console.log(failure);
  }
  if (failures.length > 50) {
    console.log(`... ${failures.length - 50} more`);
  }
}

process.exitCode = failures.length || hasDownloadsApiCall ? 1 : 0;
