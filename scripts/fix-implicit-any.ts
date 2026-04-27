#!/usr/bin/env node
/**
 * Automated fixer for TS7006 (Parameter implicitly has 'any' type).
 * 
 * Strategy: Parse tsc output for TS7006 errors, then for each error,
 * find the parameter name in the source line and add `: any` after it.
 * 
 * This handles:
 *   function foo(callback)     -> function foo(callback: any)
 *   (error, stdout)            -> (error: any, stdout: any)
 *   .then((res) =>             -> .then((res: any) =>
 *   .forEach((line) =>         -> .forEach((line: any) =>
 */

import * as fs from 'fs';
import * as child_process from 'child_process';

interface TsError {
  file: string;
  line: number;
  col: number;
  paramName: string;
}

function parseTscOutput(output: string): TsError[] {
  const errors: TsError[] = [];
  const regex = /^(src\/\S+\.ts)\((\d+),(\d+)\): error TS7006: Parameter '(\w+)' implicitly has an 'any' type\./gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(output)) !== null) {
    errors.push({
      file: match[1],
      line: parseInt(match[2], 10),
      col: parseInt(match[3], 10),
      paramName: match[4]
    });
  }
  return errors;
}

function fixFile(filePath: string, fileErrors: TsError[]): number {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fixCount = 0;

  // Group errors by line number, process in reverse order to preserve column positions
  const errorsByLine = new Map<number, TsError[]>();
  for (const err of fileErrors) {
    const lineErrors = errorsByLine.get(err.line) || [];
    lineErrors.push(err);
    errorsByLine.set(err.line, lineErrors);
  }

  for (const [lineNum, lineErrors] of errorsByLine) {
    const lineIdx = lineNum - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;

    let line = lines[lineIdx];
    
    // Sort errors by column in reverse order (right to left) to preserve positions
    const sorted = lineErrors.sort((a, b) => b.col - a.col);
    
    for (const err of sorted) {
      // Find the parameter name at approximately the right column
      // Look for the pattern: paramName followed by , or ) or = but NOT already followed by :
      const paramRegex = new RegExp(
        `(\\b${err.paramName})(\\s*[,)=])`,
        'g'
      );
      
      let replaced = false;
      line = line.replace(paramRegex, (match, name, after, offset) => {
        // Check if there's already a type annotation
        if (replaced) return match;
        // Check the character after the name to make sure it's not already typed
        const beforeAfter = line.substring(offset + name.length).trimStart();
        if (beforeAfter.startsWith(':')) return match;
        
        replaced = true;
        fixCount++;
        return `${name}: any${after}`;
      });
    }
    
    lines[lineIdx] = line;
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return fixCount;
}

// Main
const tscOutput = child_process.execSync(
  'npx tsc --noEmit --noImplicitAny 2>&1 || true',
  { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
);

const errors = parseTscOutput(tscOutput);
console.log(`Found ${errors.length} TS7006 errors`);

// Group by file
const errorsByFile = new Map<string, TsError[]>();
for (const err of errors) {
  const fileErrors = errorsByFile.get(err.file) || [];
  fileErrors.push(err);
  errorsByFile.set(err.file, fileErrors);
}

let totalFixed = 0;
for (const [file, fileErrors] of errorsByFile) {
  const fixed = fixFile(file, fileErrors);
  console.log(`  ${file}: ${fixed}/${fileErrors.length} params annotated`);
  totalFixed += fixed;
}

console.log(`\nTotal: ${totalFixed} parameters annotated with ': any'`);
