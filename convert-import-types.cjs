#!/usr/bin/env node
/**
 * Comprehensive conversion of all import type / export type to regular imports
 * Handles all TypeScript patterns across mobile/ directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all TS/TSX files excluding node_modules
function findTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    if (entry.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function convertFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  const original = code;
  let modified = false;

  // Pattern 1: import type { X, Y, Z } from '...'
  code = code.replace(/import type \{([^}]+)\}/g, (match, content) => {
    modified = true;
    return 'import {' + content + '}';
  });

  // Pattern 2: import type X from '...'
  code = code.replace(/import type (\S+) from/g, (match, name) => {
    modified = true;
    return 'import ' + name + ' from';
  });

  // Pattern 3: import type { X } as Y from '...'
  code = code.replace(/import type \{([^}]+)\}\s+as\s+\S+\s+from/g, (match, content) => {
    modified = true;
    return 'import {' + content + '}';
  });

  // Pattern 4: export type { X, Y, Z }
  code = code.replace(/export type \{([^}]+)\}/g, (match, content) => {
    modified = true;
    return 'export {' + content + '}';
  });

  // Pattern 5: export type X from '...'
  code = code.replace(/export type (\S+) from/g, (match, name) => {
    modified = true;
    return 'export ' + name + ' from';
  });

  // Pattern 6: export type X = ... (type alias export at start of line)
  code = code.replace(/^export type /gm, () => {
    modified = true;
    return 'export ';
  });

  // Pattern 7: import { A, type B } -> import { A, B }
  code = code.replace(/import \{([^}]+),\s*type\s+([^}]+)\}/g, (match, a, b) => {
    modified = true;
    return 'import {' + a + ', ' + b + '}';
  });

  // Pattern 8: export { type X } -> export { X }
  code = code.replace(/export \{([^}]+),\s*type\s+([^}]+)\}/g, (match, a, b) => {
    modified = true;
    return 'export {' + a + ', ' + b + '}';
  });

  // Pattern 9: import {, type X }
  code = code.replace(/import \{,\s*type\s+/g, (match) => {
    modified = true;
    return 'import {, ';
  });

  // Pattern 10: export {, type X }
  code = code.replace(/export \{,\s*type\s+/g, (match) => {
    modified = true;
    return 'export {, ';
  });

  // Pattern 11: import { type X, type Y } or mixed
  code = code.replace(/import \{([^}]+),\s*type\s+/g, (match, content) => {
    modified = true;
    return 'import {' + content + ', ';
  });

  // Pattern 12: export { type X, type Y } or mixed
  code = code.replace(/export \{([^}]+),\s*type\s+/g, (match, content) => {
    modified = true;
    return 'export {' + content + ', ';
  });

  if (modified && code !== original) {
    fs.writeFileSync(filePath, code, 'utf8');
    return true;
  }
  return false;
}

// Find all files
const mobileDir = path.join(__dirname, 'mobile');
const files = findTsFiles(mobileDir);
console.log(`Found ${files.length} TypeScript files`);

let modifiedCount = 0;
for (const file of files) {
  const relPath = path.relative(__dirname, file);
  if (convertFile(file)) {
    console.log(`Modified: ${relPath}`);
    modifiedCount++;
  }
}

console.log(`\nTotal files modified: ${modifiedCount}`);
