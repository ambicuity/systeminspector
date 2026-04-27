

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
const isWin = os.type() === 'Windows_NT';
const socketPath = isWin ? '//./pipe/docker_engine' : '/var/run/docker.sock';

class DockerSocket {
  getInfo(callback: any) {
    try {
      let socket = net.createConnection({ path: socketPath });
      let alldata = '';
      let data;

      socket.on('connect', () => {
        socket.write('GET http:/info HTTP/1.0\r\n\r\n');
      });

      socket.on('data', (data) => {
        alldata = alldata + data.toString();
      });

      socket.on('error', () => {
        socket.destroy();
        callback({});
      });

      socket.on('end', () => {
        const startbody = alldata.indexOf('\r\n\r\n');
        alldata = alldata.substring(startbody + 4);
        socket.destroy();
        try {
          data = JSON.parse(alldata);
          callback(data);
        } catch {
          callback({});
        }
      });
    } catch {
      callback({});
    }
  }

  listImages(all: any, callback: any) {
    try {
      let socket = net.createConnection({ path: socketPath });
      let alldata = '';
      let data;

      socket.on('connect', () => {
        socket.write('GET http:/images/json' + (all ? '?all=1' : '') + ' HTTP/1.0\r\n\r\n');
      });

      socket.on('data', (data) => {
        alldata = alldata + data.toString();
      });

      socket.on('error', () => {
        socket.destroy();
        callback({});
      });

      socket.on('end', () => {
        const startbody = alldata.indexOf('\r\n\r\n');
        alldata = alldata.substring(startbody + 4);
        socket.destroy();
        try {
          data = JSON.parse(alldata);
          callback(data);
        } catch {
          callback({});
        }
      });
    } catch {
      callback({});
    }
  }

  inspectImage(id: any, callback: any) {
    id = id || '';
    if (id) {
      try {
        let socket = net.createConnection({ path: socketPath });
        let alldata = '';
        let data;

        socket.on('connect', () => {
          socket.write('GET http:/images/' + id + '/json?stream=0 HTTP/1.0\r\n\r\n');
        });

        socket.on('data', (data) => {
          alldata = alldata + data.toString();
        });

        socket.on('error', () => {
          socket.destroy();
          callback({});
        });

        socket.on('end', () => {
          const startbody = alldata.indexOf('\r\n\r\n');
          alldata = alldata.substring(startbody + 4);
          socket.destroy();
          try {
            data = JSON.parse(alldata);
            callback(data);
          } catch {
            callback({});
          }
        });
      } catch {
        callback({});
      }
    } else {
      callback({});
    }
  }

  listContainers(all: any, callback: any) {
    try {
      let socket = net.createConnection({ path: socketPath });
      let alldata = '';
      let data;

      socket.on('connect', () => {
        socket.write('GET http:/containers/json' + (all ? '?all=1' : '') + ' HTTP/1.0\r\n\r\n');
      });

      socket.on('data', (data) => {
        alldata = alldata + data.toString();
      });

      socket.on('error', () => {
        socket.destroy();
        callback({});
      });

      socket.on('end', () => {
        const startbody = alldata.indexOf('\r\n\r\n');
        alldata = alldata.substring(startbody + 4);
        socket.destroy();
        try {
          data = JSON.parse(alldata);
          callback(data);
        } catch {
          callback({});
        }
      });
    } catch {
      callback({});
    }
  }

  getStats(id: any, callback: any) {
    id = id || '';
    if (id) {
      try {
        let socket = net.createConnection({ path: socketPath });
        let alldata = '';
        let data;

        socket.on('connect', () => {
          socket.write('GET http:/containers/' + id + '/stats?stream=0 HTTP/1.0\r\n\r\n');
        });

        socket.on('data', (data) => {
          alldata = alldata + data.toString();
        });

        socket.on('error', () => {
          socket.destroy();
          callback({});
        });

        socket.on('end', () => {
          const startbody = alldata.indexOf('\r\n\r\n');
          alldata = alldata.substring(startbody + 4);
          socket.destroy();
          try {
            data = JSON.parse(alldata);
            callback(data);
          } catch {
            callback({});
          }
        });
      } catch {
        callback({});
      }
    } else {
      callback({});
    }
  }

  getInspect(id: any, callback: any) {
    id = id || '';
    if (id) {
      try {
        let socket = net.createConnection({ path: socketPath });
        let alldata = '';
        let data;

        socket.on('connect', () => {
          socket.write('GET http:/containers/' + id + '/json?stream=0 HTTP/1.0\r\n\r\n');
        });

        socket.on('data', (data) => {
          alldata = alldata + data.toString();
        });

        socket.on('error', () => {
          socket.destroy();
          callback({});
        });

        socket.on('end', () => {
          const startbody = alldata.indexOf('\r\n\r\n');
          alldata = alldata.substring(startbody + 4);
          socket.destroy();
          try {
            data = JSON.parse(alldata);
            callback(data);
          } catch {
            callback({});
          }
        });
      } catch {
        callback({});
      }
    } else {
      callback({});
    }
  }

  getProcesses(id: any, callback: any) {
    id = id || '';
    if (id) {
      try {
        let socket = net.createConnection({ path: socketPath });
        let alldata = '';
        let data;

        socket.on('connect', () => {
          socket.write('GET http:/containers/' + id + '/top?ps_args=-opid,ppid,pgid,vsz,time,etime,nice,ruser,user,rgroup,group,stat,rss,args HTTP/1.0\r\n\r\n');
        });

        socket.on('data', (data) => {
          alldata = alldata + data.toString();
        });

        socket.on('error', () => {
          socket.destroy();
          callback({});
        });

        socket.on('end', () => {
          const startbody = alldata.indexOf('\r\n\r\n');
          alldata = alldata.substring(startbody + 4);
          socket.destroy();
          try {
            data = JSON.parse(alldata);
            callback(data);
          } catch {
            callback({});
          }
        });
      } catch {
        callback({});
      }
    } else {
      callback({});
    }
  }

  listVolumes(callback: any) {
    try {
      let socket = net.createConnection({ path: socketPath });
      let alldata = '';
      let data;

      socket.on('connect', () => {
        socket.write('GET http:/volumes HTTP/1.0\r\n\r\n');
      });

      socket.on('data', (data) => {
        alldata = alldata + data.toString();
      });

      socket.on('error', () => {
        socket.destroy();
        callback({});
      });

      socket.on('end', () => {
        const startbody = alldata.indexOf('\r\n\r\n');
        alldata = alldata.substring(startbody + 4);
        socket.destroy();
        try {
          data = JSON.parse(alldata);
          callback(data);
        } catch {
          callback({});
        }
      });
    } catch {
      callback({});
    }
  }
}

export default DockerSocket;
