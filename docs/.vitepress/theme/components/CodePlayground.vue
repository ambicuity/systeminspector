<script setup lang="ts">
import { ref } from 'vue'

const isRunning = ref(false)
const output = ref<string | null>(null)

const runCode = () => {
  if (isRunning.value) return
  isRunning.value = true
  output.value = null
  
  // Simulate execution delay
  setTimeout(() => {
    output.value = `{
  "manufacturer": "Apple Inc.",
  "model": "MacBookPro15,2",
  "version": "1.0",
  "serial": "C02...",
  "uuid": "4C4C4544-00..."
}`
    isRunning.value = false
  }, 600)
}

const copyCode = () => {
  navigator.clipboard.writeText(`const si = require('systeminspector');

si.system()
  .then(data => console.log(data))
  .catch(error => console.error(error));`)
}
</script>

<template>
  <div class="playground-wrapper">
    <div class="playground-header">
      <div class="window-controls">
        <span class="control red"></span>
        <span class="control yellow"></span>
        <span class="control green"></span>
      </div>
      <div class="window-title">systeminspector - execution environment</div>
    </div>
    <div class="playground-body">
      <div class="editor-pane">
        <div class="code-line"><span class="keyword">const</span> si = <span class="builtin">require</span>(<span class="string">'systeminspector'</span>);</div>
        <br>
        <div class="code-line">si.system()</div>
        <div class="code-line">  .<span class="method">then</span>(data => <span class="builtin">console</span>.log(data))</div>
        <div class="code-line">  .<span class="method">catch</span>(error => <span class="builtin">console</span>.error(error));</div>
      </div>
      <div class="actions">
        <button class="action-btn" @click="copyCode" title="Copy Source">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="action-btn primary" @click="runCode" :disabled="isRunning">
          <svg v-if="!isRunning" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span v-else class="spinner"></span>
          Run
        </button>
      </div>
    </div>
    <div class="playground-terminal" v-if="output">
      <div class="terminal-header">Output</div>
      <pre><code>{{ output }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.playground-wrapper {
  margin: 2rem 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-border);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  background-color: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-mono);
}

.playground-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.window-controls {
  display: flex;
  gap: 8px;
}

.control {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.control.red { background-color: #ff5f56; }
.control.yellow { background-color: #ffbd2e; }
.control.green { background-color: #27c93f; }

.window-title {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin-right: 44px; /* to offset the controls and keep text centered */
}

.playground-body {
  position: relative;
  padding: 1.5rem;
  background-color: #0d0d0d;
  color: #f8f8f2;
}

.code-line {
  font-size: 0.9rem;
  line-height: 1.5;
}

.keyword { color: #ff79c6; }
.builtin { color: #8be9fd; }
.string { color: #f1fa8c; }
.method { color: #50fa7b; }

.actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.action-btn.primary {
  background-color: var(--vp-c-brand-2);
  border-color: var(--vp-c-brand-1);
}

.action-btn.primary:hover {
  background-color: var(--vp-c-brand-1);
}

.playground-terminal {
  background-color: #000;
  border-top: 1px dashed var(--vp-c-divider);
}

.terminal-header {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.03);
}

.playground-terminal pre {
  margin: 0;
  padding: 1rem;
  color: #50fa7b;
  font-size: 0.85rem;
  overflow-x: auto;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Light mode specific overrides for the editor */
.vp-doc .playground-wrapper {
  color: var(--vp-c-text-1);
}
</style>
