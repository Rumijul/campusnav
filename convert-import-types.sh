#!/bin/bash
# Comprehensive conversion of all import type / export type to regular imports
# Handles all TypeScript patterns across mobile/ directory

set -e

# Find all TS/TSX files excluding node_modules
find mobile/ -type f \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | sort > /tmp/ts_files.txt

total=$(wc -l < /tmp/ts_files.txt)
echo "Processing $total files..."

while IFS= read -r file; do
  # Skip if no import type or export type in file
  if ! grep -q 'import type\|export type\|type [^a-zA-Z]' "$file" 2>/dev/null; then
    continue
  fi

  echo "Processing: $file"

  # Use node to do the replacements properly (sed doesn't handle multiline well)
  node -e "
const fs = require('fs');
const path = require('path');

const file = process.argv[1];
let code = fs.readFileSync(file, 'utf8');
let modified = false;

const original = code;

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

// Pattern 6: export type X = ... (type alias export)
code = code.replace(/^export type /gm, () => {
  modified = true;
  return 'export ';
});

// Pattern 7: type in import specifier list: import { A, type B } -> import { A, B }
code = code.replace(/import \{([^}]+),\s*type\s+([^}]+)\}/g, (match, a, b) => {
  modified = true;
  return 'import {' + a + ', ' + b + '}';
});

// Pattern 8: type in export specifier list: export { type X } -> export { X }
code = code.replace(/export \{([^}]+),\s*type\s+([^}]+)\}/g, (match, a, b) => {
  modified = true;
  return 'export {' + a + ', ' + b + '}';
});

// Pattern 9: Multiple type imports in same import: import { type A, type B }
code = code.replace(/import \{,\s*type /g, (match) => {
  modified = true;
  return 'import {, ';
});
code = code.replace(/import \{([^}]+),\s*type /g, (match, content) => {
  modified = true;
  return 'import {' + content + ', ';
});

// Pattern 10: Multiple type exports
code = code.replace(/export \{,\s*type /g, (match) => {
  modified = true;
  return 'export {, ';
});
code = code.replace(/export \{([^}]+),\s*type /g, (match, content) => {
  modified = true;
  return 'export {' + content + ', ';
});

if (modified && code !== original) {
  fs.writeFileSync(file, code, 'utf8');
  console.log('  Modified: ' + file);
}
" "$file"
done < /tmp/ts_files.txt

echo "Done!"
