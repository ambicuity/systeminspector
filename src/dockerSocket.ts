

// ==================================================================================
// dockerSockets.js
// ----------------------------------------------------------------------------------
// Description:   System Inspector - library
//                for Node.js
// Copyright:     (c) 2026 Project Contributors
// Maintainers:   Project Contributors
// ----------------------------------------------------------------------------------
// License:       MIT
// ==================================================================================
// 13. DockerSockets
// ----------------------------------------------------------------------------------

import * as net from 'net';
import * as os from 'os';
import * as util from './util';
const isWin = os.type() === 'Windows_NT';
const socketPath = isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock';
const DEFAULT_SOCKET_TIMEOUT = 10000;

function requestDocker(path: string, callback: any): void {
  try {
    const socket = net.createConnection({ path: socketPath });
    let alldata = '';
    let settled = false;
    const timer = setTimeout(() => {
      finish({});
      util.pushDiagnostic({
        feature: 'docker',
        functionName: 'dockerSocket',
        module: 'dockerSocket',
        command: path,
        issue: 'command_timeout',
        message: `Docker socket request timed out after ${DEFAULT_SOCKET_TIMEOUT} ms`
      });
    }, DEFAULT_SOCKET_TIMEOUT);

    function finish(data: any): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        util.noop();
      }
      callback(data);
    }

    socket.on('connect', () => {
      socket.write(`GET ${path} HTTP/1.0\r\n\r\n`);
    });

    socket.on('data', (chunk) => {
      alldata += chunk.toString();
      if (alldata.length > 1024 * 1024 * 32) {
        util.pushDiagnostic({
          feature: 'docker',
          functionName: 'dockerSocket',
          module: 'dockerSocket',
          command: path,
          issue: 'command_error',
          code: 'max_buffer_exceeded',
          message: 'Docker socket response exceeded 32 MiB'
        });
        finish({});
      }
    });

    socket.on('error', (error) => {
      util.pushDiagnostic({
        feature: 'docker',
        functionName: 'dockerSocket',
        module: 'dockerSocket',
        command: path,
        issue: 'command_error',
        message: error.message || 'Docker socket request failed'
      });
      finish({});
    });

    socket.on('end', () => {
      const startbody = alldata.indexOf('\r\n\r\n');
      const body = startbody >= 0 ? alldata.substring(startbody + 4) : alldata;
      try {
        finish(JSON.parse(body));
      } catch {
        util.pushDiagnostic({
          feature: 'docker',
          functionName: 'dockerSocket',
          module: 'dockerSocket',
          command: path,
          issue: 'parse_error',
          message: 'Docker socket response could not be parsed as JSON'
        });
        finish({});
      }
    });
  } catch (error) {
    util.pushDiagnostic({
      feature: 'docker',
      functionName: 'dockerSocket',
      module: 'dockerSocket',
      command: path,
      issue: 'command_error',
      message: error instanceof Error ? error.message : 'Docker socket request failed'
    });
    callback({});
  }
}

class DockerSocket {
  getInfo(callback: any) {
    requestDocker('http:/info', callback);
  }

  listImages(all: any, callback: any) {
    requestDocker('http:/images/json' + (all ? '?all=1' : ''), callback);
  }

  inspectImage(id: any, callback: any) {
    id = id || '';
    if (id) {
      requestDocker('http:/images/' + encodeURIComponent(id) + '/json?stream=0', callback);
    } else {
      callback({});
    }
  }

  listContainers(all: any, callback: any) {
    requestDocker('http:/containers/json' + (all ? '?all=1' : ''), callback);
  }

  getStats(id: any, callback: any) {
    id = id || '';
    if (id) {
      requestDocker('http:/containers/' + encodeURIComponent(id) + '/stats?stream=0', callback);
    } else {
      callback({});
    }
  }

  getInspect(id: any, callback: any) {
    id = id || '';
    if (id) {
      requestDocker('http:/containers/' + encodeURIComponent(id) + '/json?stream=0', callback);
    } else {
      callback({});
    }
  }

  getProcesses(id: any, callback: any) {
    id = id || '';
    if (id) {
      requestDocker('http:/containers/' + encodeURIComponent(id) + '/top?ps_args=-opid,ppid,pgid,vsz,time,etime,nice,ruser,user,rgroup,group,stat,rss,args', callback);
    } else {
      callback({});
    }
  }

  listVolumes(callback: any) {
    requestDocker('http:/volumes', callback);
  }
}

export default DockerSocket;
