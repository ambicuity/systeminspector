// ==================================================================================
// util.ts
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 0. helper functions
// ----------------------------------------------------------------------------------

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, exec, execSync, type ExecSyncOptions, type SpawnOptions } from 'child_process';
import type { ChildProcess } from 'child_process';

const _platform = process.platform;
const _linux = _platform === 'linux' || _platform === 'android';
const _darwin = _platform === 'darwin';
const _windows = _platform === 'win32';
const _freebsd = _platform === 'freebsd';
const _openbsd = _platform === 'openbsd';
const _netbsd = _platform === 'netbsd';

let _cores = 0;
let codepage = '';
let _smartMonToolsInstalled: boolean | null = null;
let _smartMonToolsInfo: any = null;
let _rpi_cpuinfo: string[] | null = null;
const _diagnostics: any[] = [];

const WINDIR = process.env.WINDIR || 'C:\\Windows';

// powerShell
let _psChild: ChildProcess | null = null;
let _psResult = '';
const _psCmds: Array<{ id: string; cmd: string; callback: (data: string) => void; start: Date }> = [];
let _psPersistent = false;
let _powerShell = '';
let _powerShellVersion = '';
const _psToUTF8 = '$OutputEncoding = [System.Console]::OutputEncoding = [System.Console]::InputEncoding = [System.Text.Encoding]::UTF8 ; ';
const _psCmdStart = '--###START###--';
const _psError = '--ERROR--';
const _psCmdSeperator = '--###ENDCMD###--';
const _psIdSeperator = '--##ID##--';

const DEFAULT_COMMAND_TIMEOUT = 0;

const execOptsWin: ExecSyncOptions = {
  windowsHide: true,
  maxBuffer: 1024 * 102400,
  encoding: 'utf8' as const,
  env: Object.assign({}, process.env, { LANG: 'en_US.UTF-8' })
};

const execOptsLinux: ExecSyncOptions = {
  maxBuffer: 1024 * 102400,
  encoding: 'utf8' as const,
  stdio: ['pipe', 'pipe', 'ignore']
};

function toInt(value: any) {
  let result = parseInt(value, 10);
  if (isNaN(result)) {
    result = 0;
  }
  return result;
}

function splitByNumber(str: any) {
  let numberStarted = false;
  let num = '';
  let cpart = '';
  for (const c of str) {
    if ((c >= '0' && c <= '9') || numberStarted) {
      numberStarted = true;
      num += c;
    } else {
      cpart += c;
    }
  }
  return [cpart, num];
}

const stringObj = new String();
const stringReplace = new String().replace;
const stringToLower = new String().toLowerCase;
const stringToString = new String().toString;
const stringSubstr = new String().substr;
const stringSubstring = new String().substring;
const stringTrim = new String().trim;
const stringStartWith = new String().startsWith;
const mathMin = Math.min;

function isFunction(functionToCheck: any) {
  let getType: Record<string, any> = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function unique(obj: any) {
  const uniques: any[] = [];
  const stringify: Record<string, any> = {};
  for (let i = 0; i < obj.length; i++) {
    let keys = Object.keys(obj[i]);
    keys.sort((a, b) => {
      return a.localeCompare(b);
    });
    let str = '';
    for (let j = 0; j < keys.length; j++) {
      str += JSON.stringify(keys[j]);
      str += JSON.stringify(obj[i][keys[j]]);
    }
    if (!{}.hasOwnProperty.call(stringify, str)) {
      uniques.push(obj[i]);
      stringify[str] = true;
    }
  }
  return uniques;
}

function sortByKey(array: any, keys: any) {
  return array.sort((a: any, b: any) => {
    let x = '';
    let y = '';
    keys.forEach((key: any) => {
      x = x + a[key];
      y = y + b[key];
    });
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

function cores() {
  if (_cores === 0) {
    _cores = os.cpus().length;
  }
  return _cores;
}

function getValue(lines: string[], property: string, separator?: string, trimmed?: boolean, lineMatch?: boolean): string {
  separator = separator || ':';
  property = property.toLowerCase();
  trimmed = trimmed || false;
  lineMatch = lineMatch || false;
  let result = '';
  lines.some((line) => {
    let lineLower = line.toLowerCase().replace(/\t/g, '');
    if (trimmed) {
      lineLower = lineLower.trim();
    }
    if (lineLower.startsWith(property) && (lineMatch ? lineLower.match(property + separator) || lineLower.match(property + ' ' + separator) : true)) {
      const parts = trimmed ? line.trim().split(separator) : line.split(separator);
      if (parts.length >= 2) {
        parts.shift();
        result = parts.join(separator).trim();
        return true;
      }
    }
    return false;
  });
  return result;
}

function decodeEscapeSequence(str: any, base: any) {
  base = base || 16;
  return str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
    return String.fromCharCode(parseInt(arguments[1], base));
  });
}

function detectSplit(str: any) {
  let seperator = '';
  let part = 0;
  str.split('').forEach((element: any) => {
    if (element >= '0' && element <= '9') {
      if (part === 1) {
        part++;
      }
    } else {
      if (part === 0) {
        part++;
      }
      if (part === 1) {
        seperator += element;
      }
    }
  });
  return seperator;
}

function parseTime(t: any, pmDesignator: any) {
  pmDesignator = pmDesignator || '';
  t = t.toUpperCase();
  let hour = 0;
  let min = 0;
  const splitter = detectSplit(t);
  const parts = t.split(splitter);
  if (parts.length >= 2) {
    if (parts[2]) {
      parts[1] += parts[2];
    }
    let isPM =
      (parts[1] && parts[1].toLowerCase().indexOf('pm') > -1) ||
      parts[1].toLowerCase().indexOf('p.m.') > -1 ||
      parts[1].toLowerCase().indexOf('p. m.') > -1 ||
      parts[1].toLowerCase().indexOf('n') > -1 ||
      parts[1].toLowerCase().indexOf('ch') > -1 ||
      parts[1].toLowerCase().indexOf('ös') > -1 ||
      (pmDesignator && parts[1].toLowerCase().indexOf(pmDesignator) > -1);
    hour = parseInt(parts[0], 10);
    min = parseInt(parts[1], 10);
    hour = isPM && hour < 12 ? hour + 12 : hour;
    return ('0' + hour).substr(-2) + ':' + ('0' + min).substr(-2);
  }
  return '';
}

function parseDateTime(dt: string, culture?: any): { date: string; time: string } {
  const result = {
    date: '',
    time: ''
  };
  culture = culture || {};
  const dateFormat = (culture.dateFormat || '').toLowerCase();
  const pmDesignator = culture.pmDesignator || '';

  const parts = dt.split(' ');
  if (parts[0]) {
    if (parts[0].indexOf('/') >= 0) {
      // Dateformat: mm/dd/yyyy or dd/mm/yyyy or dd/mm/yy or yyyy/mm/dd
      const dtparts = parts[0].split('/');
      if (dtparts.length === 3) {
        if (dtparts[0].length === 4) {
          // Dateformat: yyyy/mm/dd
          result.date = dtparts[0] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[2]).substr(-2);
        } else if (dtparts[2].length === 2) {
          if (dateFormat.indexOf('/d/') > -1 || dateFormat.indexOf('/dd/') > -1) {
            // Dateformat: mm/dd/yy
            result.date = '20' + dtparts[2] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[0]).substr(-2);
          } else {
            // Dateformat: dd/mm/yy
            result.date = '20' + dtparts[2] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[0]).substr(-2);
          }
        } else {
          // Dateformat: mm/dd/yyyy or dd/mm/yyyy
          const isEN =
            dt.toLowerCase().indexOf('pm') > -1 ||
            dt.toLowerCase().indexOf('p.m.') > -1 ||
            dt.toLowerCase().indexOf('p. m.') > -1 ||
            dt.toLowerCase().indexOf('am') > -1 ||
            dt.toLowerCase().indexOf('a.m.') > -1 ||
            dt.toLowerCase().indexOf('a. m.') > -1;
          if ((isEN || dateFormat.indexOf('/d/') > -1 || dateFormat.indexOf('/dd/') > -1) && dateFormat.indexOf('dd/') !== 0) {
            // Dateformat: mm/dd/yyyy
            result.date = dtparts[2] + '-' + ('0' + dtparts[0]).substr(-2) + '-' + ('0' + dtparts[1]).substr(-2);
          } else {
            // Dateformat: dd/mm/yyyy
            result.date = dtparts[2] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[0]).substr(-2);
          }
        }
      }
    }
    if (parts[0].indexOf('.') >= 0) {
      const dtparts = parts[0].split('.');
      if (dtparts.length === 3) {
        if (dateFormat.indexOf('.d.') > -1 || dateFormat.indexOf('.dd.') > -1) {
          // Dateformat: mm.dd.yyyy
          result.date = dtparts[2] + '-' + ('0' + dtparts[0]).substr(-2) + '-' + ('0' + dtparts[1]).substr(-2);
        } else {
          // Dateformat: dd.mm.yyyy
          result.date = dtparts[2] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[0]).substr(-2);
        }
      }
    }
    if (parts[0].indexOf('-') >= 0) {
      // Dateformat: yyyy-mm-dd
      const dtparts = parts[0].split('-');
      if (dtparts.length === 3) {
        result.date = dtparts[0] + '-' + ('0' + dtparts[1]).substr(-2) + '-' + ('0' + dtparts[2]).substr(-2);
      }
    }
  }
  if (parts[1]) {
    parts.shift();
    const time = parts.join(' ');
    result.time = parseTime(time, pmDesignator);
  }
  return result;
}

function parseHead(head: string, rights: number): Array<{ from: number; to: number; cap: string }> {
  let space = rights > 0;
  let count = 1;
  let from = 0;
  let to = 0;
  const result: any[] = [];
  for (let i = 0; i < head.length; i++) {
    if (count <= rights) {
      if (/\s/.test(head[i]) && !space) {
        to = i - 1;
        result.push({
          from: from,
          to: to + 1,
          cap: head.substring(from, to + 1)
        });
        from = to + 2;
        count++;
      }
      space = head[i] === ' ';
    } else {
      if (!/\s/.test(head[i]) && space) {
        to = i - 1;
        if (from < to) {
          result.push({
            from: from,
            to: to,
            cap: head.substring(from, to)
          });
        }
        from = to + 1;
        count++;
      }
      space = head[i] === ' ';
    }
  }
  to = 5000;
  result.push({
    from: from,
    to: to,
    cap: head.substring(from, to)
  });
  let len = result.length;
  for (let i = 0; i < len; i++) {
    if (result[i].cap.replace(/\s/g, '').length === 0) {
      if (i + 1 < len) {
        result[i].to = result[i + 1].to;
        result[i].cap = result[i].cap + result[i + 1].cap;
        result.splice(i + 1, 1);
        len = len - 1;
      }
    }
  }
  return result;
}

function findObjectByKey(array: any, key: any, value: any) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      return i;
    }
  }
  return -1;
}

function getPowershell() {
  _powerShell = 'powershell.exe';
  if (_windows) {
    const defaultPath = `${WINDIR}\\system32\\WindowsPowerShell\\v1.0\\powershell.exe`;
    if (fs.existsSync(defaultPath)) {
      _powerShell = defaultPath;
    }
    try {
      const stdout = execSync(`"${_powerShell}" -NoProfile -NoLogo -Command "$PSVersionTable.PSVersion.ToString()"`, execOptsWin).toString();
      _powerShellVersion = stdout.trim().split(/\r?\n/)[0] || '';
      const major = parseInt(_powerShellVersion.split('.')[0], 10) || 0;
      if (major > 0 && major < 5) {
        pushDiagnostic({
          feature: 'powershell',
          dependency: 'PowerShell',
          issue: 'version_unsupported',
          message: `PowerShell ${_powerShellVersion} is installed; PowerShell 5 or newer is recommended`,
          recommendedFix: 'Install or upgrade to Windows PowerShell 5.1 or PowerShell 7+'
        });
      }
    } catch (e) {
      pushDiagnostic({
        feature: 'powershell',
        dependency: 'PowerShell',
        issue: classifyCommandIssue('', e),
        message: e instanceof Error ? e.message : 'Unable to determine PowerShell version',
        recommendedFix: 'Install or repair Windows PowerShell 5.1 or PowerShell 7+'
      });
    }
  }
}

function getPowershellVersion() {
  return _powerShellVersion;
}

function pushDiagnostic(diagnostic: any) {
  _diagnostics.push({
    platform: _platform,
    timestamp: Date.now(),
    ...diagnostic
  });
  if (_diagnostics.length > 200) {
    _diagnostics.shift();
  }
}

function diagnostics() {
  return _diagnostics.slice();
}

function clearDiagnostics() {
  _diagnostics.length = 0;
}

function classifyCommandIssue(stderr: string, error?: any) {
  const text = `${stderr || ''}\n${error && error.message ? error.message : ''}`.toLowerCase();
  if (text.indexOf('access is denied') >= 0 || text.indexOf('permission denied') >= 0 || text.indexOf('operation not permitted') >= 0 || text.indexOf('not root') >= 0) {
    return 'insufficient_privileges';
  }
  if (text.indexOf('command not found') >= 0 || text.indexOf('not recognized') >= 0 || text.indexOf('no such file') >= 0) {
    return 'missing_tool';
  }
  if (text.indexOf('invalid byte') >= 0 || text.indexOf('encoding') >= 0) {
    return 'encoding_error';
  }
  return 'command_error';
}

function getVboxmanage() {
  return _windows ? `"${process.env.VBOX_INSTALL_PATH || process.env.VBOX_MSI_INSTALL_PATH}\\VBoxManage.exe"` : 'vboxmanage';
}

function powerShellProceedResults(data: any) {
  let id = '';
  let parts;
  let res = '';
  // startID
  if (data.indexOf(_psCmdStart) >= 0) {
    parts = data.split(_psCmdStart);
    const parts2 = parts[1].split(_psIdSeperator);
    id = parts2[0];
    if (parts2.length > 1) {
      data = parts2.slice(1).join(_psIdSeperator);
    }
  }
  // result;
  if (data.indexOf(_psCmdSeperator) >= 0) {
    parts = data.split(_psCmdSeperator);
    res = parts[0];
  }
  let remove = -1;
  for (let i = 0; i < _psCmds.length; i++) {
    if (_psCmds[i].id === id) {
      remove = i;
      _psCmds[i].callback(res);
    }
  }
  if (remove >= 0) {
    _psCmds.splice(remove, 1);
  }
}

function powerShellStart() {
  if (!_psChild) {
    _psChild = spawn(_powerShell, ['-NoProfile', '-NoLogo', '-InputFormat', 'Text', '-NoExit', '-Command', '-'], {
      stdio: 'pipe',
      windowsHide: true,
      env: Object.assign({}, process.env, { LANG: 'en_US.UTF-8' })
    } as SpawnOptions);
    if (_psChild && _psChild.pid) {
      _psPersistent = true;
      _psChild.stdout!.on('data', (data) => {
        _psResult = _psResult + data.toString('utf8');
        if (data.indexOf(_psCmdSeperator) >= 0) {
          powerShellProceedResults(_psResult);
          _psResult = '';
        }
      });
      _psChild.stderr!.on('data', () => {
        powerShellProceedResults(_psResult + _psError);
      });
      _psChild.on('error', () => {
        powerShellProceedResults(_psResult + _psError);
      });
      _psChild.on('close', () => {
        if (_psChild) {
          _psChild.kill();
        }
      });
    }
  }
}

function powerShellRelease() {
  try {
    if (_psChild) {
      _psChild.stdin!.write('exit' + os.EOL);
      _psChild.stdin!.end();
    }
  } catch {
    if (_psChild) {
      _psChild.kill();
    }
  }
  _psPersistent = false;
  _psChild = null;
}

function powerShell(cmd: string, options?: { timeout?: number; feature?: string }): Promise<any> {
  options = options || {};
  const timeout = options.timeout || DEFAULT_COMMAND_TIMEOUT;
  if (_psPersistent) {
    const id = Math.random().toString(36).substring(2, 12);
    return new Promise((resolve) => {
      process.nextTick(() => {
        let settled = false;
        const finish = (value: string, diagnostic?: any) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timer) {
            clearTimeout(timer);
          }
          const remove = _psCmds.findIndex((item) => item.id === id);
          if (remove >= 0) {
            _psCmds.splice(remove, 1);
          }
          if (diagnostic) {
            pushDiagnostic(diagnostic);
          }
          resolve(value);
        };
        function callback(data: any) {
          finish(data);
        }
        const timer =
          timeout > 0
            ? setTimeout(() => {
                finish('', {
                  feature: options!.feature || 'powershell',
                  command: cmd,
                  issue: 'command_timeout',
                  message: `PowerShell command timed out after ${timeout} ms`
                });
                resolve('');
              }, timeout)
            : null;
        _psCmds.push({
          id,
          cmd,
          callback,
          start: new Date()
        });
        try {
          if (_psChild && _psChild.pid) {
            _psChild.stdin!.write(_psToUTF8 + 'echo ' + _psCmdStart + id + _psIdSeperator + '; ' + os.EOL + cmd + os.EOL + 'echo ' + _psCmdSeperator + os.EOL);
          }
        } catch (e) {
          if (timer) {
            clearTimeout(timer);
          }
          finish('', {
            feature: options!.feature || 'powershell',
            command: cmd,
            issue: classifyCommandIssue('', e),
            message: e instanceof Error ? e.message : 'PowerShell command failed'
          });
        }
      });
    });
  } else {
    let result = '';

    return new Promise((resolve) => {
      process.nextTick(() => {
        try {
          const osVersion = os.release().split('.').map(Number);
          // windows 7 compatibility issue
          const spanOptions =
            osVersion[0] < 10
              ? ['-NoProfile', '-NoLogo', '-InputFormat', 'Text', '-NoExit', '-ExecutionPolicy', 'Unrestricted', '-Command', '-']
              : ['-NoProfile', '-NoLogo', '-InputFormat', 'Text', '-ExecutionPolicy', 'Unrestricted', '-Command', _psToUTF8 + cmd];
          const child = spawn(_powerShell, spanOptions, {
            stdio: 'pipe',
            windowsHide: true,
            env: Object.assign({}, process.env, { LANG: 'en_US.UTF-8' })
          } as SpawnOptions);
          let stderr = '';
          let settled = false;
          let timer: NodeJS.Timeout | null = null;
          const finish = (value: string, diagnostic?: any) => {
            if (settled) {
              return;
            }
            settled = true;
            if (timer) {
              clearTimeout(timer);
            }
            if (diagnostic) {
              pushDiagnostic(diagnostic);
            }
            resolve(value);
          };
          if (timeout > 0) {
            timer = setTimeout(() => {
              try {
                child.kill();
              } catch {
                noop();
              }
              finish(result, {
                feature: options!.feature || 'powershell',
                command: cmd,
                issue: 'command_timeout',
                message: `PowerShell command timed out after ${timeout} ms`,
                stderr
              });
            }, timeout);
          }

          if (child && !child.pid) {
            child.on('error', (e) => {
              finish(result, {
                feature: options!.feature || 'powershell',
                command: cmd,
                issue: classifyCommandIssue(stderr, e),
                message: e.message || 'PowerShell process failed',
                stderr
              });
            });
          }
          if (child && child.pid) {
            child.stdout!.on('data', (data) => {
              result = result + data.toString('utf8');
            });
            child.stderr!.on('data', (data) => {
              stderr += data.toString('utf8');
              child.kill();
              finish(result, {
                feature: options!.feature || 'powershell',
                command: cmd,
                issue: classifyCommandIssue(stderr),
                message: 'PowerShell command wrote to stderr',
                stderr
              });
            });
            child.on('close', () => {
              child.kill();
              finish(result);
            });
            child.on('error', (e) => {
              child.kill();
              finish(result, {
                feature: options!.feature || 'powershell',
                command: cmd,
                issue: classifyCommandIssue(stderr, e),
                message: e.message || 'PowerShell command failed',
                stderr
              });
            });
            if (osVersion[0] < 10) {
              try {
                child.stdin!.write(_psToUTF8 + cmd + os.EOL);
                child.stdin!.write('exit' + os.EOL);
                child.stdin!.end();
              } catch (e) {
                child.kill();
                finish(result, {
                  feature: options!.feature || 'powershell',
                  command: cmd,
                  issue: classifyCommandIssue(stderr, e),
                  message: e instanceof Error ? e.message : 'PowerShell command failed',
                  stderr
                });
              }
            }
          } else {
            finish(result, {
              feature: options!.feature || 'powershell',
              command: cmd,
              issue: 'missing_tool',
              message: 'PowerShell process could not be started'
            });
          }
        } catch (e) {
          pushDiagnostic({
            feature: options!.feature || 'powershell',
            command: cmd,
            issue: classifyCommandIssue('', e),
            message: e instanceof Error ? e.message : 'PowerShell command failed'
          });
          resolve(result);
        }
      });
    });
  }
}

function execSafe(cmd: string, args?: string[], options?: any): Promise<string> {
  let result = '';
  options = options || {};
  const timeout = options.timeout || DEFAULT_COMMAND_TIMEOUT;
  const feature = options.feature || cmd;

  return new Promise((resolve) => {
    process.nextTick(() => {
      try {
        const child = spawn(cmd, args, options);
        let settled = false;
        let stderr = '';
        let timer: NodeJS.Timeout | null = null;
        const finish = (value: string, diagnostic?: any) => {
          if (settled) {
            return;
          }
          settled = true;
          if (timer) {
            clearTimeout(timer);
          }
          if (diagnostic) {
            pushDiagnostic(diagnostic);
          }
          resolve(value);
        };
        if (timeout > 0) {
          timer = setTimeout(() => {
            try {
              child.kill();
            } catch {
              noop();
            }
            finish(result, {
              feature,
              command: [cmd].concat(args || []).join(' '),
              issue: 'command_timeout',
              message: `Command timed out after ${timeout} ms`,
              stderr
            });
          }, timeout);
        }

        if (child && !child.pid) {
          child.on('error', (e) => {
            finish(result, {
              feature,
              command: [cmd].concat(args || []).join(' '),
              issue: classifyCommandIssue(stderr, e),
              message: e.message || 'Command failed',
              stderr
            });
          });
        }
        if (child && child.pid) {
          child.stdout.on('data', (data) => {
            result += data.toString();
          });
          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          child.on('close', () => {
            child.kill();
            finish(result);
          });
          child.on('error', (e) => {
            child.kill();
            finish(result, {
              feature,
              command: [cmd].concat(args || []).join(' '),
              issue: classifyCommandIssue(stderr, e),
              message: e.message || 'Command failed',
              stderr
            });
          });
        } else {
          finish(result);
        }
      } catch (e) {
        pushDiagnostic({
          feature,
          command: [cmd].concat(args || []).join(' '),
          issue: classifyCommandIssue('', e),
          message: e instanceof Error ? e.message : 'Command failed'
        });
        resolve(result);
      }
    });
  });
}

function getCodepage() {
  if (_windows) {
    if (!codepage) {
      try {
        const stdout = execSync('chcp', execOptsWin);
        const lines = stdout.toString().split('\r\n');
        const parts = lines[0].split(':');
        codepage = parts.length > 1 ? parts[1].replace('.', '').trim() : '';
      } catch {
        codepage = '437';
      }
    }
    return codepage;
  }
  if (_linux || _darwin || _freebsd || _openbsd || _netbsd) {
    if (!codepage) {
      try {
        const stdout = execSync('echo $LANG', execOptsLinux);
        const lines = stdout.toString().split('\r\n');
        const parts = lines[0].split('.');
        codepage = parts.length > 1 ? parts[1].trim() : '';
        if (!codepage) {
          codepage = 'UTF-8';
        }
      } catch {
        codepage = 'UTF-8';
      }
    }
    return codepage;
  }
}

function smartMonToolsInstalled() {
  if (_smartMonToolsInstalled !== null) {
    return _smartMonToolsInstalled;
  }
  _smartMonToolsInstalled = false;
  if (_windows) {
    try {
      const pathArray = execSync('WHERE smartctl 2>nul', execOptsWin).toString().split('\r\n');
      if (pathArray && pathArray.length) {
        _smartMonToolsInstalled = pathArray[0].indexOf(':\\') >= 0;
      } else {
        _smartMonToolsInstalled = false;
      }
    } catch {
      _smartMonToolsInstalled = false;
    }
  }
  if (_linux || _darwin || _freebsd || _openbsd || _netbsd) {
    try {
      const pathArray = execSync('which smartctl 2>/dev/null', execOptsLinux).toString().split('\r\n');
      _smartMonToolsInstalled = pathArray.length > 0;
    } catch {
      noop();
    }
  }
  return _smartMonToolsInstalled;
}

function smartMonToolsInfo() {
  if (_smartMonToolsInfo !== null) {
    return _smartMonToolsInfo;
  }
  const result = {
    installed: smartMonToolsInstalled(),
    version: '',
    major: 0,
    fullSmartData: false
  };
  if (!result.installed) {
    pushDiagnostic({
      feature: 'smartctl',
      dependency: 'smartmontools',
      issue: 'missing_tool',
      message: 'smartctl was not found on PATH',
      recommendedFix: _windows ? 'Install smartmontools from https://www.smartmontools.org/' : _darwin ? 'Install with: brew install smartmontools' : 'Install smartmontools with your OS package manager'
    });
    _smartMonToolsInfo = result;
    return result;
  }
  try {
    const stdout = execSync('smartctl --version', _windows ? execOptsWin : execOptsLinux).toString();
    const match = stdout.match(/smartctl\s+([0-9]+(?:\.[0-9]+)?)/i);
    if (match) {
      result.version = match[1];
      result.major = parseInt(match[1].split('.')[0], 10) || 0;
      result.fullSmartData = result.major >= 7;
    }
    if (result.major > 0 && result.major < 7) {
      pushDiagnostic({
        feature: 'smartctl',
        dependency: 'smartmontools',
        issue: 'version_unsupported',
        message: `smartctl ${result.version} is installed; full JSON SMART data requires smartmontools >= 7.0`,
        recommendedFix: 'Upgrade smartmontools to version 7.0 or newer'
      });
    }
  } catch (e) {
    pushDiagnostic({
      feature: 'smartctl',
      dependency: 'smartmontools',
      issue: classifyCommandIssue('', e),
      message: e instanceof Error ? e.message : 'Unable to determine smartctl version'
    });
  }
  _smartMonToolsInfo = result;
  return result;
}

// reference values: https://elinux.org/RPi_HardwareHistory
// https://www.raspberrypi.org/documentation/hardware/raspberrypi/revision-codes/README.md
// https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#hardware-revision-codes

function isRaspberry(cpuinfo?: string[] | string): boolean {
  const PI_MODEL_NO = ['BCM2708', 'BCM2709', 'BCM2710', 'BCM2711', 'BCM2712', 'BCM2835', 'BCM2836', 'BCM2837', 'BCM2837B0'];
  if (_rpi_cpuinfo !== null && cpuinfo === undefined) {
    cpuinfo = _rpi_cpuinfo;
  } else if (cpuinfo === undefined) {
    try {
      cpuinfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
      _rpi_cpuinfo = cpuinfo;
    } catch {
      return false;
    }
  }
  const lines = Array.isArray(cpuinfo) ? cpuinfo : (cpuinfo as string).split('\n');

  const hardware = getValue(lines, 'hardware');
  const model = getValue(lines, 'model');
  return Boolean((hardware && PI_MODEL_NO.indexOf(hardware as string) > -1) || (model && model.indexOf('Raspberry Pi') > -1));
}

function isRaspbian() {
  let osrelease: any[] = [];
  try {
    osrelease = fs.readFileSync('/etc/os-release', { encoding: 'utf8' }).toString().split('\n');
  } catch {
    return false;
  }
  const id = getValue(osrelease, 'id', '=');
  return id && id.indexOf('raspbian') > -1;
}

function execWin(cmd: any, opts: any, callback: any) {
  if (!callback) {
    callback = opts;
    opts = execOptsWin;
  }
  let newCmd = 'chcp 65001 > nul && cmd /C ' + cmd + ' && chcp ' + codepage + ' > nul';
  exec(newCmd, opts, (error, stdout) => {
    callback(error, stdout);
  });
}

function darwinXcodeExists() {
  const cmdLineToolsExists = fs.existsSync('/Library/Developer/CommandLineTools/usr/bin/');
  const xcodeAppExists = fs.existsSync('/Applications/Xcode.app/Contents/Developer/Tools');
  const xcodeExists = fs.existsSync('/Library/Developer/Xcode/');
  return cmdLineToolsExists || xcodeExists || xcodeAppExists;
}

function nanoSeconds() {
  const time = process.hrtime();
  if (!Array.isArray(time) || time.length !== 2) {
    return 0;
  }
  return +time[0] * 1e9 + +time[1];
}

function countUniqueLines(lines: any, startingWith: any) {
  startingWith = startingWith || '';
  const uniqueLines: any[] = [];
  lines.forEach((line: any) => {
    if (line.startsWith(startingWith)) {
      if (uniqueLines.indexOf(line) === -1) {
        uniqueLines.push(line);
      }
    }
  });
  return uniqueLines.length;
}

function countLines(lines: any, startingWith: any) {
  startingWith = startingWith || '';
  const uniqueLines: any[] = [];
  lines.forEach((line: any) => {
    if (line.startsWith(startingWith)) {
      uniqueLines.push(line);
    }
  });
  return uniqueLines.length;
}

function sanitizeShellString(str: any, strict: boolean = false) {
  const s = str || '';
  let result = '';
  const l = mathMin(s.length, 2000);
  for (let i = 0; i <= l; i++) {
    if (
      !(
        s[i] === undefined ||
        s[i] === '>' ||
        s[i] === '<' ||
        s[i] === '*' ||
        s[i] === '?' ||
        s[i] === '[' ||
        s[i] === ']' ||
        s[i] === '|' ||
        s[i] === '˚' ||
        s[i] === '$' ||
        s[i] === ';' ||
        s[i] === '&' ||
        s[i] === ']' ||
        s[i] === '#' ||
        s[i] === '\\' ||
        s[i] === '\t' ||
        s[i] === '\n' ||
        s[i] === '\r' ||
        s[i] === "'" ||
        s[i] === '`' ||
        s[i] === '"' ||
        s[i].length > 1 ||
        (strict && s[i] === '(') ||
        (strict && s[i] === ')') ||
        (strict && s[i] === '@') ||
        (strict && s[i] === ' ') ||
        (strict && s[i] === '{') ||
        (strict && s[i] === ';') ||
        (strict && s[i] === '}')
      )
    ) {
      result = result + s[i];
    }
  }
  return result;
}

function isPrototypePolluted() {
  const s = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let notPolluted = true;
  let st = '';

  restoreStringPrototype(st);
  notPolluted = notPolluted || s.length !== 62;
  const ms = Date.now();
  if (typeof ms === 'number' && ms > 1600000000000) {
    const l = (ms % 100) + 15;
    for (let i = 0; i < l; i++) {
      const r = Math.random() * 61.99999999 + 1;
      const rs = parseInt(Math.floor(r).toString(), 10);
      const rs2 = parseInt(r.toString().split('.')[0], 10);
      const q = Math.random() * 61.99999999 + 1;
      const qs = parseInt(Math.floor(q).toString(), 10);
      const qs2 = parseInt(q.toString().split('.')[0], 10);
      notPolluted = notPolluted && r !== q;
      notPolluted = notPolluted && rs === rs2 && qs === qs2;
      st += s[rs - 1];
    }
    notPolluted = notPolluted && st.length === l;
    // string manipulation
    let p = Math.random() * l * 0.9999999999;
    let stm = st.substr(0, p) + ' ' + st.substr(p, 2000);
    restoreStringPrototype(stm);
    let sto = stm.replace(/ /g, '');
    notPolluted = notPolluted && st === sto;
    p = Math.random() * l * 0.9999999999;
    stm = st.substr(0, p) + '{' + st.substr(p, 2000);
    sto = stm.replace(/{/g, '');
    notPolluted = notPolluted && st === sto;
    p = Math.random() * l * 0.9999999999;
    stm = st.substr(0, p) + '*' + st.substr(p, 2000);
    sto = stm.replace(/\*/g, '');
    notPolluted = notPolluted && st === sto;
    p = Math.random() * l * 0.9999999999;
    stm = st.substr(0, p) + '$' + st.substr(p, 2000);
    sto = stm.replace(/\$/g, '');
    notPolluted = notPolluted && st === sto;

    // lower
    const stl = st.toLowerCase();
    notPolluted = Boolean(notPolluted && stl.length === l && stl[l - 1] && !stl[l]);
    for (let i = 0; i < l; i++) {
      const s1 = st[i];
      restoreStringPrototype(s1);
      const s2 = stl ? stl[i] : '';
      const s1l = s1.toLowerCase();
      notPolluted = Boolean(notPolluted && s1l[0] === s2 && s1l[0] && !s1l[1]);
    }
  }
  return !notPolluted;
}

function restoreStringPrototype(value: any) {
  if (Object.getPrototypeOf(value) !== stringObj) {
    Object.setPrototypeOf(value, stringObj);
  }
}

function hex2bin(hex: any) {
  return ('00000000' + parseInt(hex, 16).toString(2)).substr(-8);
}

function getFilesInPath(source: any) {
  const lstatSync = fs.lstatSync;
  const readdirSync = fs.readdirSync;
  const join = path.join;

  function isDirectory(source: any) {
    return lstatSync(source).isDirectory();
  }
  function isFile(source: any) {
    return lstatSync(source).isFile();
  }

  function getDirectories(source: any) {
    return readdirSync(source)
      .map((name) => {
        return join(source, name);
      })
      .filter(isDirectory);
  }
  function getFiles(source: any) {
    return readdirSync(source)
      .map((name) => {
        return join(source, name);
      })
      .filter(isFile);
  }

  function getFilesRecursively(source: string): string[] {
    try {
      const dirs = getDirectories(source);
      const files = dirs
        .map((dir) => {
          return getFilesRecursively(dir);
        })
        .reduce((a, b) => {
          return a.concat(b);
        }, [] as string[]);
      return files.concat(getFiles(source));
    } catch {
      return [];
    }
  }

  if (fs.existsSync(source)) {
    return getFilesRecursively(source);
  } else {
    return [];
  }
}

function decodePiCpuinfo(lines?: string[] | string): any {
  if (_rpi_cpuinfo === null && lines !== undefined) {
    _rpi_cpuinfo = Array.isArray(lines) ? lines : lines.split('\n');
  } else if (lines === undefined) {
    lines = _rpi_cpuinfo || [];
  }
  const linesArr: string[] = Array.isArray(lines) ? lines : (lines as string).split('\n');

  // https://www.raspberrypi.org/documentation/hardware/raspberrypi/revision-codes/README.md

  const oldRevisionCodes: Record<string, any> = {
    '0002': {
      type: 'B',
      revision: '1.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '0003': {
      type: 'B',
      revision: '1.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '0004': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '0005': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Qisda',
      processor: 'BCM2835'
    },
    '0006': {
      type: 'B',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '0007': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '0008': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '0009': {
      type: 'A',
      revision: '2.0',
      memory: 256,
      manufacturer: 'Qisda',
      processor: 'BCM2835'
    },
    '000d': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '000e': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '000f': {
      type: 'B',
      revision: '2.0',
      memory: 512,
      manufacturer: 'Egoman',
      processor: 'BCM2835'
    },
    '0010': {
      type: 'B+',
      revision: '1.2',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '0011': {
      type: 'CM1',
      revision: '1.0',
      memory: 512,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '0012': {
      type: 'A+',
      revision: '1.1',
      memory: 256,
      manufacturer: 'Sony UK',
      processor: 'BCM2835'
    },
    '0013': {
      type: 'B+',
      revision: '1.2',
      memory: 512,
      manufacturer: 'Embest',
      processor: 'BCM2835'
    },
    '0014': {
      type: 'CM1',
      revision: '1.0',
      memory: 512,
      manufacturer: 'Embest',
      processor: 'BCM2835'
    },
    '0015': {
      type: 'A+',
      revision: '1.1',
      memory: 256,
      manufacturer: '512MB	Embest',
      processor: 'BCM2835'
    }
  };

  const processorList = ['BCM2835', 'BCM2836', 'BCM2837', 'BCM2711', 'BCM2712'];
  const manufacturerList = ['Sony UK', 'Egoman', 'Embest', 'Sony Japan', 'Embest', 'Stadium'];
  const typeList: Record<string, string> = {
    '00': 'A',
    '01': 'B',
    '02': 'A+',
    '03': 'B+',
    '04': '2B',
    '05': 'Alpha (early prototype)',
    '06': 'CM1',
    '08': '3B',
    '09': 'Zero',
    '0a': 'CM3',
    '0c': 'Zero W',
    '0d': '3B+',
    '0e': '3A+',
    '0f': 'Internal use only',
    10: 'CM3+',
    11: '4B',
    12: 'Zero 2 W',
    13: '400',
    14: 'CM4',
    15: 'CM4S',
    16: 'Internal use only',
    17: '5',
    18: 'CM5',
    19: '500/500+',
    '1a': 'CM5 Lite'
  };

  const revisionCode = getValue(linesArr, 'revision', ':', true);
  const model = getValue(linesArr, 'model:', ':', true);
  const serial = getValue(linesArr, 'serial', ':', true);

  let result: Record<string, any> = {};
  if ({}.hasOwnProperty.call(oldRevisionCodes, revisionCode)) {
    // old revision codes
    result = {
      model,
      serial,
      revisionCode,
      memory: oldRevisionCodes[revisionCode].memory,
      manufacturer: oldRevisionCodes[revisionCode].manufacturer,
      processor: oldRevisionCodes[revisionCode].processor,
      type: oldRevisionCodes[revisionCode].type,
      revision: oldRevisionCodes[revisionCode].revision
    };
  } else {
    // new revision code
    const revision = ('00000000' + getValue(linesArr, 'revision', ':', true).toLowerCase()).substr(-8);
    const memSizeCode = parseInt(hex2bin(revision.substr(2, 1)).substr(5, 3), 2) || 0;
    const manufacturer = manufacturerList[parseInt(revision.substr(3, 1), 10)];
    const processor = processorList[parseInt(revision.substr(4, 1), 10)];
    const typeCode = revision.substr(5, 2);

    result = {
      model,
      serial,
      revisionCode,
      memory: 256 * Math.pow(2, memSizeCode),
      manufacturer,
      processor,
      type: {}.hasOwnProperty.call(typeList, typeCode) ? typeList[typeCode] : '',
      revision: '1.' + revision.substr(7, 1)
    };
  }
  return result;
}

function getRpiGpu(cpuinfo?: string[] | string): string {
  if (_rpi_cpuinfo === null && cpuinfo !== undefined) {
    _rpi_cpuinfo = Array.isArray(cpuinfo) ? cpuinfo : cpuinfo.split('\n');
  } else if (cpuinfo === undefined && _rpi_cpuinfo !== null) {
    cpuinfo = _rpi_cpuinfo;
  } else {
    try {
      cpuinfo = fs.readFileSync('/proc/cpuinfo', { encoding: 'utf8' }).toString().split('\n');
      _rpi_cpuinfo = cpuinfo;
    } catch {
      return '';
    }
  }

  const rpi = decodePiCpuinfo(cpuinfo);
  if (rpi.type === '4B' || rpi.type === 'CM4' || rpi.type === 'CM4S' || rpi.type === '400') {
    return 'VideoCore VI';
  }
  if (rpi.type === '5' || rpi.type === '500') {
    return 'VideoCore VII';
  }
  return 'VideoCore IV';
}

function promiseAll(promises: Array<Promise<any>>): Promise<{ errors: any[]; results: any[] }> {
  const resolvingPromises = promises.map(
    (promise) =>
      new Promise((resolve) => {
        const payload = new Array(2);
        promise
          .then((result) => {
            payload[0] = result;
          })
          .catch((error) => {
            payload[1] = error;
          })
          .then(() => {
            // The wrapped Promise returns an array: 0 = result, 1 = error ... we resolve all
            resolve(payload);
          });
      })
  );
  const errors: any[] = [];
  const results: any[] = [];

  // Execute all wrapped Promises
  return Promise.all(resolvingPromises).then((items) => {
    items.forEach((payload: any) => {
      if (payload[1]) {
        errors.push(payload[1]);
        results.push(null);
      } else {
        errors.push(null);
        results.push(payload[0]);
      }
    });

    return {
      errors: errors,
      results: results
    };
  });
}

function promisify(nodeStyleFunction: (...args: any[]) => void): (...args: any[]) => Promise<any> {
  return () => {
    const args = Array.prototype.slice.call(arguments);
    return new Promise((resolve, reject) => {
      args.push((err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
      nodeStyleFunction.apply(null, args);
    });
  };
}

function promisifySave(nodeStyleFunction: (...args: any[]) => void): (...args: any[]) => Promise<any> {
  return () => {
    const args = Array.prototype.slice.call(arguments);
    return new Promise((resolve) => {
      args.push((err: any, data: any) => {
        resolve(data);
      });
      nodeStyleFunction.apply(null, args);
    });
  };
}

function linuxVersion() {
  let result = '';
  if (_linux) {
    try {
      result = execSync('uname -v', execOptsLinux).toString();
    } catch {
      result = '';
    }
  }
  return result;
}

function plistParser(xmlStr: any) {
  const tags = ['array', 'dict', 'key', 'string', 'integer', 'date', 'real', 'data', 'boolean', 'arrayEmpty'];
  const startStr = '<plist version';

  let pos = xmlStr.indexOf(startStr);
  let len = xmlStr.length;
  while (xmlStr[pos] !== '>' && pos < len) {
    pos++;
  }

  let depth = 0;
  let inTagStart = false;
  let inTagContent = false;
  let inTagEnd = false;
  let metaData: any[] = [{ tagStart: '', tagEnd: '', tagContent: '', key: '', data: null }];
  let c = '';
  let cn = xmlStr[pos];

  while (pos < len) {
    c = cn;
    if (pos + 1 < len) {
      cn = xmlStr[pos + 1];
    }
    if (c === '<') {
      inTagContent = false;
      if (cn === '/') {
        inTagEnd = true;
      } else if (metaData[depth].tagStart) {
        metaData[depth].tagContent = '';
        if (!metaData[depth].data) {
          metaData[depth].data = metaData[depth].tagStart === 'array' ? [] : {};
        }
        depth++;
        metaData.push({ tagStart: '', tagEnd: '', tagContent: '', key: null, data: null });
        inTagStart = true;
        inTagContent = false;
      } else if (!inTagStart) {
        inTagStart = true;
      }
    } else if (c === '>') {
      if (metaData[depth].tagStart === 'true/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/boolean';
        metaData[depth].data = true;
      }
      if (metaData[depth].tagStart === 'false/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/boolean';
        metaData[depth].data = false;
      }
      if (metaData[depth].tagStart === 'array/') {
        inTagStart = false;
        inTagEnd = true;
        metaData[depth].tagStart = '';
        metaData[depth].tagEnd = '/arrayEmpty';
        metaData[depth].data = [];
      }
      if (inTagContent) {
        inTagContent = false;
      }
      if (inTagStart) {
        inTagStart = false;
        inTagContent = true;
        if (metaData[depth].tagStart === 'array') {
          metaData[depth].data = [];
        }
        if (metaData[depth].tagStart === 'dict') {
          metaData[depth].data = {};
        }
      }
      if (inTagEnd) {
        inTagEnd = false;
        if (metaData[depth].tagEnd && tags.indexOf(metaData[depth].tagEnd.substr(1)) >= 0) {
          if (metaData[depth].tagEnd === '/dict' || metaData[depth].tagEnd === '/array') {
            if (depth > 1 && metaData[depth - 2].tagStart === 'array') {
              metaData[depth - 2].data.push(metaData[depth - 1].data);
            }
            if (depth > 1 && metaData[depth - 2].tagStart === 'dict') {
              metaData[depth - 2].data[metaData[depth - 1].key] = metaData[depth - 1].data;
            }
            depth--;
            metaData.pop();
            metaData[depth].tagContent = '';
            metaData[depth].tagStart = '';
            metaData[depth].tagEnd = '';
          } else {
            if (metaData[depth].tagEnd === '/key' && metaData[depth].tagContent) {
              metaData[depth].key = metaData[depth].tagContent;
            } else {
              if (metaData[depth].tagEnd === '/real' && metaData[depth].tagContent) {
                metaData[depth].data = parseFloat(metaData[depth].tagContent) || 0;
              }
              if (metaData[depth].tagEnd === '/integer' && metaData[depth].tagContent) {
                metaData[depth].data = parseInt(metaData[depth].tagContent) || 0;
              }
              if (metaData[depth].tagEnd === '/string' && metaData[depth].tagContent) {
                metaData[depth].data = metaData[depth].tagContent || '';
              }
              if (metaData[depth].tagEnd === '/boolean') {
                metaData[depth].data = metaData[depth].tagContent || false;
              }
              if (metaData[depth].tagEnd === '/arrayEmpty') {
                metaData[depth].data = metaData[depth].tagContent || [];
              }
              if (depth > 0 && metaData[depth - 1].tagStart === 'array') {
                metaData[depth - 1].data.push(metaData[depth].data);
              }
              if (depth > 0 && metaData[depth - 1].tagStart === 'dict') {
                metaData[depth - 1].data[metaData[depth].key] = metaData[depth].data;
              }
            }
            metaData[depth].tagContent = '';
            metaData[depth].tagStart = '';
            metaData[depth].tagEnd = '';
          }
        }
        metaData[depth].tagEnd = '';
        inTagStart = false;
        inTagContent = false;
      }
    } else {
      if (inTagStart) {
        metaData[depth].tagStart += c;
      }
      if (inTagEnd) {
        metaData[depth].tagEnd += c;
      }
      if (inTagContent) {
        metaData[depth].tagContent += c;
      }
    }
    pos++;
  }
  return metaData[0].data;
}

function strIsNumeric(str: any) {
  return typeof str === 'string' && !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

function plistReader(output: any) {
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].indexOf(' = ') >= 0) {
      const lineParts = lines[i].split(' = ');
      lineParts[0] = lineParts[0].trim();
      if (!lineParts[0].startsWith('"')) {
        lineParts[0] = '"' + lineParts[0] + '"';
      }
      lineParts[1] = lineParts[1].trim();
      if (lineParts[1].indexOf('"') === -1 && lineParts[1].endsWith(';')) {
        const valueString = lineParts[1].substring(0, lineParts[1].length - 1);
        if (!strIsNumeric(valueString)) {
          lineParts[1] = `"${valueString}";`;
        }
      }
      if (lineParts[1].indexOf('"') >= 0 && lineParts[1].endsWith(';')) {
        const valueString = lineParts[1].substring(0, lineParts[1].length - 1).replace(/"/g, '');
        if (strIsNumeric(valueString)) {
          lineParts[1] = `${valueString};`;
        }
      }
      lines[i] = lineParts.join(' : ');
    }
    lines[i] = lines[i].replace(/\(/g, '[').replace(/\)/g, ']').replace(/;/g, ',').trim();
    if (lines[i].startsWith('}') && lines[i - 1] && lines[i - 1].endsWith(',')) {
      lines[i - 1] = lines[i - 1].substring(0, lines[i - 1].length - 1);
    }
  }
  output = lines.join('');
  let obj: Record<string, any> = {};
  try {
    obj = JSON.parse(output);
  } catch (e) {
    noop();
  }
  return obj;
}

function semverCompare(v1: any, v2: any) {
  let res = 0;
  const parts1 = v1.split('.');
  const parts2 = v2.split('.');
  if (parts1[0] < parts2[0]) {
    res = 1;
  } else if (parts1[0] > parts2[0]) {
    res = -1;
  } else if (parts1[0] === parts2[0] && parts1.length >= 2 && parts2.length >= 2) {
    if (parts1[1] < parts2[1]) {
      res = 1;
    } else if (parts1[1] > parts2[1]) {
      res = -1;
    } else if (parts1[1] === parts2[1]) {
      if (parts1.length >= 3 && parts2.length >= 3) {
        if (parts1[2] < parts2[2]) {
          res = 1;
        } else if (parts1[2] > parts2[2]) {
          res = -1;
        }
      } else if (parts2.length >= 3) {
        res = 1;
      }
    }
  }
  return res;
}

function getAppleModel(key: any) {
  const appleModelIds = [
    {
      key: 'Mac17,7',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M5 Max',
      year: '2026',
      additional: ''
    },
    {
      key: 'Mac17,6',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M5 Max',
      year: '2026',
      additional: ''
    },
    {
      key: 'Mac17,5',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M5 Pro',
      year: '2026',
      additional: ''
    },
    {
      key: 'Mac17,4',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M5 Pro',
      year: '2026',
      additional: ''
    },
    {
      key: 'Mac17,1',
      name: 'MacBook Neo',
      size: '14-inch',
      processor: 'A18 Pro',
      year: '2026',
      additional: ''
    },
    {
      key: 'Mac17,3',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M5',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac17,2',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M5',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac16,13',
      name: 'MacBook Air',
      size: '15-inch',
      processor: 'M4',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac16,12',
      name: 'MacBook Air',
      size: '13-inch',
      processor: 'M4',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac15,13',
      name: 'MacBook Air',
      size: '15-inch',
      processor: 'M3',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac15,12',
      name: 'MacBook Air',
      size: '13-inch',
      processor: 'M3',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac14,15',
      name: 'MacBook Air',
      size: '15-inch',
      processor: 'M2',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac14,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: 'M2',
      year: '2022',
      additional: ''
    },
    {
      key: 'MacBookAir10,1',
      name: 'MacBook Air',
      size: '13-inch',
      processor: 'M1',
      year: '2020',
      additional: ''
    },
    {
      key: 'MacBookAir9,1',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: '2020',
      additional: ''
    },
    {
      key: 'MacBookAir8,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookAir8,1',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: '2018',
      additional: ''
    },
    {
      key: 'MacBookAir7,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: '2017',
      additional: ''
    },
    {
      key: 'MacBookAir7,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Early 2015',
      additional: ''
    },
    {
      key: 'MacBookAir7,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Early 2015',
      additional: ''
    },
    {
      key: 'MacBookAir6,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Early 2014',
      additional: ''
    },
    {
      key: 'MacBookAir6,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Early 2014',
      additional: ''
    },
    {
      key: 'MacBookAir6,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Mid 2013',
      additional: ''
    },
    {
      key: 'MacBookAir6,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Mid 2013',
      additional: ''
    },
    {
      key: 'MacBookAir5,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacBookAir5,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacBookAir4,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'MacBookAir4,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'MacBookAir3,2',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Late 2010',
      additional: ''
    },
    {
      key: 'MacBookAir3,1',
      name: 'MacBook Air',
      size: '11-inch',
      processor: '',
      year: 'Late 2010',
      additional: ''
    },
    {
      key: 'MacBookAir2,1',
      name: 'MacBook Air',
      size: '13-inch',
      processor: '',
      year: 'Mid 2009',
      additional: ''
    },
    {
      key: 'Mac16,1',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M4',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac16,6',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M4 Pro',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac16,8',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M4 Max',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac16,5',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M4 Pro',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac16,6',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M4 Max',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac15,3',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M3',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,6',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M3 Pro',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,8',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M3 Pro',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,10',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M3 Max',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,7',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M3 Pro',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,9',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M3 Pro',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac15,11',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M3 Max',
      year: 'Nov 2023',
      additional: ''
    },
    {
      key: 'Mac14,5',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M2 Max',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,9',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M2 Max',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,6',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M2 Max',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,10',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M2 Max',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,7',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: 'M2',
      year: '2022',
      additional: ''
    },
    {
      key: 'MacBookPro18,3',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M1 Pro',
      year: '2021',
      additional: ''
    },
    {
      key: 'MacBookPro18,4',
      name: 'MacBook Pro',
      size: '14-inch',
      processor: 'M1 Max',
      year: '2021',
      additional: ''
    },
    {
      key: 'MacBookPro18,1',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M1 Pro',
      year: '2021',
      additional: ''
    },
    {
      key: 'MacBookPro18,2',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: 'M1 Max',
      year: '2021',
      additional: ''
    },
    {
      key: 'MacBookPro17,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: 'M1',
      year: '2020',
      additional: ''
    },
    {
      key: 'MacBookPro16,3',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2020',
      additional: 'Two Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro16,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2020',
      additional: 'Four Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro16,1',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookPro16,4',
      name: 'MacBook Pro',
      size: '16-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookPro15,3',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookPro15,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookPro15,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacBookPro15,4',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2019',
      additional: 'Two Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro15,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: '2018',
      additional: ''
    },
    {
      key: 'MacBookPro15,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2018',
      additional: 'Four Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro14,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2017',
      additional: 'Two Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro14,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2017',
      additional: 'Four Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro14,3',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: '2017',
      additional: ''
    },
    {
      key: 'MacBookPro13,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2016',
      additional: 'Two Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro13,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: '2016',
      additional: 'Four Thunderbolt 3 ports'
    },
    {
      key: 'MacBookPro13,3',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: '2016',
      additional: ''
    },
    {
      key: 'MacBookPro11,4',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2015',
      additional: ''
    },
    {
      key: 'MacBookPro11,5',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2015',
      additional: ''
    },
    {
      key: 'MacBookPro12,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Early 2015',
      additional: ''
    },
    {
      key: 'MacBookPro11,2',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'MacBookPro11,3',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'MacBookPro11,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'MacBookPro10,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacBookPro10,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Late 2012',
      additional: ''
    },
    {
      key: 'MacBookPro9,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacBookPro9,2',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacBookPro8,3',
      name: 'MacBook Pro',
      size: '17-inch',
      processor: '',
      year: 'Early 2011',
      additional: ''
    },
    {
      key: 'MacBookPro8,2',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Early 2011',
      additional: ''
    },
    {
      key: 'MacBookPro8,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Early 2011',
      additional: ''
    },
    {
      key: 'MacBookPro6,1',
      name: 'MacBook Pro',
      size: '17-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'MacBookPro6,2',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'MacBookPro7,1',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'MacBookPro5,2',
      name: 'MacBook Pro',
      size: '17-inch',
      processor: '',
      year: 'Early 2009',
      additional: ''
    },
    {
      key: 'MacBookPro5,3',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Mid 2009',
      additional: ''
    },
    {
      key: 'MacBookPro5,5',
      name: 'MacBook Pro',
      size: '13-inch',
      processor: '',
      year: 'Mid 2009',
      additional: ''
    },
    {
      key: 'MacBookPro5,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Late 2008',
      additional: ''
    },
    {
      key: 'MacBookPro4,1',
      name: 'MacBook Pro',
      size: '15-inch',
      processor: '',
      year: 'Early 2008',
      additional: ''
    },
    {
      key: 'MacBook10,1',
      name: 'MacBook',
      size: '12-inch',
      processor: '',
      year: '2017',
      additional: ''
    },
    {
      key: 'MacBook9,1',
      name: 'MacBook',
      size: '12-inch',
      processor: '',
      year: 'Early 2016',
      additional: ''
    },
    {
      key: 'MacBook8,1',
      name: 'MacBook',
      size: '12-inch',
      processor: '',
      year: 'Early 2015',
      additional: ''
    },
    {
      key: 'MacBook7,1',
      name: 'MacBook',
      size: '13-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'MacBook6,1',
      name: 'MacBook',
      size: '13-inch',
      processor: '',
      year: 'Late 2009',
      additional: ''
    },
    {
      key: 'MacBook5,2',
      name: 'MacBook',
      size: '13-inch',
      processor: '',
      year: 'Early 2009',
      additional: ''
    },
    {
      key: 'Mac14,13',
      name: 'Mac Studio',
      size: '',
      processor: 'M2 Max',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,14',
      name: 'Mac Studio',
      size: '',
      processor: 'M2 Ultra',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac15,14',
      name: 'Mac Studio',
      size: '',
      processor: 'M3 Ultra',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac16,9',
      name: 'Mac Studio',
      size: '',
      processor: 'M4 Max',
      year: '2025',
      additional: ''
    },
    {
      key: 'Mac13,1',
      name: 'Mac Studio',
      size: '',
      processor: 'M1 Max',
      year: '2022',
      additional: ''
    },
    {
      key: 'Mac13,2',
      name: 'Mac Studio',
      size: '',
      processor: 'M1 Ultra',
      year: '2022',
      additional: ''
    },
    {
      key: 'Mac16,11',
      name: 'Mac mini',
      size: '',
      processor: 'M4 Pro',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac16,10',
      name: 'Mac mini',
      size: '',
      processor: 'M4',
      year: '2024',
      additional: ''
    },
    {
      key: 'Mac14,3',
      name: 'Mac mini',
      size: '',
      processor: 'M2',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,12',
      name: 'Mac mini',
      size: '',
      processor: 'M2 Pro',
      year: '2023',
      additional: ''
    },
    {
      key: 'Macmini9,1',
      name: 'Mac mini',
      size: '',
      processor: 'M1',
      year: '2020',
      additional: ''
    },
    {
      key: 'Macmini8,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Late 2018',
      additional: ''
    },
    {
      key: 'Macmini7,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Late 2014',
      additional: ''
    },
    {
      key: 'Macmini6,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Late 2012',
      additional: ''
    },
    {
      key: 'Macmini6,2',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Late 2012',
      additional: ''
    },
    {
      key: 'Macmini5,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'Macmini5,2',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'Macmini4,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'Macmini3,1',
      name: 'Mac mini',
      size: '',
      processor: '',
      year: 'Early 2009',
      additional: ''
    },
    {
      key: 'Mac16,3',
      name: 'iMac',
      size: '24-inch',
      processor: 'M4',
      year: '2024',
      additional: 'Four ports'
    },
    {
      key: 'Mac16,2',
      name: 'iMac',
      size: '24-inch',
      processor: 'M4',
      year: '2024',
      additional: 'Two ports'
    },
    {
      key: 'Mac15,5',
      name: 'iMac',
      size: '24-inch',
      processor: 'M3',
      year: '2023',
      additional: 'Four ports'
    },
    {
      key: 'Mac15,4',
      name: 'iMac',
      size: '24-inch',
      processor: 'M3',
      year: '2023',
      additional: 'Two ports'
    },
    {
      key: 'iMac21,1',
      name: 'iMac',
      size: '24-inch',
      processor: 'M1',
      year: '2021',
      additional: ''
    },
    {
      key: 'iMac21,2',
      name: 'iMac',
      size: '24-inch',
      processor: 'M1',
      year: '2021',
      additional: ''
    },
    {
      key: 'iMac20,1',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: '2020',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac20,2',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: '2020',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac19,1',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: '2019',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac19,2',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: '2019',
      additional: 'Retina 4K'
    },
    {
      key: 'iMacPro1,1',
      name: 'iMac Pro',
      size: '',
      processor: '',
      year: '2017',
      additional: ''
    },
    {
      key: 'iMac18,3',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: '2017',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac18,2',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: '2017',
      additional: 'Retina 4K'
    },
    {
      key: 'iMac18,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: '2017',
      additional: ''
    },
    {
      key: 'iMac17,1',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Late 2015',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac16,2',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Late 2015',
      additional: 'Retina 4K'
    },
    {
      key: 'iMac16,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Late 2015',
      additional: ''
    },
    {
      key: 'iMac15,1',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Late 2014',
      additional: 'Retina 5K'
    },
    {
      key: 'iMac14,4',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Mid 2014',
      additional: ''
    },
    {
      key: 'iMac14,2',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'iMac14,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'iMac13,2',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Late 2012',
      additional: ''
    },
    {
      key: 'iMac13,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Late 2012',
      additional: ''
    },
    {
      key: 'iMac12,2',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'iMac12,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Mid 2011',
      additional: ''
    },
    {
      key: 'iMac11,3',
      name: 'iMac',
      size: '27-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'iMac11,2',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'iMac10,1',
      name: 'iMac',
      size: '21.5-inch',
      processor: '',
      year: 'Late 2009',
      additional: ''
    },
    {
      key: 'iMac9,1',
      name: 'iMac',
      size: '20-inch',
      processor: '',
      year: 'Early 2009',
      additional: ''
    },
    {
      key: 'Mac14,8',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: '2023',
      additional: ''
    },
    {
      key: 'Mac14,8',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: '2023',
      additional: 'Rack'
    },
    {
      key: 'MacPro7,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: '2019',
      additional: ''
    },
    {
      key: 'MacPro7,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: '2019',
      additional: 'Rack'
    },
    {
      key: 'MacPro6,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: 'Late 2013',
      additional: ''
    },
    {
      key: 'MacPro5,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: 'Mid 2012',
      additional: ''
    },
    {
      key: 'MacPro5,1',
      name: 'Mac Pro Server',
      size: '',
      processor: '',
      year: 'Mid 2012',
      additional: 'Server'
    },
    {
      key: 'MacPro5,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: 'Mid 2010',
      additional: ''
    },
    {
      key: 'MacPro5,1',
      name: 'Mac Pro Server',
      size: '',
      processor: '',
      year: 'Mid 2010',
      additional: 'Server'
    },
    {
      key: 'MacPro4,1',
      name: 'Mac Pro',
      size: '',
      processor: '',
      year: 'Early 2009',
      additional: ''
    }
  ];

  const list = appleModelIds.filter((model) => model.key === key);
  if (list.length === 0) {
    return {
      key: key,
      model: 'Apple',
      version: 'Unknown'
    };
  }
  const features: any[] = [];
  if (list[0].size) {
    features.push(list[0].size);
  }
  if (list[0].processor) {
    features.push(list[0].processor);
  }
  if (list[0].year) {
    features.push(list[0].year);
  }
  if (list[0].additional) {
    features.push(list[0].additional);
  }
  return {
    key: key,
    model: list[0].name,
    version: list[0].name + ' (' + features.join(', ') + ')'
  };
}

function checkWebsite(url: string, timeout = 5000): Promise<{ url: string; statusCode: number; message?: string; time: number }> {
  const http = url.startsWith('https:') || url.indexOf(':443/') > 0 || url.indexOf(':8443/') > 0 ? require('https') : require('http');
  const t = Date.now();
  return new Promise((resolve) => {
    const request = http
      .get(url, (res: any) => {
        res.on('data', () => {});
        res.on('end', () => {
          resolve({
            url,
            statusCode: res.statusCode,
            message: res.statusMessage,
            time: Date.now() - t
          });
        });
      })
      .on('error', (e: any) => {
        resolve({
          url,
          statusCode: 404,
          message: e.message,
          time: Date.now() - t
        });
      })
      .setTimeout(timeout, () => {
        request.destroy();
        resolve({
          url,
          statusCode: 408,
          message: 'Request Timeout',
          time: Date.now() - t
        });
      });
  });
}

function cleanString(str: any) {
  return str.replace(/To Be Filled By O.E.M./g, '');
}
function noop() {}



export {
  toInt,
  splitByNumber,
  execOptsWin,
  execOptsLinux,
  getCodepage,
  execWin,
  isFunction,
  unique,
  sortByKey,
  cores,
  getValue,
  decodeEscapeSequence,
  parseDateTime,
  parseHead,
  findObjectByKey,
  darwinXcodeExists,
  getVboxmanage,
  powerShell,
  powerShellStart,
  powerShellRelease,
  execSafe,
  nanoSeconds,
  countUniqueLines,
  countLines,
  noop,
  isRaspberry,
  isRaspbian,
  sanitizeShellString,
  isPrototypePolluted,
  decodePiCpuinfo,
  getRpiGpu,
  promiseAll,
  promisify,
  promisifySave,
  smartMonToolsInstalled,
  smartMonToolsInfo,
  diagnostics,
  clearDiagnostics,
  pushDiagnostic,
  linuxVersion,
  plistParser,
  plistReader,
  stringObj,
  stringReplace,
  stringToLower,
  stringToString,
  stringSubstr,
  stringSubstring,
  stringTrim,
  stringStartWith,
  restoreStringPrototype,
  mathMin,
  WINDIR,
  getFilesInPath,
  semverCompare,
  getAppleModel,
  checkWebsite,
  cleanString,
  getPowershell,
  getPowershellVersion
};
