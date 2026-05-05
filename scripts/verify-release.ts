import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

type Check = {
  name: string;
  detail?: string;
  run: () => void;
};

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

const verbose = process.argv.includes('--verbose');
const lineWidth = 76;
const packageState: { tarball?: string; installDir?: string; packDir?: string } = {};
const requiredExports = [
  'system',
  'bios',
  'baseboard',
  'chassis',
  'osInfo',
  'versions',
  'shell',
  'uuid',
  'cpu',
  'cpuFlags',
  'cpuCache',
  'cpuCurrentSpeed',
  'cpuTemperature',
  'currentLoad',
  'mem',
  'memLayout',
  'battery',
  'graphics',
  'fsSize',
  'blockDevices',
  'fsStats',
  'disksIO',
  'diskLayout',
  'networkInterfaces',
  'networkStats',
  'networkConnections',
  'wifiNetworks',
  'wifiInterfaces',
  'wifiConnections',
  'processes',
  'processLoad',
  'services',
  'users',
  'inetChecksite',
  'inetLatency',
  'dockerInfo',
  'dockerImages',
  'dockerContainers',
  'dockerContainerStats',
  'dockerContainerProcesses',
  'dockerVolumes',
  'dockerAll',
  'vboxInfo',
  'printer',
  'usb',
  'audio',
  'bluetoothDevices',
  'capabilities',
  'capability',
  'schemaVersion',
  'getSchema',
  'onDiagnostic',
  'getStaticData',
  'getDynamicData',
  'getAllData',
  'get',
  'observe',
  'watch'
] as const;

function supportsUnicode(): boolean {
  if (process.env.SYSTEMINSPECTOR_ASCII === '1' || process.env.NO_COLOR === '1') {
    return false;
  }
  return process.platform !== 'win32' || Boolean(process.env.WT_SESSION || process.env.TERM_PROGRAM || process.env.ConEmuANSI);
}

const rule = supportsUnicode() ? '─' : '-';

function section(title: string): void {
  console.log(`\n${title}`);
  console.log(rule.repeat(lineWidth));
}

function row(label: string, value: string): string {
  return `${label.padEnd(18)} ${value}`;
}

function runCommand(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): CommandResult {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    encoding: 'utf8',
    shell: false
  });

  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || ''
  };
}

function commandText(command: string, args: string[]): string {
  return [command, ...args].join(' ');
}

function assertCommand(command: string, args: string[], suggestedNextStep: string, options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): CommandResult {
  const result = runCommand(command, args, options);
  if (result.status !== 0) {
    throw new VerificationError(commandText(command, args), result.status, result.stdout, result.stderr, suggestedNextStep);
  }
  if (verbose && (result.stdout || result.stderr)) {
    const stdout = result.stdout.trim();
    const stderr = result.stderr.trim();
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  }
  return result;
}

function lastRelevantOutput(stdout: string, stderr: string): string {
  const combined = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  return combined.slice(-20).join('\n') || 'No output captured.';
}

class VerificationError extends Error {
  constructor(
    public readonly command: string,
    public readonly exitCode: number | null,
    public readonly stdout: string,
    public readonly stderr: string,
    public readonly suggestedNextStep: string
  ) {
    super(`Command failed: ${command}`);
  }
}

async function withTimeout<T>(label: string, task: Promise<T>, timeoutMs = 120000): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function shape(input: unknown): string {
  if (Array.isArray(input)) {
    return 'array';
  }
  if (input === null) {
    return 'null';
  }
  return typeof input;
}

async function callbackResult(fn: (callback?: (data: unknown) => void) => Promise<unknown>): Promise<unknown> {
  return await withTimeout(
    'callback check',
    new Promise((resolve, reject) => {
      try {
        fn((data) => resolve(data)).catch(reject);
      } catch (error) {
        reject(error);
      }
    })
  );
}

async function checkCallbackPromiseParity(): Promise<string> {
  const si = requireDist();
  const apiNames = ['cpu', 'mem', 'osInfo', 'fsSize', 'networkInterfaces', 'processes', 'graphics', 'diskLayout', 'dockerAll'] as const;

  for (const apiName of apiNames) {
    const fn = si[apiName];
    const promiseData = await withTimeout(apiName, fn());
    const callbackData = await callbackResult(fn);
    if (shape(promiseData) !== shape(callbackData)) {
      throw new Error(`${apiName} returned ${shape(promiseData)} with Promise and ${shape(callbackData)} with callback`);
    }
  }

  const getValue = { cpu: 'manufacturer' };
  const promiseGet = await withTimeout('get', si.get(getValue));
  const callbackGet = await withTimeout(
    'get callback',
    new Promise((resolve, reject) => {
      try {
        si.get(getValue, (data: unknown) => resolve(data)).catch(reject);
      } catch (error) {
        reject(error);
      }
    })
  );
  if (shape(promiseGet) !== shape(callbackGet)) {
    throw new Error(`get returned ${shape(promiseGet)} with Promise and ${shape(callbackGet)} with callback`);
  }

  const handle = si.observe({ cpu: 'manufacturer' }, 1000, () => undefined);
  if (!handle || typeof handle !== 'object') {
    throw new Error('observe did not return an interval handle');
  }
  clearInterval(handle);

  return '11/11 checks passed';
}

function requireDist(): Record<string, any> {
  const requireFromRoot = createRequire(resolve('package.json'));
  return requireFromRoot('./dist');
}

function checkPublicExports(): string {
  const si = requireDist();
  const missing = requiredExports.filter((exportName) => typeof si[exportName] === 'undefined');
  if (missing.length) {
    throw new Error(`Missing: ${missing.join(', ')}`);
  }
  return `${requiredExports.length}/${requiredExports.length} exports available`;
}

function checkCliOutputQuality(): string {
  const result = assertCommand('node', ['dist/cli.js', 'info'], 'Fix the CLI report output and rerun `npm run verify:release`.');
  const output = `${result.stdout}\n${result.stderr}`;
  for (const expected of ['SystemInspector', 'Operating System', 'CPU']) {
    if (!output.includes(expected)) {
      throw new Error(`CLI output is missing ${expected}`);
    }
  }
  const malformed = ['undefined', 'null', '[object Object]', 'TypeError:', 'ReferenceError:', 'SyntaxError:', 'NaN'];
  const found = malformed.find((token) => output.includes(token));
  if (found) {
    throw new Error(`CLI output contains malformed token: ${found}`);
  }
  return 'No malformed terminal output detected';
}

function createPackage(): string {
  const packDir = mkdtempSync(join(tmpdir(), 'systeminspector-pack-'));
  packageState.packDir = packDir;
  const pack = assertCommand('npm', ['pack', '--pack-destination', packDir], 'Fix package creation and rerun `npm run verify:release`.', { env: { npm_config_loglevel: 'error' } });
  const tarball = pack.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);

  const tarballPath = tarball ? join(packDir, tarball) : '';

  if (!tarball || !tarball.endsWith('.tgz') || !existsSync(tarballPath)) {
    throw new Error('Package tarball was not created.');
  }

  packageState.tarball = tarballPath;
  return tarball;
}

function installPackage(): string {
  if (!packageState.tarball) {
    throw new Error('Package tarball is not available.');
  }
  const installDir = mkdtempSync(join(tmpdir(), 'systeminspector-release-'));
  packageState.installDir = installDir;
  assertCommand('npm', ['init', '-y'], 'Verify npm can initialize the isolated package test directory.', { cwd: installDir, env: { npm_config_loglevel: 'error' } });
  assertCommand(
    'npm',
    ['install', '--ignore-scripts', '--no-audit', '--no-fund', resolve(packageState.tarball)],
    'Fix package installation and rerun `npm run verify:release`.',
    { cwd: installDir, env: { npm_config_loglevel: 'error' } }
  );
  return 'Installed in isolated project';
}

function checkInstalledRequire(): string {
  if (!packageState.installDir) {
    throw new Error('Isolated install directory is not available.');
  }
  assertCommand(
    'node',
    ['-e', "const si = require('@ambicuity/systeminspector'); if (typeof si.cpu !== 'function') process.exit(1);"],
    'Fix CommonJS package exports and rerun `npm run verify:release`.',
    { cwd: packageState.installDir }
  );
  return 'require("@ambicuity/systeminspector") exposes API';
}

function checkInstalledCli(): string {
  if (!packageState.installDir) {
    throw new Error('Isolated install directory is not available.');
  }
  assertCommand('npx', ['--no-install', 'systeminspector', 'info'], 'Fix installed CLI behavior and rerun `npm run verify:release`.', { cwd: packageState.installDir });
  return 'npx --no-install systeminspector info exits 0';
}

function cleanupPackageState(): void {
  if (packageState.installDir) {
    rmSync(packageState.installDir, { force: true, recursive: true });
    packageState.installDir = undefined;
  }
  if (packageState.packDir) {
    rmSync(packageState.packDir, { force: true, recursive: true });
    packageState.packDir = undefined;
    packageState.tarball = undefined;
  }
}

async function main(): Promise<void> {
  console.log('SystemInspector Release Verification');

  section('Environment');
  console.log(row('Node.js', process.version));
  console.log(row('npm', assertCommand('npm', ['--version'], 'Install npm and rerun `npm run verify:release`.').stdout.trim()));
  console.log(row('Platform', `${process.platform} ${process.arch}`));

  const checks: Check[] = [
    {
      name: 'Dependency install',
      run: () => {
        if (!existsSync('node_modules') || !existsSync('package-lock.json')) {
          throw new Error('node_modules or package-lock.json was not found.');
        }
      },
      detail: 'node_modules available'
    },
    {
      name: 'Typecheck',
      run: () => assertCommand('npm', ['run', 'typecheck'], 'Fix the reported TypeScript error and rerun `npm run typecheck`.')
    },
    {
      name: 'Build',
      run: () => assertCommand('npm', ['run', 'build'], 'Fix the build error and rerun `npm run build`.')
    },
    {
      name: 'CLI executable',
      run: () => {
        if (!existsSync('dist/cli.js')) {
          throw new Error('dist/cli.js was not found.');
        }
        assertCommand('node', ['dist/cli.js', '--help'], 'Rebuild the CLI and rerun `npm run verify:release`.');
      }
    },
    {
      name: 'CLI output quality',
      run: () => {
        checks.find((check) => check.name === 'CLI output quality')!.detail = checkCliOutputQuality();
      }
    },
    {
      name: 'Public exports',
      run: () => {
        checks.find((check) => check.name === 'Public exports')!.detail = checkPublicExports();
      }
    },
    {
      name: 'CommonJS require',
      run: () => {
        const si = requireDist();
        if (typeof si.cpu !== 'function') {
          throw new Error('CommonJS require did not expose cpu().');
        }
      },
      detail: 'require("./dist") exposes API'
    },
    {
      name: 'Callback + Promise',
      run: () => {
        throw new Error('Callback + Promise must run asynchronously.');
      }
    },
    {
      name: 'Package dry-run',
      run: () => assertCommand('npm', ['pack', '--dry-run'], 'Fix package contents and rerun `npm pack --dry-run`.', { env: { npm_config_loglevel: 'error' } })
    },
    {
      name: 'Package creation',
      run: () => {
        checks.find((check) => check.name === 'Package creation')!.detail = createPackage();
      }
    },
    {
      name: 'Package install',
      run: () => {
        checks.find((check) => check.name === 'Package install')!.detail = installPackage();
      }
    },
    {
      name: 'Installed require',
      run: () => {
        checks.find((check) => check.name === 'Installed require')!.detail = checkInstalledRequire();
      }
    },
    {
      name: 'Installed CLI',
      run: () => {
        checks.find((check) => check.name === 'Installed CLI')!.detail = checkInstalledCli();
      }
    }
  ];

  section('Checks');
  for (const check of checks) {
    try {
      if (check.name === 'Callback + Promise') {
        check.detail = await checkCallbackPromiseParity();
      } else {
        check.run();
      }
      console.log(`PASS  ${check.name.padEnd(22)} ${check.detail || 'OK'}`);
    } catch (error) {
      console.log(`FAIL  ${check.name.padEnd(22)} ${error instanceof Error ? error.message : String(error)}`);
      section('Result');
      console.log(row('Status', 'FAIL'));
      console.log(row('Step', check.name));

      if (error instanceof VerificationError) {
        console.log(row('Command', error.command));
        console.log(row('Exit code', String(error.exitCode)));
        console.log('\nError:');
        console.log(lastRelevantOutput(error.stdout, error.stderr));
        console.log('\nSuggested next step:');
        console.log(error.suggestedNextStep);
      } else {
        console.log('\nError:');
        console.log(error instanceof Error ? error.message : String(error));
        console.log('\nSuggested next step:');
        console.log(`Fix the ${check.name} failure and rerun \`npm run verify:release\`.`);
      }

      process.exitCode = 1;
      cleanupPackageState();
      return;
    }
  }

  cleanupPackageState();
  section('Result');
  console.log(row('Status', 'PASS'));
  console.log(row('Summary', 'All release checks completed successfully.'));
}

main().catch((error) => {
  cleanupPackageState();
  section('Result');
  console.log(row('Status', 'FAIL'));
  console.log('\nError:');
  console.log(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
