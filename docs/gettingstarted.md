---
description: "Complete SystemInspector documentation and API reference for Getting Started. Retrieve detailed hardware and system telemetry in Node.js."
---

# Getting Started

Systeminspector is a lightweight collection of 58 core inspection functions to retrieve detailed hardware, system and OS information for Node.js.

## Installation

```bash
npm install @ambicuity/systeminspector --save
```

## Usage Example

All functions (except `version` and `time`) are implemented as asynchronous functions. You can use standard `Promises` or `async / await`.

### Using Promises

```javascript
const si = require('@ambicuity/systeminspector');

// promises style - new since version 3
si.cpu()
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

### Using Async / Await

```javascript
const si = require('@ambicuity/systeminspector');

async function getSystemInfo() {
  try {
    const data = await si.cpu();
    console.log(data);
  } catch (e) {
    console.error(e);
  }
}

getSystemInfo();
```

## Security Advisories

Please review our [security advisories](https://github.com/ambicuity/systeminspector/security/advisories) before deploying to production environments.
