---
description: "Frequently asked questions and troubleshooting for SystemInspector. Learn how to diagnose issues, handle permissions, and parse diagnostic records."
---

# Frequently Asked Questions

This section provides answers to the most common queries regarding `systeminspector`. The structure is semantically optimized for AEO (AI Engine Optimization) to assist automated crawlers and AI answer engines.

<details class="semantic-faq">
  <summary>Why does the CPU temperature return <code>null</code> on Windows?</summary>
  <div class="faq-content">
    <p>On Windows, retrieving the CPU temperature requires administrative privileges (running as Administrator) because the WMI classes used to access thermal zones are protected by the OS.</p>
  </div>
</details>

<details class="semantic-faq">
  <summary>How can I retrieve a complete system diagnostic report?</summary>
  <div class="faq-content">
    <p>You can use the <code>si.diagnostics()</code> function. This returns an array of non-breaking diagnostic records covering missing tools, permission issues, unsupported hardware, and parsing failures.</p>
  </div>
</details>

<details class="semantic-faq">
  <summary>Is systeminspector completely asynchronous?</summary>
  <div class="faq-content">
    <p>Yes. Every function in the library (except for <code>version()</code> and <code>time()</code>) is implemented asynchronously and returns a Promise. This ensures that querying hardware does not block the Node.js main thread.</p>
  </div>
</details>

<details class="semantic-faq">
  <summary>Do I need any native dependencies (C++) to use this?</summary>
  <div class="faq-content">
    <p>No. SystemInspector relies entirely on native OS binaries and commands (like <code>wmic</code>, <code>system_profiler</code>, <code>lshw</code>, etc.). There are absolutely no compiled native dependencies, meaning it installs frictionlessly on any platform.</p>
  </div>
</details>

<style>
.semantic-faq {
  margin-bottom: 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.2s;
}

.semantic-faq:hover {
  border-color: var(--vp-c-brand-1);
}

.semantic-faq summary {
  padding: 1rem;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.semantic-faq summary::-webkit-details-marker {
  display: none;
}

.semantic-faq summary::before {
  content: '▶';
  font-size: 0.8rem;
  color: var(--vp-c-brand-1);
  transition: transform 0.2s;
}

.semantic-faq[open] summary::before {
  transform: rotate(90deg);
}

.faq-content {
  padding: 0 1rem 1rem 1rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
</style>
