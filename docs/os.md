---
description: "Complete SystemInspector documentation and API reference for Operating System. Retrieve detailed hardware and system telemetry in Node.js."
---

# OS

In this section you will learn how to get information about the installed operating system, versions of installed development specific software packages, shell and users online:

For function reference and examples we assume, that we imported systeminspector as follows:

```
const si = require('@ambicuity/systeminspector');
```

## Operating System, Shell, Versions, Users

All functions in this section return a promise or can be called with a callback function (parameter cb in the function reference)

| Function | Result object | Linux | BSD | Mac | Win | Sun | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| si.osInfo(cb) | {...} | X | X | X | X | X | OS information |
|  | platform | X | X | X | X | X | 'linux', 'darwin', 'Windows', ... |
|  | distro | X | X | X | X | X |  |
|  | release | X | X | X | X | X |  |
|  | codename | X |  | X | X |  |  |
|  | kernel | X | X | X | X | X | kernel release - same as os.release() |
|  | arch | X | X | X | X | X | same as os.arch() |
|  | hostname | X | X | X | X | X | same as os.hostname() |
|  | fqdn | X | X | X | X | X | fully qualfied domain name |
|  | codepage | X | X | X | X |  | OS build version |
|  | logofile | X | X | X | X | X | e.g. 'apple', 'debian', 'fedora', ... |
|  | serial | X | X | X | X |  | OS/Host serial number |
|  | build | X |  | X | X |  | OS build version |
|  | servicepack |  |  |  | X |  | service pack version |
|  | uefi | X | X | X | X |  | OS uses UEFI on startup |
|  | hypervizor |  |  |  | X |  | hyper-v detected (win only) |
|  | remoteSession |  |  |  | X |  | runs in remote session (win only) |
| si.shell(cb) | : string | X | X | X | X |  | standard shell |
| si.uuid(cb) | {...} | X | X | X | X | X | OS, hardware and MAC UUID values |
|  | os | X | X | X | X | X | operating system UUID |
|  | hardware | X | X | X | X | X | hardware UUID |
|  | macs | X | X | X | X | X | unique MAC addresses |
| si.versions(apps, cb) | {...} | X | X | X | X | X | version information of  
node and dev software packages  
optional apps param (string,  
comma or space seperated)  
only those apps are detected |
|  | kernel | X | X | X | X | X | kernel version |
|  | apache | X | X | X | X | X | apache version |
|  | bash | X | X | X | X | X | bash version |
|  | bun | X | X | X | X | X | bun version |
|  | deno | X | X | X | X | X | deno version |
|  | docker | X | X | X | X | X | docker version |
|  | dotnet | X | X | X | X | X | dotnet version |
|  | fish | X | X | X | X | X | fish version |
|  | gcc | X | X | X | X | X | gcc version |
|  | git | X | X | X | X | X | git version |
|  | grunt | X | X | X | X | X | grunt version |
|  | gulp | X | X | X | X | X | gulp version |
|  | homebrew | X | X | X | X | X | homebrew version |
|  | java | X | X | X | X | X | java version |
|  | mongodb | X | X | X | X | X | mongodb version |
|  | mysql | X | X | X | X | X | mysql version |
|  | nginx | X | X | X | X | X | nginx version |
|  | node | X | X | X | X | X | node version |
|  | npm | X | X | X | X | X | npm version |
|  | openssl | X | X | X | X | X | openssl version |
|  | perl | X | X | X | X | X | perl version |
|  | php | X | X | X | X | X | php version |
|  | pip3 | X | X | X | X | X | pip3 version |
|  | pip | X | X | X | X | X | pip version |
|  | pm2 | X | X | X | X | X | pm2 version |
|  | postfix | X | X | X | X | X | postfix version |
|  | postgresql | X | X | X | X | X | postgresql version |
|  | powershell | X | X | X | X | X | powershell version |
|  | python3 | X | X | X | X | X | python3 version |
|  | python | X | X | X | X | X | python version |
|  | redis | X | X | X | X | X | redis version |
|  | systemOpenssl | X | X | X | X | X | systemOpenssl version |
|  | systemOpensslLib | X | X | X | X | X | systemOpensslLib version |
|  | tsc | X | X | X | X | X | tsc version |
|  | v8 | X | X | X | X | X | v8 version |
|  | virtualbox | X | X | X | X | X | virtualbox version |
|  | yarn | X | X | X | X | X | yarn version |
|  | zsh | X | X | X | X | X | zsh version |
| si.users(cb) | \[{...}\] | X | X | X | X | X | array of users online |
|  | \[0\].user | X | X | X | X | X | user name |
|  | \[0\].tty | X | X | X | X | X | terminal |
|  | \[0\].date | X | X | X | X | X | login date |
|  | \[0\].time | X | X | X | X | X | login time |
|  | \[0\].ip | X | X | X |  | X | ip address (remote login) |
|  | \[0\].command | X | X | X |  | X | last command or shell |

## Examples

##### Example

```
const si = require('@ambicuity/systeminspector');
si.osInfo().then(data => console.log(data));
```

```json
{
  platform: 'darwin',
  distro: 'Mac OS X',
  release: '10.15.3',
  codename: 'macOS Catalina',
  kernel: '19.3.0',
  arch: 'x64',
  hostname: 'hostname.local',
  fqdn: 'hostname.local',
  codepage: 'UTF-8',
  logofile: 'apple',
  serial: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  build: '19D76',
  servicepack: '',
  uefi: true
}
```

##### Example

```
const si = require('@ambicuity/systeminspector');
si.uuid().then(data => console.log(data));
```

```json
{
  os: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  hardware: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
  macs: [ 'xx:xx:xx:xx:xx:xx' ]
}
```

##### Example

```
const si = require('@ambicuity/systeminspector');
si.versions().then(data => console.log(data));
```

```json
{
  kernel: '23.6.0',
  apache: '2.4.62',
  bash: '3.2.57',
  bun: '1.1.21',
  deno: '2.1.4',
  docker: '26.1.1',
  dotnet: '',
  fish: '',
  gcc: '15.0.0',
  git: '2.39.3',
  grunt: '',
  gulp: '',
  homebrew: '4.4.14',
  java: '17.0.2',
  mongodb: '',
  mysql: '9.0.1',
  nginx: '',
  node: '22.12.0',
  npm: '10.9.0',
  openssl: '3.0.15+quic',
  perl: '5.34.1',
  php: '8.3.6',
  pip3: '24.2',
  pip: '20.3.4',
  pm2: '5.1.2',
  postfix: '3.2.2',
  postgresql: '16.4',
  powershell: '',
  python3: '3.12.5',
  python: '',
  redis: '',
  systemOpenssl: '3.3.1',
  systemOpensslLib: 'OpenSSL',
  tsc: '5.2.2',
  v8: '12.4.254.21-node.21',
  virtualbox: '',
  yarn: '1.22.17',
  zsh: '5.9''
}
```

##### Example 2

```
const si = require('@ambicuity/systeminspector');
si.versions('npm, php, postgresql').then(data => console.log(data));
```

```json
{
  npm: '6.13.6',
  php: '7.3.11',
  postgresql: '12.1'
}
```

##### Example

```
const si = require('@ambicuity/systeminspector');
si.users().then(data => console.log(data));
```

```json
[
  {
    user: 'yourname',
    tty: 'ttys006',
    date: '2020-02-01',
    time: '21:20',
    ip: '',
    command: 'w -ih'
  },
  {
    user: 'othername',
    tty: 'ttys008',
    date: '2020-02-01',
    time: '21:20',
    ip: '',
    command: '-bash'
  }
]
```

