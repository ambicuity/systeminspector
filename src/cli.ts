#!/usr/bin/env node

'use strict';
// ==================================================================================
// cli.js
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================

import * as si from './index';
import * as pkg from '../package.json';
import { runInteractive } from './interactive';
import { redactData } from './redaction';

const libVersion = pkg.version;
const WIDTH = 76;
const LABEL_WIDTH = 18;
const VALUE_WIDTH = WIDTH - LABEL_WIDTH - 5;
const LABEL_ALIASES: Record<string, string> = {
  arch: 'Architecture',
  virtual: 'Virtualized'
};

function supportsUnicode(): boolean {
  if (process.env.SYSTEMINSPECTOR_ASCII === '1' || process.env.NO_COLOR === '1') {
    return false;
  }
  return process.platform !== 'win32' || Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM || process.env.ConEmuANSI);
}

function supportsColor(): boolean {
  return Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== '1' && process.env.SYSTEMINSPECTOR_ASCII !== '1';
}

const glyphs = supportsUnicode()
  ? {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      horizontal: '─',
      vertical: '│',
      branch: '├',
      branchRight: '┤',
      bullet: '›'
    }
  : { topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+', horizontal: '-', vertical: '|', branch: '+', branchRight: '+', bullet: '>' };

const colorEnabled = supportsColor();

const style = {
  dim: (value: string) => (colorEnabled ? `\x1b[2m${value}\x1b[22m` : value),
  cyan: (value: string) => (colorEnabled ? `\x1b[36m${value}\x1b[39m` : value),
  green: (value: string) => (colorEnabled ? `\x1b[32m${value}\x1b[39m` : value),
  red: (value: string) => (colorEnabled ? `\x1b[31m${value}\x1b[39m` : value),
  yellow: (value: string) => (colorEnabled ? `\x1b[33m${value}\x1b[39m` : value),
  bold: (value: string) => (colorEnabled ? `\x1b[1m${value}\x1b[22m` : value)
};

function safeValue(input: unknown): string {
  if (input === undefined || input === null || input === '') {
    return 'Unknown';
  }
  if (typeof input === 'number' && !Number.isFinite(input)) {
    return 'Unknown';
  }
  if (typeof input === 'boolean') {
    return input ? 'Yes' : 'No';
  }
  if (Array.isArray(input)) {
    return input.length ? JSON.stringify(input) : 'None';
  }
  if (typeof input === 'object') {
    return JSON.stringify(input);
  }
  return String(input);
}

function visibleLength(input: string): number {
  return input.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padVisible(input: string, width: number): string {
  const padding = Math.max(width - visibleLength(input), 0);
  return input + ' '.repeat(padding);
}

function normalizeLine(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function wrapText(input: string, width: number): string[] {
  const value = normalizeLine(input);
  if (!value) {
    return [''];
  }

  const lines: string[] = [];
  let line = '';

  for (const word of value.split(' ')) {
    if (!line) {
      line = word;
      continue;
    }
    if (visibleLength(`${line} ${word}`) <= width) {
      line += ` ${word}`;
      continue;
    }
    lines.push(line);
    line = word;
  }

  if (line) {
    lines.push(line);
  }

  return lines.flatMap((lineValue) => {
    if (visibleLength(lineValue) <= width) {
      return [lineValue];
    }

    const chunks: string[] = [];
    for (let index = 0; index < lineValue.length; index += width) {
      chunks.push(lineValue.slice(index, index + width));
    }
    return chunks;
  });
}

function formatValue(input: unknown): string {
  const value = safeValue(input);
  if (value === 'Unknown' || value === 'None') {
    return style.dim(value);
  }
  if (value === 'Yes') {
    return style.green(value);
  }
  if (value === 'No') {
    return style.yellow(value);
  }
  return value;
}

function labelize(input: string): string {
  if (LABEL_ALIASES[input]) {
    return LABEL_ALIASES[input];
  }
  return input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

function row(label: string, input: unknown): string[] {
  const value = formatValue(input);
  const valueLines = wrapText(value, VALUE_WIDTH);
  return valueLines.map((line, index) => {
    const labelText = index === 0 ? label : '';
    return `${style.dim(padVisible(labelText, LABEL_WIDTH))}  ${line}`;
  });
}

function section(title: string): string {
  const heading = ` ${title} `;
  const right = Math.max(WIDTH - visibleLength(heading) - 1, 1);
  return `\n${style.cyan(glyphs.branch + glyphs.horizontal + heading + glyphs.horizontal.repeat(right) + glyphs.branchRight)}`;
}

function boxHeader(title: string, version: string): string {
  const versionText = `v${version}`;
  const innerWidth = WIDTH - 2;
  const subtitle = 'system and operating system inspection';
  const titleLine = ` ${style.bold(title)} ${style.dim(versionText)}`;
  const subtitleLine = ` ${subtitle}`;
  return [
    style.cyan(glyphs.topLeft + glyphs.horizontal.repeat(innerWidth) + glyphs.topRight),
    style.cyan(glyphs.vertical) + padVisible(titleLine, innerWidth) + style.cyan(glyphs.vertical),
    style.cyan(glyphs.vertical) + style.dim(padVisible(subtitleLine, innerWidth)) + style.cyan(glyphs.vertical),
    style.cyan(glyphs.bottomLeft + glyphs.horizontal.repeat(innerWidth) + glyphs.bottomRight)
  ].join('\n');
}

function printRows(data: Record<string, unknown>, omit: string[] = []): void {
  const omitted = new Set(omit);
  for (const [key, currentValue] of Object.entries(data)) {
    if (!omitted.has(key)) {
      for (const line of row(labelize(key), currentValue)) {
        console.log(line);
      }
    }
  }
}

function commandRow(command: string, description: string): string {
  return `  ${style.cyan(command.padEnd(30))} ${description}`;
}

function printHelp(): void {
  console.log(boxHeader('SystemInspector CLI', libVersion));
  console.log('\nUsage');
  console.log(glyphs.horizontal.repeat(WIDTH));
  console.log(commandRow('systeminspector', 'Print static system data as JSON'));
  console.log(commandRow('systeminspector info', 'Print a readable system report'));
  console.log(commandRow('systeminspector get cpu,mem', 'Print selected API results as JSON'));
  console.log(commandRow('systeminspector capabilities', 'Print capability metadata'));
  console.log(commandRow('systeminspector doctor', 'Check runtime tools and platform support'));
  console.log(commandRow('systeminspector schema [name]', 'Print JSON schema metadata'));
  console.log(commandRow('systeminspector watch cpu,mem', 'Stream selected API results'));
  console.log(commandRow('systeminspector support-report', 'Print a redacted support bundle JSON'));
  console.log(commandRow('systeminspector interactive', 'Open the interactive terminal inspector'));
  console.log(commandRow('systeminspector --help', 'Show this command reference'));
  console.log(`\n${style.dim('Useful flags: --json, --pretty, --redact, --timeout <ms>, --interval <ms>.')}`);
}

function printError(message: string, suggestedNextStep: string): void {
  const lines = [
    boxHeader('SystemInspector CLI', libVersion),
    '',
    `${style.dim('Status'.padEnd(LABEL_WIDTH))}  ${style.red('FAIL')}`,
    `${style.dim('Error'.padEnd(LABEL_WIDTH))}  ${message}`,
    '',
    'Suggested next step',
    glyphs.horizontal.repeat(WIDTH),
    `${glyphs.bullet} ${suggestedNextStep}`
  ];
  console.error(lines.join('\n'));
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function flagValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function timeoutOption(args: string[]): number | undefined {
  const timeout = flagValue(args, '--timeout');
  const parsed = timeout ? parseInt(timeout, 10) : 0;
  return parsed > 0 ? parsed : undefined;
}

function printJson(data: unknown, pretty: boolean): void {
  console.log(JSON.stringify(data, null, pretty ? 2 : 0));
}

function selectorFromList(list: string): si.GetValueObject {
  return list
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, key) => {
      acc[key as keyof si.GetValueObject] = '*';
      return acc;
    }, {} as si.GetValueObject);
}

async function info(args: string[] = []): Promise<void> {
  const options = { timeoutMs: timeoutOption(args), redact: hasFlag(args, '--redact') };
  console.log(boxHeader('SystemInspector', libVersion));

  const osInfo = redactData(await si.osInfo(), options.redact);
  console.log(section('Operating System'));
  printRows(osInfo as unknown as Record<string, unknown>, ['serial', 'servicepack', 'logofile', 'fqdn', 'uefi']);

  const system = redactData(await si.system(), options.redact);
  console.log(section('System'));
  printRows(system as unknown as Record<string, unknown>, ['serial', 'uuid', 'sku']);

  const cpu = await si.cpu({ timeoutMs: options.timeoutMs, redact: options.redact });
  console.log(section('CPU'));
  printRows(cpu as unknown as Record<string, unknown>, ['cache', 'governor', 'flags', 'virtualization', 'revision', 'voltage', 'vendor', 'speedMin', 'speedMax']);
  console.log();
}

async function printStaticData(_args: string[] = []): Promise<void> {
  const data = await si.getStaticData();
  printJson({ ...data, time: si.time() }, true);
}

async function printCapabilities(args: string[]): Promise<void> {
  const data = await si.capabilities({ timeoutMs: timeoutOption(args) });
  printJson(data, hasFlag(args, '--pretty') || !hasFlag(args, '--json'));
}

async function doctor(args: string[]): Promise<void> {
  const caps = await si.capabilities({ timeoutMs: timeoutOption(args) });
  const missing = caps.filter((cap) => cap.requiredTools.length > 0 && cap.availableTools.length === 0);
  const remediation = missing.map((cap) => ({
    function: cap.function,
    code: 'missing_tool',
    recommendation:
      process.platform === 'win32'
        ? `Install or enable required tools for ${cap.function}: ${cap.requiredTools.join(', ')}`
        : `Install required tools for ${cap.function}: ${cap.requiredTools.join(', ')}`
  }));
  const payload = {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    supportedFunctions: caps.filter((cap) => cap.supported).length,
    totalFunctions: caps.length,
    missingTools: missing.map((cap) => ({ function: cap.function, requiredTools: cap.requiredTools, notes: cap.notes })),
    remediation,
    diagnostics: si.diagnostics()
  };
  if (hasFlag(args, '--json')) {
    printJson(payload, hasFlag(args, '--pretty'));
    return;
  }
  console.log(boxHeader('SystemInspector Doctor', libVersion));
  console.log(section('Runtime'));
  printRows({ node: payload.node, platform: payload.platform, arch: payload.arch, supportedFunctions: `${payload.supportedFunctions}/${payload.totalFunctions}` });
  console.log(section('Missing Tools'));
  if (!payload.missingTools.length) {
    console.log(`${style.dim('Status'.padEnd(LABEL_WIDTH))}  ${style.green('No missing required tools detected')}`);
  } else {
    for (const item of payload.missingTools.slice(0, 20)) {
      console.log(`${style.dim(String(item.function).padEnd(LABEL_WIDTH))}  ${item.requiredTools.join(', ')}`);
    }
    if (payload.remediation.length) {
      console.log(section('Remediation'));
      payload.remediation.slice(0, 20).forEach((item) => {
        console.log(`${style.dim(String(item.function).padEnd(LABEL_WIDTH))}  ${item.recommendation}`);
      });
    }
  }
}

async function supportReport(args: string[]): Promise<void> {
  const redact = hasFlag(args, '--redact') || !hasFlag(args, '--no-redact');
  const timeoutMs = timeoutOption(args);
  const data = await si.getAllData({ timeoutMs, redact, envelope: true });
  const caps = await si.capabilities({ timeoutMs });
  const payload = {
    generatedAt: new Date().toISOString(),
    redacted: redact,
    schemaVersion: si.schemaVersion(),
    diagnostics: si.diagnostics(),
    capabilities: caps,
    snapshot: data
  };
  printJson(payload, true);
}

async function printSchema(args: string[]): Promise<void> {
  const name = args.find((arg) => !arg.startsWith('-') && arg !== 'schema');
  printJson(si.getSchema(name), true);
}

async function getSelected(args: string[]): Promise<void> {
  const list = args.find((arg) => !arg.startsWith('-') && arg !== 'get') || 'cpu,osInfo';
  const data = await si.get(selectorFromList(list));
  printJson(data, hasFlag(args, '--pretty'));
}

async function watchSelected(args: string[]): Promise<void> {
  const list = args.find((arg) => !arg.startsWith('-') && arg !== 'watch') || 'cpuCurrentSpeed,currentLoad,mem';
  const interval = parseInt(flagValue(args, '--interval') || '1000', 10) || 1000;
  for await (const snapshot of si.watch(selectorFromList(list), { intervalMs: interval, timeoutMs: timeoutOption(args) })) {
    printJson({ time: si.time().current, data: snapshot }, hasFlag(args, '--pretty'));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    await printStaticData(args);
    return;
  }

  if (command === 'info') {
    await info(args);
    return;
  }

  if (command === 'capabilities') {
    await printCapabilities(args);
    return;
  }

  if (command === 'doctor') {
    await doctor(args);
    return;
  }

  if (command === 'schema') {
    await printSchema(args);
    return;
  }

  if (command === 'get') {
    await getSelected(args);
    return;
  }

  if (command === 'watch') {
    await watchSelected(args);
    return;
  }

  if (command === 'support-report') {
    await supportReport(args);
    return;
  }

  if (command === 'interactive') {
    runInteractive();
    return;
  }

  if (command === '--help' || command === '-h' || command === 'help') {
    printHelp();
    return;
  }

  printError(`Unknown command: ${command}`, 'Run `systeminspector --help` to see available commands.');
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : safeValue(error);
  printError(message, 'Review the error above and rerun the command.');
  process.exitCode = 1;
});
