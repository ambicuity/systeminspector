#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const esmDir = path.resolve(__dirname, '..', 'dist', 'esm');

fs.writeFileSync(path.join(esmDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2) + '\n');

const importRe = /(\bfrom\s+['"]|\bimport\s*\(\s*['"])(\.\.?\/[^'"\n]+?)(['"])/g;

function rewrite(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const out = src.replaceAll(importRe, (_, prefix, spec, quote) => {
    if (/\.(?:js|mjs|cjs|json|node)$/.test(spec)) {
      return prefix + spec + quote;
    }
    const abs = path.resolve(path.dirname(filePath), spec);
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      return prefix + spec + '/index.js' + quote;
    }
    return prefix + spec + '.js' + quote;
  });
  if (out !== src) {
    fs.writeFileSync(filePath, out);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name.endsWith('.js')) {
      rewrite(full);
    }
  }
}

walk(esmDir);
