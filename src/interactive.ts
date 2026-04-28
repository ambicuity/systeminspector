import * as readline from 'node:readline';
import { inspect } from 'node:util';
import * as si from './index';
import * as pkg from '../package.json';

type MenuItem = [string, string];
type MenuGroup = {
  title: string;
  items: MenuItem[];
};
type TerminalState = 'idle' | 'running' | 'success' | 'error' | 'warning';
type CommandResult = { data: unknown; title: string } | 'not_supported' | 'no_key';
type Command = { key: string; label: string };

const libVersion = pkg.version;
const MIN_WIDTH = 78;
const MAX_WIDTH = 118;

let waiting = false;
let timer: NodeJS.Timeout | undefined;
let runStartedAt = 0;

function terminalWidth(): number {
  return Math.max(MIN_WIDTH, Math.min(process.stdout.columns || 96, MAX_WIDTH));
}

function supportsUnicode(): boolean {
  if (process.env.SYSTEMINSPECTOR_ASCII === '1') {
    return false;
  }
  return process.platform !== 'win32' || Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM || process.env.ConEmuANSI);
}

function supportsColor(): boolean {
  return Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== '1';
}

const glyphs = supportsUnicode()
  ? {
      topLeft: '╭',
      topRight: '╮',
      bottomLeft: '╰',
      bottomRight: '╯',
      horizontal: '─',
      vertical: '│',
      dividerLeft: '├',
      dividerRight: '┤',
      bullet: '•',
      pointer: '›',
      dot: '●'
    }
  : {
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
      horizontal: '-',
      vertical: '|',
      dividerLeft: '+',
      dividerRight: '+',
      bullet: '*',
      pointer: '>',
      dot: '*'
    };

const colorEnabled = supportsColor();
const color = {
  bold: (value: string) => (colorEnabled ? `\x1b[1m${value}\x1b[22m` : value),
  dim: (value: string) => (colorEnabled ? `\x1b[2m${value}\x1b[22m` : value),
  cyan: (value: string) => (colorEnabled ? `\x1b[36m${value}\x1b[39m` : value),
  green: (value: string) => (colorEnabled ? `\x1b[32m${value}\x1b[39m` : value),
  yellow: (value: string) => (colorEnabled ? `\x1b[33m${value}\x1b[39m` : value),
  red: (value: string) => (colorEnabled ? `\x1b[31m${value}\x1b[39m` : value),
  bgKey: (value: string) => (colorEnabled ? `\x1b[48;5;236m\x1b[38;5;159m${value}\x1b[0m` : value),
  panel: (value: string) => (colorEnabled ? `\x1b[38;5;60m${value}\x1b[39m` : value),
  muted: (value: string) => (colorEnabled ? `\x1b[38;5;245m${value}\x1b[39m` : value)
};

const menuGroups: MenuGroup[] = [
  { title: 'Core', items: [['t', 'time'], ['y', 'System'], ['b', 'BIOS'], ['B', 'Baseboard'], ['C', 'Chassis'], ['o', 'OS Info'], ['S', 'Shell'], ['U', 'UUID'], ['z', 'Users']] },
  { title: 'Compute', items: [['c', 'CPU'], ['j', 'CPU Current Speed'], ['T', 'CPU Temperature'], ['l', 'CPU Current Load'], ['L', 'Full Load'], ['m', 'Memory'], ['M', 'MEM Layout'], ['Y', 'Battery'], ['g', 'Graphics']] },
  { title: 'Storage & Devices', items: [['f', 'FS Size'], ['F', 'FS Stats'], ['E', 'Open Files'], ['e', 'Block Devices'], ['d', 'DiskLayout'], ['D', 'DiskIO'], ['u', 'USB'], ['a', 'Audio'], ['r', 'Printer'], ['h', 'Bluetooth']] },
  { title: 'Network', items: [['i', 'INET Latency'], ['I', 'INET Check Site'], ['1', 'NET Iface Default'], ['2', 'NET Gateway Default'], ['3', 'NET Interfaces'], ['4', 'NET Stats'], ['5', 'NET Connections'], ['w', 'WIFI networks'], ['W', 'WIFI interfaces'], ['x', 'WIFI connections']] },
  { title: 'Processes & Containers', items: [['p', 'Processes'], ['P', 'Process Load'], ['s', 'Services'], ['v', 'Versions'], ['V', 'Virtual Box'], ['6', 'Docker Info'], ['7', 'Docker Images'], ['8', 'Docker Container'], ['9', 'Docker Cont Stats'], ['0', 'Docker Cont Proc'], ['+', 'Docker Volumes']] },
  { title: 'Aggregate', items: [['?', 'Get Object'], [',', 'All Static'], ['.', 'All Dynamic'], ['/', 'All'], ['q', 'Quit']] }
];

const commandLookup = new Map<string, string>();
for (const group of menuGroups) {
  for (const [key, label] of group.items) {
    commandLookup.set(key, label);
  }
}
commandLookup.set('getObj', 'Get Object');

function visibleLength(input: string): number {
  return input.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padVisible(input: string, width: number): string {
  return input + ' '.repeat(Math.max(width - visibleLength(input), 0));
}

function rule(width = terminalWidth() - 2): string {
  return glyphs.horizontal.repeat(Math.max(width, 0));
}

function trimLine(input: string, width: number): string {
  if (visibleLength(input) <= width) {
    return input;
  }
  const plain = input.replace(/\x1b\[[0-9;]*m/g, '');
  return `${plain.slice(0, Math.max(width - 1, 0))}${glyphs.pointer}`;
}

function panel(lines: string[], tone: TerminalState = 'idle'): void {
  const width = terminalWidth();
  const innerWidth = width - 2;
  const borderColor = tone === 'error' ? color.red : tone === 'warning' ? color.yellow : tone === 'success' ? color.green : color.panel;
  console.log(borderColor(glyphs.topLeft + rule(innerWidth) + glyphs.topRight));
  for (const line of lines) {
    const visibleLine = trimLine(line, innerWidth - 2);
    console.log(borderColor(glyphs.vertical) + padVisible(` ${visibleLine}`, innerWidth) + borderColor(glyphs.vertical));
  }
  console.log(borderColor(glyphs.bottomLeft + rule(innerWidth) + glyphs.bottomRight));
}

function divider(label?: string): void {
  const width = terminalWidth();
  if (!label) {
    console.log(color.panel(glyphs.dividerLeft + rule(width - 2) + glyphs.dividerRight));
    return;
  }
  const text = ` ${label} `;
  const fill = Math.max(width - visibleLength(text) - 2, 0);
  console.log(color.panel(glyphs.dividerLeft + text + glyphs.horizontal.repeat(fill) + glyphs.dividerRight));
}

function statusBadge(state: TerminalState): string {
  const labels: Record<TerminalState, string> = { idle: 'IDLE', running: 'RUNNING', success: 'READY', error: 'ERROR', warning: 'NOTICE' };
  const stylers: Record<TerminalState, (value: string) => string> = {
    idle: color.cyan,
    running: color.yellow,
    success: color.green,
    error: color.red,
    warning: color.yellow
  };
  return stylers[state](`${glyphs.dot} ${labels[state]}`);
}

function keyBadge(key: string): string {
  return color.bgKey(`[ ${key.trim().padStart(1)} ]`);
}

function renderHeader(state: TerminalState, detail = 'Press a command key to run a check. Press q to quit.'): void {
  console.log('');
  const title = `${color.bold('SystemInspector')} ${color.dim(`Interactive Terminal v${libVersion}`)}`;
  const status = statusBadge(state);
  const innerWidth = terminalWidth() - 2;
  panel([`${title}${' '.repeat(Math.max(innerWidth - visibleLength(title) - visibleLength(status) - 2, 1))}${status}`, color.muted(detail)], state);
}

function renderCommandItem([key, label]: MenuItem, width: number): string {
  return padVisible(`${keyBadge(key)} ${label}`, width);
}

function renderCommandPalette(): void {
  console.log('');
  divider('Command Palette');
  const width = terminalWidth();
  const innerWidth = width - 4;
  const columns = width >= 110 ? 3 : 2;
  const cellWidth = Math.floor(innerWidth / columns);

  for (const group of menuGroups) {
    console.log(`  ${color.cyan(color.bold(group.title))}`);
    for (let index = 0; index < group.items.length; index += columns) {
      console.log(`  ${group.items.slice(index, index + columns).map((item) => renderCommandItem(item, cellWidth)).join('')}`);
    }
    console.log('');
  }
  console.log(`  ${color.muted(`${glyphs.bullet} Commands run one at a time. Results stay in scrollback for review.`)}`);
  divider();
}

function renderEmptyState(): void {
  console.log('');
  panel([
    color.bold('No command has run yet.'),
    color.muted('Choose a key from the palette above to inspect this machine.'),
    `${color.muted('Try')} ${keyBadge('t')} ${color.muted('for time,')} ${keyBadge('m')} ${color.muted('for memory, or')} ${keyBadge('5')} ${color.muted('for network connections.')}`,
    `${color.muted('Use')} ${keyBadge('?')} ${color.muted('for a custom object, and')} ${keyBadge('q')} ${color.muted('to quit.')}`
  ]);
}

function clearline(): void {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(' '.repeat(terminalWidth()));
  readline.cursorTo(process.stdout, 0);
}

function startRunningIndicator(command: Command): void {
  let frame = 0;
  const frames = supportsUnicode() ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] : ['-', '\\', '|', '/'];
  const write = () => {
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`${color.yellow(frames[frame % frames.length])} Running ${keyBadge(command.key)} ${command.label} ${color.dim('one command at a time')}`);
    frame += 1;
  };
  write();
  timer = setInterval(write, 120);
}

function finishRun(): void {
  waiting = false;
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
  clearline();
}

function durationMs(): number {
  return Date.now() - runStartedAt;
}

function renderDuration(duration: number): string {
  return `${color.muted('Time to complete')} ${color.green(`${duration}ms`)}`;
}

function renderState(title: string, lines: string[], tone: TerminalState, duration?: number): void {
  const footer = typeof duration === 'number' ? [renderDuration(duration)] : [];
  console.log('');
  panel([color.bold(title), ...lines.map((line) => color.muted(line)), ...footer], tone);
}

function renderOutputBlock(output: string): void {
  const width = terminalWidth();
  console.log(color.panel(glyphs.topLeft + rule(width - 2) + glyphs.topRight));
  for (const line of output.split(/\r?\n/)) {
    console.log(`${color.panel(glyphs.vertical)} ${line}`);
  }
  console.log(color.panel(glyphs.bottomLeft + rule(width - 2) + glyphs.bottomRight));
}

function renderResult(title: string, command: Command, output: unknown, duration: number): void {
  console.log('');
  panel([`${color.bold(title)} ${color.dim(`v${libVersion}`)}  ${statusBadge('success')}`, `${color.muted('Command')} ${keyBadge(command.key)} ${command.label}   ${renderDuration(duration)}`], 'success');
  renderOutputBlock(inspect(output, { colors: colorEnabled, depth: 4 }));
  renderCommandPalette();
}

function renderStartup(): void {
  renderHeader('idle');
  renderCommandPalette();
  renderEmptyState();
}

async function withSupport<T>(title: string, task: Promise<T> | T): Promise<CommandResult> {
  const data = await task;
  return data !== null ? { data, title } : 'not_supported';
}

async function runCommand(commandKey: string): Promise<CommandResult> {
  switch (commandKey) {
    case 'a': return withSupport('Audio', si.audio());
    case 'b': return withSupport('BIOS', si.bios());
    case 'B': return withSupport('Baseboard', si.baseboard());
    case 'C': return withSupport('Chassis', si.chassis());
    case 'c': return withSupport('CPU', si.cpu());
    case 'd': return withSupport('Disk Layout', si.diskLayout());
    case 'D': return withSupport('Disks IO', si.disksIO());
    case 'e': return withSupport('Block Devices', si.blockDevices());
    case 'E': return withSupport('Open Files', si.fsOpenFiles());
    case 'f': return withSupport('File System', si.fsSize());
    case 'F': return withSupport('FS Stats', si.fsStats());
    case 'g': return withSupport('Graphics', si.graphics());
    case 'h': return withSupport('Bluetooth', si.bluetoothDevices());
    case 'i': return withSupport('Internet Latency', si.inetLatency());
    case 'I': return withSupport('Internet Check Site', si.inetChecksite('https://example.com'));
    case 'j': return withSupport('CPU Current Speed', si.cpuCurrentSpeed());
    case 'l': return withSupport('CPU Current Load', si.currentLoad());
    case 'L': return withSupport('CPU Full Load', si.fullLoad());
    case 'm': return withSupport('Memory', si.mem());
    case 'M': return withSupport('Memory Layout', si.memLayout());
    case 'o': return withSupport('OS Info', si.osInfo());
    case 'p': return withSupport('Processes', si.processes());
    case 'P': return withSupport('Process Load', si.processLoad('postgres, login, apache, mysql, nginx, git, node'));
    case 'r': return withSupport('Printer', si.printer());
    case 's': return withSupport('Services', si.services('apache2, postgres, wsearch'));
    case 'S': return withSupport('Shell', si.shell());
    case 't': return withSupport('Time', si.time());
    case 'T': return withSupport('CPU Temperature', si.cpuTemperature());
    case 'u': return withSupport('USB', si.usb());
    case 'U': return withSupport('UUID', si.uuid());
    case 'v': return withSupport('Versions', si.versions());
    case 'V': return withSupport('Virtual Box', si.vboxInfo());
    case 'w': return withSupport('WIFI Networks', si.wifiNetworks());
    case 'W': return withSupport('WIFI Interfaces', si.wifiInterfaces());
    case 'x': return withSupport('WIFI Connections', si.wifiConnections());
    case 'y': return withSupport('System', si.system());
    case 'Y': return withSupport('Battery', si.battery());
    case 'z': return withSupport('Users', si.users());
    case '1': return withSupport('NET Iface Default', si.networkInterfaceDefault());
    case '2': return withSupport('NET Gateway Default', si.networkGatewayDefault());
    case '3': return withSupport('NET Interfaces', si.networkInterfaces());
    case '4': return withSupport('NET Stats', si.networkStats());
    case '5': return withSupport('NET Connections', si.networkConnections());
    case '6': return withSupport('Docker Info', si.dockerInfo());
    case '7': return withSupport('Docker Images', si.dockerImages());
    case '8': return withSupport('Docker Containers', si.dockerContainers(true));
    case '9': return withSupport('Docker Cont Stats', si.dockerContainerStats('*'));
    case '0': return withSupport('Docker Cont Processes', si.dockerContainerProcesses('*'));
    case '+': return withSupport('Docker Volumes', si.dockerVolumes());
    case ',': return withSupport('All Static Data', si.getStaticData());
    case '.': return withSupport('All Dynamic Data', si.getDynamicData('apache2, postgres, wsearch'));
    case '/': return withSupport('All Data', si.getAllData('apache2, postgres, wsearch'));
    case 'getObj':
      return withSupport('Get Object', si.get({ cpu: '*', osInfo: 'platform, release', system: 'model, manufacturer' }));
    default:
      return 'no_key';
  }
}

function enableUserInput(): boolean {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    renderHeader('warning', 'Interactive mode requires a real terminal.');
    renderState('Interactive mode unavailable', ['Run `systeminspector interactive` directly in a terminal session.', 'Non-interactive shells cannot capture keypresses.'], 'warning');
    process.exitCode = 1;
    return false;
  }
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return true;
}

function shutdown(): void {
  if (typeof process.stdin.setRawMode === 'function') {
    process.stdin.setRawMode(false);
  }
  process.stdin.pause();
  process.exit();
}

export function runInteractive(): void {
  if (!enableUserInput()) {
    return;
  }
  renderStartup();

  process.stdin.on('keypress', async (key: string, data: readline.Key) => {
    if ((data.ctrl && data.name === 'c') || (data.name === 'q' && !data.shift)) {
      shutdown();
      return;
    }
    if (waiting) {
      return;
    }

    const displayKey = key === '?' ? '?' : String(key || '');
    const commandKey = key === '?' ? 'getObj' : displayKey;
    const command = { key: displayKey, label: commandLookup.get(commandKey) || 'Unknown command' };
    waiting = true;
    runStartedAt = Date.now();
    startRunningIndicator(command);

    try {
      const result = await Promise.race<CommandResult>([
        runCommand(commandKey),
        new Promise((resolve) => setTimeout(() => resolve('not_supported'), 30000))
      ]);
      const duration = durationMs();
      finishRun();
      if (result === 'no_key') {
        renderState('Menu item not found', ['Select a valid menu key, or press q to quit.'], 'warning', duration);
      } else if (result === 'not_supported') {
        renderState('Not supported', [`Key: ${commandKey}`, 'This check is not supported on the current platform or timed out.'], 'warning', duration);
      } else {
        renderResult(result.title, command, result.data, duration);
      }
    } catch (error) {
      const duration = durationMs();
      finishRun();
      renderState('Command failed', [`Key: ${commandKey}`, error instanceof Error ? error.message : String(error)], 'error', duration);
    }
  });
}
