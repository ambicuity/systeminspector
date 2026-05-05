# OpenTelemetry Bridge Example

This example shows how to map SystemInspector outputs into OpenTelemetry-style metric payloads without adding runtime dependencies to SystemInspector.

```js
const si = require('@ambicuity/systeminspector');

async function collectHostMetrics() {
  const [cpu, mem, fs, net] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats()
  ]);

  return [
    { name: 'host.cpu.load', value: cpu.currentLoad || 0, unit: '%' },
    { name: 'host.memory.used', value: mem.used || 0, unit: 'By' },
    { name: 'host.filesystem.used', value: fs.reduce((sum, d) => sum + (d.used || 0), 0), unit: 'By' },
    { name: 'host.network.rx_bytes', value: net.reduce((sum, n) => sum + (n.rx_bytes || 0), 0), unit: 'By' }
  ];
}
```

Use SystemInspector for local host facts and command-level diagnostics. Use the OTel Collector `hostmetrics` receiver for fleet-wide managed collection pipelines.
