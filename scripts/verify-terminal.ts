import { spawnSync } from 'node:child_process';

type Check = {
  name: string;
  expression: string;
  timeoutMs?: number;
};

type Group = {
  name: string;
  checks: Check[];
};

const timeoutMs = 20000;
const lineWidth = 76;

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
  ? { topLeft: '┌', topRight: '┐', bottomLeft: '└', bottomRight: '┘', horizontal: '─', vertical: '│', branch: '├', branchRight: '┤', bullet: '›' }
  : { topLeft: '+', topRight: '+', bottomLeft: '+', bottomRight: '+', horizontal: '-', vertical: '|', branch: '+', branchRight: '+', bullet: '>' };
const rule = glyphs.horizontal;
const colorEnabled = supportsColor();
const style = {
  dim: (value: string) => (colorEnabled ? `\x1b[2m${value}\x1b[22m` : value),
  cyan: (value: string) => (colorEnabled ? `\x1b[36m${value}\x1b[39m` : value),
  green: (value: string) => (colorEnabled ? `\x1b[32m${value}\x1b[39m` : value),
  red: (value: string) => (colorEnabled ? `\x1b[31m${value}\x1b[39m` : value),
  bold: (value: string) => (colorEnabled ? `\x1b[1m${value}\x1b[22m` : value)
};

const groups: Group[] = [
  {
    name: 'General',
    checks: [
      { name: 'version', expression: 'si.version()' },
      { name: 'time', expression: 'si.time()' },
      { name: 'getStaticData', expression: 'await si.getStaticData()' },
      { name: 'getDynamicData', expression: 'await si.getDynamicData()', timeoutMs: 30000 },
      { name: 'getAllData', expression: 'await si.getAllData()', timeoutMs: 30000 },
      { name: 'get', expression: "await si.get({ cpu: 'manufacturer', osInfo: 'platform' })" }
    ]
  },
  { name: 'System', checks: ['system', 'bios', 'baseboard', 'chassis'].map((name) => api(name)) },
  { name: 'CPU', checks: ['cpu', 'cpuFlags', 'cpuCache', 'cpuCurrentSpeed', 'cpuTemperature', 'currentLoad', 'fullLoad'].map((name) => api(name)) },
  { name: 'Memory', checks: ['mem', 'memLayout'].map((name) => api(name)) },
  { name: 'Battery', checks: [api('battery')] },
  { name: 'Graphics', checks: [api('graphics')] },
  { name: 'OS', checks: ['osInfo', 'versions', 'shell', 'uuid', 'users'].map((name) => api(name)) },
  {
    name: 'Processes / Services',
    checks: [
      api('processes'),
      { name: 'processLoad', expression: "await si.processLoad('node')" },
      { name: 'services', expression: "await si.services('ssh')" }
    ]
  },
  { name: 'Disks / FS', checks: ['fsSize', 'blockDevices', 'fsStats', 'disksIO', 'diskLayout', 'fsOpenFiles'].map((name) => api(name)) },
  { name: 'USB', checks: [api('usb')] },
  { name: 'Printer', checks: [api('printer')] },
  { name: 'Audio', checks: [api('audio')] },
  {
    name: 'Network',
    checks: ['networkInterfaces', 'networkInterfaceDefault', 'networkGatewayDefault', 'networkStats', 'networkConnections'].map((name) => api(name))
  },
  { name: 'Wifi', checks: ['wifiNetworks', 'wifiInterfaces', 'wifiConnections'].map((name) => api(name)) },
  { name: 'Bluetooth', checks: [api('bluetoothDevices')] },
  {
    name: 'Docker',
    checks: ['dockerInfo', 'dockerImages', 'dockerContainers', 'dockerContainerStats', 'dockerContainerProcesses', 'dockerVolumes', 'dockerAll'].map((name) => api(name))
  },
  { name: 'Virtual Box', checks: [api('vboxInfo')] },
  {
    name: 'Observers / Stats',
    checks: [
      {
        name: 'observe',
        expression: "const handle = si.observe({ cpu: 'manufacturer' }, 250, () => undefined); clearInterval(handle)"
      },
      api('fsStats'),
      api('disksIO'),
      api('networkStats')
    ]
  }
];

function api(name: string): Check {
  return { name, expression: `await si.${name}()` };
}

function row(label: string, value: string): string {
  return `${style.dim(label.padEnd(18))} ${value}`;
}

function section(title: string): void {
  const heading = ` ${title} `;
  const length = Math.max(lineWidth - heading.length - 1, 1);
  console.log(`\n${style.cyan(glyphs.branch + rule + heading + rule.repeat(length) + glyphs.branchRight)}`);
}

function printHeader(): void {
  const innerWidth = lineWidth - 2;
  const title = style.bold('SystemInspector Terminal Verification');
  const subtitle = style.dim('smoke checks for terminal-facing API categories');
  console.log(style.cyan(glyphs.topLeft + rule.repeat(innerWidth) + glyphs.topRight));
  console.log(style.cyan(glyphs.vertical) + ` ${title}`.padEnd(innerWidth) + style.cyan(glyphs.vertical));
  console.log(style.cyan(glyphs.vertical) + ` ${subtitle}`.padEnd(innerWidth) + style.cyan(glyphs.vertical));
  console.log(style.cyan(glyphs.bottomLeft + rule.repeat(innerWidth) + glyphs.bottomRight));
}

function statusText(ok: boolean): string {
  return ok ? style.green('PASS') : style.red('FAIL');
}

function commandFor(check: Check): string {
  return `
const si = require('./dist');
Promise.resolve()
  .then(async () => {
    ${check.expression};
  })
  .then(
    () => process.exit(0),
    (error) => {
      console.error(error && error.message ? error.message : String(error));
      process.exit(1);
    }
  );
`;
}

function lastRelevantOutput(stdout: string, stderr: string): string {
  const lines = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return lines.slice(-8).join('\n') || 'No output captured.';
}

function runCheck(check: Check): { ok: boolean; error?: string } {
  const result = spawnSync(process.execPath, ['-e', commandFor(check)], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout: check.timeoutMs || timeoutMs,
    windowsHide: true
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  if (result.status !== 0) {
    return { ok: false, error: lastRelevantOutput(result.stdout || '', result.stderr || '') };
  }

  return { ok: true };
}

printHeader();

section('Environment');
console.log(row('Node.js', process.version));
console.log(row('Platform', `${process.platform} ${process.arch}`));

let failures = 0;

section('Checks');

for (const group of groups) {
  let passed = 0;
  const errors: string[] = [];

  for (const check of group.checks) {
    const result = runCheck(check);
    if (result.ok) {
      passed += 1;
    } else {
      failures += 1;
      errors.push(`${check.name}: ${result.error || 'Failed'}`);
    }
  }

  const ok = errors.length === 0;
  const status = statusText(ok);
  console.log(`${status}  ${group.name.padEnd(22)} ${passed}/${group.checks.length}`);
  for (const error of errors) {
    console.log(`      ${glyphs.bullet} ${error}`);
  }
}

section('Result');
console.log(row('Status', failures ? style.red('FAIL') : style.green('PASS')));
console.log(row('Summary', failures ? `${failures} terminal checks failed.` : 'All terminal checks completed successfully.'));

process.exitCode = failures ? 1 : 0;
