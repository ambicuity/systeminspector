#!/usr/bin/env node
/**
 * Fix TS7005/TS7034: Add type annotations to untyped variable declarations.
 * 
 * Approach: Find all `let/const/var x = []` and `let/const/var x = {}` 
 * patterns across all .ts files that don't already have type annotations,
 * and add `: any[]` or `: any` respectively.
 */

import * as fs from 'fs';
import * as path from 'path';

const srcDir = path.resolve('src');

function processFile(filePath: string): number {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fixCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 1: let/const/var x = [] (untyped empty array)
    const arrMatch = line.match(/^(\s*(?:let|const|var)\s+\w+)\s*=\s*\[\s*\]\s*;/);
    if (arrMatch) {
      const decl = arrMatch[1];
      // Check if already typed
      if (!decl.includes(':')) {
        lines[i] = line.replace(
          /^(\s*(?:let|const|var)\s+\w+)\s*=\s*\[\s*\]\s*;/,
          '$1: any[] = [];'
        );
        fixCount++;
      }
    }

    // Pattern 2: let/const/var x = {} (untyped empty object) — skip if already Record<>
    const objMatch = line.match(/^(\s*(?:let|const|var)\s+\w+)\s*=\s*\{\s*\}\s*;/);
    if (objMatch) {
      const decl = objMatch[1];
      if (!decl.includes(':')) {
        lines[i] = line.replace(
          /^(\s*(?:let|const|var)\s+\w+)\s*=\s*\{\s*\}\s*;/,
          '$1: Record<string, any> = {};'
        );
        fixCount++;
      }
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }
  return fixCount;
}

// Process all .ts files in src/
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.ts'));
let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(srcDir, file);
  const fixed = processFile(filePath);
  if (fixed > 0) {
    console.log(`  ${file}: ${fixed} declarations annotated`);
  }
  totalFixed += fixed;
}

console.log(`\nTotal: ${totalFixed} variable declarations annotated`);
