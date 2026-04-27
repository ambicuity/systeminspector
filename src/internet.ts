

// ==================================================================================
// internet.js
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 12. Internet
// ----------------------------------------------------------------------------------

import * as util from './util';
import type { InetChecksiteData, Callback } from './types';

const _platform = process.platform;

const _linux = _platform === 'linux' || _platform === 'android';
const _darwin = _platform === 'darwin';
const _windows = _platform === 'win32';
const _freebsd = _platform === 'freebsd';
const _openbsd = _platform === 'openbsd';
const _netbsd = _platform === 'netbsd';
const _sunos = _platform === 'sunos';

// --------------------------
// check if external site is available

export function inetChecksite(url: string, callback?: Callback<InetChecksiteData>): Promise<InetChecksiteData> {
  return new Promise((resolve) => {
    process.nextTick(() => {
      let result = {
        url: url,
        ok: false,
        status: 404,
        ms: null as number | null
      };
      if (typeof url !== 'string') {
        if (callback) {
          callback(result);
        }
        return resolve(result);
      }
      let urlSanitized = '';
      const s = util.sanitizeShellString(url, true);
      const l = util.mathMin(s.length, 2000);
      for (let i = 0; i <= l; i++) {
        if (s[i] !== undefined) {
          const sl = util.stringToLower.call(s[i]);
          if (sl && sl[0] && !sl[1] && sl[0].length === 1) {
            urlSanitized = urlSanitized + sl[0];
          }
        }
      }
      result.url = urlSanitized;
      try {
        if (urlSanitized && !util.isPrototypePolluted()) {
          if (
            urlSanitized.startsWith('file:') ||
            urlSanitized.startsWith('gopher:') ||
            urlSanitized.startsWith('telnet:') ||
            urlSanitized.startsWith('mailto:') ||
            urlSanitized.startsWith('news:') ||
            urlSanitized.startsWith('nntp:')
          ) {
            if (callback) {
              callback(result);
            }
            return resolve(result);
          }

          util.checkWebsite(urlSanitized).then((res) => {
            result.status = res.statusCode;
            result.ok = res.statusCode >= 200 && res.statusCode <= 399;
            result.ms = result.ok ? res.time : null;
            if (callback) {
              callback(result);
            }
            resolve(result);
          });
        } else {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      } catch {
        if (callback) {
          callback(result);
        }
        resolve(result);
      }
    });
  });
}


// --------------------------
// check inet latency

export function inetLatency(host?: string | Callback<number | null>, callback?: Callback<number | null>): Promise<number | null> {
  // fallback - if only callback is given
  if (util.isFunction(host) && !callback) {
    callback = host as Callback<number | null>;
    host = '';
  }

  host = host || '8.8.8.8';

  return new Promise((resolve) => {
    process.nextTick(() => {
      if (typeof host !== 'string') {
        if (callback) {
          callback(null);
        }
        return resolve(null);
      }
      let hostSanitized = '';
      const s = (util.isPrototypePolluted() ? '8.8.8.8' : util.sanitizeShellString(host, true)).trim();
      const l = util.mathMin(s.length, 2000);
      for (let i = 0; i <= l; i++) {
        if (!(s[i] === undefined)) {
          const sl = util.stringToLower.call(s[i]);
          if (sl && sl[0] && !sl[1]) {
            hostSanitized = hostSanitized + sl[0];
          }
        }
      }


      if (
        hostSanitized.startsWith('file:') ||
        hostSanitized.startsWith('gopher:') ||
        hostSanitized.startsWith('telnet:') ||
        hostSanitized.startsWith('mailto:') ||
        hostSanitized.startsWith('news:') ||
        hostSanitized.startsWith('nntp:')
      ) {
        if (callback) {
          callback(null);
        }
        return resolve(null);
      }
      let params;
      if (_linux || _freebsd || _openbsd || _netbsd || _darwin) {
        if (_linux) {
          params = ['-c', '2', '-w', '3', hostSanitized];
        }
        if (_freebsd || _openbsd || _netbsd) {
          params = ['-c', '2', '-t', '3', hostSanitized];
        }
        if (_darwin) {
          params = ['-c2', '-t3', hostSanitized];
        }
        util.execSafe('ping', params).then((stdout) => {
          let result = null;
          if (stdout) {
            const lines = stdout
              .split('\n')
              .filter((line) => line.indexOf('rtt') >= 0 || line.indexOf('round-trip') >= 0 || line.indexOf('avg') >= 0)
              .join('\n');

            const line = lines.split('=');
            if (line.length > 1) {
              const parts = line[1].split('/');
              if (parts.length > 1) {
                result = parseFloat(parts[1]);
              }
            }
          }
          if (callback) {
            callback(result);
          }
          resolve(result);
        });
      }
      if (_sunos) {
        const params = ['-s', '-a', hostSanitized, '56', '2'];
        const filt = 'avg';
        util.execSafe('ping', params, { timeout: 3000 }).then((stdout) => {
          let result = null;
          if (stdout) {
            const lines = stdout
              .split('\n')
              .filter((line) => line.indexOf(filt) >= 0)
              .join('\n');
            const line = lines.split('=');
            if (line.length > 1) {
              const parts = line[1].split('/');
              if (parts.length > 1) {
                result = parseFloat(parts[1].replace(',', '.'));
              }
            }
          }
          if (callback) {
            callback(result);
          }
          resolve(result);
        });
      }
      if (_windows) {
        let result: any = null;
        try {
          const params = [hostSanitized, '-n', '1'];
          util.execSafe('ping', params, util.execOptsWin).then((stdout) => {
            if (stdout) {
              const lines = stdout.split('\r\n');
              lines.shift();
              lines.forEach((line) => {
                if ((line.toLowerCase().match(/ms/g) || []).length === 3) {
                  let l = line.replace(/ +/g, ' ').split(' ');
                  if (l.length > 6) {
                    result = parseFloat(l[l.length - 1]);
                  }
                }
              });
            }
            if (callback) {
              callback(result);
            }
            resolve(result);
          });
        } catch {
          if (callback) {
            callback(result);
          }
          resolve(result);
        }
      }
    });
  });
}
