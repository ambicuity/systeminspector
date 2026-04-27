const readline = require('readline');
const util = require('util');
const utils = require('../dist/util');
const execFile = require('child_process').execFile;
const lib_version = require('../package.json').version;
const path = require('path');

type MenuItem = [string, string];
type MenuGroup = {
  title: string;
  items: MenuItem[];
};

type TerminalState = 'idle' | 'running' | 'success' | 'error' | 'warning';

let waiting = false;
let timer: any;
let runStartedAt = 0;
let activeCommand: { key: string; label: string } | null = null;

const MIN_WIDTH = 78;
const MAX_WIDTH = 118;

function terminalWidth() {
  return Math.max(MIN_WIDTH, Math.min(process.stdout.columns || 96, MAX_WIDTH));
}

function supportsUnicode() {
  if (process.env.SYSTEMINSPECTOR_ASCII === '1') {
    return false;
  }
  return process.platform !== 'win32' || Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM || process.env.ConEmuANSI);
}

function supportsColor() {
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
  reset: '\x1b[0m',
  bold: (value: string) => (colorEnabled ? `\x1b[1m${value}\x1b[22m` : value),
  dim: (value: string) => (colorEnabled ? `\x1b[2m${value}\x1b[22m` : value),
  cyan: (value: string) => (colorEnabled ? `\x1b[36m${value}\x1b[39m` : value),
  blue: (value: string) => (colorEnabled ? `\x1b[34m${value}\x1b[39m` : value),
  green: (value: string) => (colorEnabled ? `\x1b[32m${value}\x1b[39m` : value),
  yellow: (value: string) => (colorEnabled ? `\x1b[33m${value}\x1b[39m` : value),
  red: (value: string) => (colorEnabled ? `\x1b[31m${value}\x1b[39m` : value),
  magenta: (value: string) => (colorEnabled ? `\x1b[35m${value}\x1b[39m` : value),
  bgKey: (value: string) => (colorEnabled ? `\x1b[48;5;236m\x1b[38;5;159m${value}\x1b[0m` : value),
  panel: (value: string) => (colorEnabled ? `\x1b[38;5;60m${value}\x1b[39m` : value),
  muted: (value: string) => (colorEnabled ? `\x1b[38;5;245m${value}\x1b[39m` : value)
};

const menuGroups: MenuGroup[] = [
  {
    title: 'Core',
    items: [
      ['t', 'time'],
      ['y', 'System'],
      ['b', 'BIOS'],
      ['B', 'Baseboard'],
      ['C', 'Chassis'],
      ['o', 'OS Info'],
      ['S', 'Shell'],
      ['U', 'UUID'],
      ['z', 'Users']
    ]
  },
  {
    title: 'Compute',
    items: [
      ['c', 'CPU'],
      ['j', 'CPU Current Speed'],
      ['T', 'CPU Temperature'],
      ['l', 'CPU Current Load'],
      ['L', 'Full Load'],
      ['m', 'Memory'],
      ['M', 'MEM Layout'],
      ['Y', 'Battery'],
      ['g', 'Graphics']
    ]
  },
  {
    title: 'Storage & Devices',
    items: [
      ['f', 'FS Size'],
      ['F', 'FS Stats'],
      ['E', 'Open Files'],
      ['e', 'Block Devices'],
      ['d', 'DiskLayout'],
      ['D', 'DiskIO'],
      ['u', 'USB'],
      ['a', 'Audio'],
      ['r', 'Printer'],
      ['h', 'Bluetooth']
    ]
  },
  {
    title: 'Network',
    items: [
      ['i', 'INET Latency'],
      ['I', 'INET Check Site'],
      ['1', 'NET Iface Default'],
      ['2', 'NET Gateway Default'],
      ['3', 'NET Interfaces'],
      ['4', 'NET Stats'],
      ['5', 'NET Connections'],
      ['w', 'WIFI networks'],
      ['W', 'WIFI interfaces'],
      ['x', 'WIFI connections']
    ]
  },
  {
    title: 'Processes & Containers',
    items: [
      ['p', 'Processes'],
      ['P', 'Process Load'],
      ['s', 'Services'],
      ['v', 'Versions'],
      ['V', 'Virtual Box'],
      ['6', 'Docker Info'],
      ['7', 'Docker Images'],
      ['8', 'Docker Container'],
      ['9', 'Docker Cont Stats'],
      ['0', 'Docker Cont Proc'],
      ['+', 'Docker Volumes']
    ]
  },
  {
    title: 'Aggregate',
    items: [
      ['?', 'Get Object'],
      [',', 'All Static'],
      ['.', 'All Dynamic'],
      ['/', 'All'],
      ['q', 'Quit']
    ]
  }
];

const commandLookup = new Map<string, string>();
for (const group of menuGroups) {
  for (const [key, label] of group.items) {
    commandLookup.set(key, label);
  }
}
commandLookup.set('getObj', 'Get Object');

function visibleLength(input: string) {
  return input.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function padVisible(input: string, width: number) {
  return input + ' '.repeat(Math.max(width - visibleLength(input), 0));
}

function center(input: string, width: number) {
  const gap = Math.max(width - visibleLength(input), 0);
  const left = Math.floor(gap / 2);
  const right = gap - left;
  return `${' '.repeat(left)}${input}${' '.repeat(right)}`;
}

function rule(width = terminalWidth() - 2) {
  return glyphs.horizontal.repeat(Math.max(width, 0));
}

function trimLine(input: string, width: number) {
  if (visibleLength(input) <= width) {
    return input;
  }
  const plain = input.replace(/\x1b\[[0-9;]*m/g, '');
  return `${plain.slice(0, Math.max(width - 1, 0))}${glyphs.pointer}`;
}

function panel(lines: string[], tone: TerminalState = 'idle') {
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

function divider(label?: string) {
  const width = terminalWidth();
  if (!label) {
    console.log(color.panel(glyphs.dividerLeft + rule(width - 2) + glyphs.dividerRight));
    return;
  }
  const text = ` ${label} `;
  const fill = Math.max(width - visibleLength(text) - 2, 0);
  console.log(color.panel(glyphs.dividerLeft + text + glyphs.horizontal.repeat(fill) + glyphs.dividerRight));
}

function statusBadge(state: TerminalState) {
  const labels: Record<TerminalState, string> = {
    idle: 'IDLE',
    running: 'RUNNING',
    success: 'READY',
    error: 'ERROR',
    warning: 'NOTICE'
  };
  const stylers: Record<TerminalState, (value: string) => string> = {
    idle: color.cyan,
    running: color.yellow,
    success: color.green,
    error: color.red,
    warning: color.yellow
  };
  return stylers[state](`${glyphs.dot} ${labels[state]}`);
}

function keyBadge(key: string) {
  return color.bgKey(`[ ${key.trim().padStart(1)} ]`);
}

function renderHeader(state: TerminalState, detail = 'Press a command key to run a check. Press q to quit.') {
  console.log('');
  const title = `${color.bold('SystemInspector')} ${color.dim(`Interactive Terminal v${lib_version}`)}`;
  const status = statusBadge(state);
  const width = terminalWidth();
  const innerWidth = width - 2;
  panel([
    `${title}${' '.repeat(Math.max(innerWidth - visibleLength(title) - visibleLength(status) - 2, 1))}${status}`,
    color.muted(detail)
  ], state);
}

function renderCommandItem([key, label]: MenuItem, width: number) {
  const item = `${keyBadge(key)} ${label}`;
  return padVisible(item, width);
}

function renderCommandPalette() {
  console.log('');
  divider('Command Palette');
  const width = terminalWidth();
  const innerWidth = width - 4;
  const columns = width >= 110 ? 3 : 2;
  const cellWidth = Math.floor(innerWidth / columns);

  for (const group of menuGroups) {
    console.log(`  ${color.cyan(color.bold(group.title))}`);
    for (let index = 0; index < group.items.length; index += columns) {
      const row = group.items
        .slice(index, index + columns)
        .map((item) => renderCommandItem(item, cellWidth))
        .join('');
      console.log(`  ${row}`);
    }
    console.log('');
  }
  console.log(`  ${color.muted(`${glyphs.bullet} Commands run one at a time. Results stay in scrollback for review.`)}`);
  divider();
}

function renderEmptyState() {
  console.log('');
  panel([
    `${color.bold('No command has run yet.')}`,
    `${color.muted('Choose a key from the palette above to inspect this machine.')}`,
    `${color.muted('Try')} ${keyBadge('t')} ${color.muted('for time,')} ${keyBadge('m')} ${color.muted('for memory, or')} ${keyBadge('5')} ${color.muted('for network connections.')}`,
    `${color.muted('Use')} ${keyBadge('?')} ${color.muted('for a custom object, and')} ${keyBadge('q')} ${color.muted('to quit.')}`
  ]);
}

function enableUserInput() {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
}

function clearline() {
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(' '.repeat(terminalWidth()));
  readline.cursorTo(process.stdout, 0);
}

function startRunningIndicator(command: { key: string; label: string }) {
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

function stopRunningIndicator() {
  clearInterval(timer);
}

function startRun(command: { key: string; label: string }) {
  waiting = true;
  activeCommand = command;
  runStartedAt = Date.now();
  startRunningIndicator(command);
}

function finishRun() {
  waiting = false;
  stopRunningIndicator();
  clearline();
}

function durationMs() {
  return Date.now() - runStartedAt;
}

function renderDuration(duration: number) {
  return `${color.muted('Time to complete')} ${color.green(`${duration}ms`)}`;
}

function renderState(title: string, lines: string[], tone: TerminalState, duration?: number) {
  const footer = typeof duration === 'number' ? [renderDuration(duration)] : [];
  console.log('');
  panel([color.bold(title), ...lines.map((line) => color.muted(line)), ...footer], tone);
}

function renderOutputBlock(output: string) {
  const width = terminalWidth();
  console.log(color.panel(glyphs.topLeft + rule(width - 2) + glyphs.topRight));
  for (const line of output.split(/\r?\n/)) {
    console.log(`${color.panel(glyphs.vertical)} ${line}`);
  }
  console.log(color.panel(glyphs.bottomLeft + rule(width - 2) + glyphs.bottomRight));
}

function renderResult(title: string, command: { key: string; label: string }, output: unknown, duration: number) {
  console.log('');
  panel([
    `${color.bold(title)} ${color.dim(`v${lib_version}`)}${' '.repeat(2)}${statusBadge('success')}`,
    `${color.muted('Command')} ${keyBadge(command.key)} ${command.label}   ${renderDuration(duration)}`
  ], 'success');
  renderOutputBlock(util.inspect(output, { colors: colorEnabled, depth: 4 }));
  renderCommandPalette();
}

function renderStartup() {
  renderHeader('idle');
  renderCommandPalette();
  renderEmptyState();
}

process.stdin.on('keypress', (key, data) => {
  if (data.name === 'q' && !data.shift) {
    // shut down
    process.exit();
  }

  if (!waiting) {
    const displayKey = key === '?' ? '?' : String(key || '');
    const commandKey = key === '?' ? 'getObj' : displayKey;
    const command = {
      key: displayKey,
      label: commandLookup.get(commandKey) || 'Unknown command'
    };
    startRun(command);
    const siPath = path.join(__dirname, 'si.ts');
    const tsxPath = path.join(__dirname, '..', 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
    const sanitizedKey = utils.sanitizeShellString(commandKey);
    execFile(tsxPath, [siPath, sanitizedKey], { timeout: 30000 }, (error: any, stdout: any, stderr: any) => {
      const duration = durationMs();
      finishRun();
      if (error && error.signal) {
        renderState('Command timed out', [`Key: ${sanitizedKey}`, 'The check exceeded the 30 second timeout.'], 'error', duration);
      } else if (error) {
        renderState('Command failed', [`Key: ${sanitizedKey}`, error.message || 'The command exited with an error.'], 'error', duration);
        if (stderr) {
          renderOutputBlock(stderr.toString());
        }
      } else {
        try {
          if (stdout.toString().startsWith('"no_key')) {
            renderState('Menu item not found', ['Select a valid menu key, or press q to quit.'], 'warning', duration);
          } else if (stdout.toString().startsWith('"not_supported')) {
            renderState('Not supported', [`Key: ${sanitizedKey}`, 'This check is not supported on the current platform.'], 'warning', duration);
          } else if (stdout.toString()) {
            data = JSON.parse(stdout.toString());
            renderResult(data.title, command, data.data, duration);
          } else {
            renderState('No output captured', [`Key: ${sanitizedKey}`, 'The command completed without terminal output.'], 'warning', duration);
          }
        } catch (e) {
          renderState('Command output error', [`Key: ${sanitizedKey}`, 'Raw output follows.'], 'error', duration);
          renderOutputBlock(stdout.toString());
        }
      }
    });
  }
});

renderStartup();
enableUserInput();
