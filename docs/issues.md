---
description: "Complete SystemInspector documentation and API reference for Issues. Retrieve detailed hardware and system telemetry in Node.js."
---

# Resolved Platform Notes

systeminspector now handles these platform limitations with best-effort detection, documented setup steps, and non-breaking diagnostics. When an operating system, firmware, permission level, or external tool cannot expose a value, the affected function keeps its existing result shape and records details through diagnostics().

#### macOS - Temperature

macOS does not expose CPU temperature through a stable built-in user-space API. To avoid npm optional dependency warnings on unsupported platforms, temperature sensor packages are not installed by default.

If you need macOS CPU temperature, install the package that matches your hardware:

$ npm install osx-temperature-sensor      # deprecated - for intel based machines

$ npm install macos-temperature-sensor    # for apple silicon machines

systeminspector detects the installed package lazily when calling cpuTemperature(). Apple Silicon systems prefer macos-temperature-sensor; Intel systems prefer osx-temperature-sensor. If neither package can be loaded, cpuTemperature() returns the normal empty temperature shape and records missing\_optional\_package diagnostics with the matching install command.

#### Windows Temperature, Battery, ...

Windows temperature and battery data comes from PowerShell CIM/WMI providers. Some values require administrator privileges, some firmware does not expose them, and thermal-zone data can represent ACPI zones rather than true CPU package temperature.

cpuTemperature() now tags its PowerShell call as cpuTemperature diagnostics. If Windows returns no usable thermal-zone values, systeminspector records either unsupported\_hardware or parse\_error with a recommended fix instead of failing the API call.

#### Linux Temperature

Linux temperature detection first checks /sys sensor paths, then falls back to sensors, then tries Raspberry Pi firmware helpers. On Debian or Ubuntu, install lm-sensors with:

$ sudo apt-get install lm-sensors

If all built-in Linux fallbacks fail and sensors is unavailable, systeminspector records a missing\_tool diagnostic for lm-sensors.

#### Windows, macOS - CPU Speed

node.js and Windows CIM providers are not always able to determine correct current CPU speed on Windows and macOS. This means, you may see constant values on both platforms for all processor cores in cpuCurrentSpeed(). The API keeps returning the best value exposed by the platform.

#### Linux, Windows, macOS - S.M.A.R.T. Status

To detect S.M.A.R.T. status on macOS, Windows and Linux, install smartmontools. systeminspector checks for smartctl, reports missing or outdated versions through diagnostics, and keeps diskLayout() non-breaking when the tool is unavailable.

On DEBIAN based linux distributions you can install it by running:

$ sudo apt-get install smartmontools

On macOS you can install it using brew:

$ brew install smartmontools

On windows you can download it from [https://www.smartmontools.org/](https://www.smartmontools.org/)

If you have smartmontools version >= 7.0 then you will also get full smart data in diskLayout().

#### Stats Functions

fsStats(), disksIO() and networkStats() calculate per-second values from the difference between calls. The first call returns baseline values, and later calls return rates once enough time has elapsed. See [this guide](statsfunctions.html).

#### Empty / incorrect values

If you discover empty or incorrect values, some underlying commands may need administrator or root privileges. On Linux this can affect memLayout(), advanced system(), bios(), baseboard(), cpu() information, S.M.A.R.T. status, and other hardware details. These cases should now be visible through diagnostics where the code can detect the condition.

#### Diagnostics

Use diagnostics() to inspect non-breaking diagnostic records for missing tools, permission issues, unsupported hardware, parse failures, command timeouts, encoding issues, outdated dependencies, and optional package loading failures. Use clearDiagnostics() to clear records between checks.

const si = require('@ambicuity/systeminspector');
await si.cpuTemperature();
console.log(si.diagnostics());

#### Encoding issues - Windows

Windows functions use PowerShell to avoid encoding problems with special characters. Windows 11 dropped wmic support, so PowerShell 5+ is required. Older Windows versions may still show encoding problems due to older PowerShell versions, and systeminspector records PowerShell startup, timeout, stderr, and encoding-related diagnostics when detected.

#### Finding New Issues

If you still have problems, include the relevant function result and diagnostics() output when opening an issue.