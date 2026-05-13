#!/usr/bin/env node
/**
 * kill-port.js — Kill any process occupying a given port.
 * Usage: node scripts/kill-port.js <port>
 * Used by npm scripts to prevent EADDRINUSE errors when restarting the dev server.
 */
import { execSync } from 'child_process';

const port = parseInt(process.argv[2], 10);
if (isNaN(port) || port < 1 || port > 65535) {
  console.error(`kill-port: invalid port "${process.argv[2]}"`);
  process.exit(1);
}

try {
  // Windows: netstat -ano gives PID as last column
  const output = execSync(
    `netstat -ano | findstr :${port} | findstr LISTENING`,
    { encoding: 'utf8', windowsHide: true }
  );

  const lines = output.trim().split('\n').filter(Boolean);
  const pids = new Set();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  if (pids.size === 0) {
    console.log(`kill-port: nothing listening on :${port}`);
    process.exit(0);
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { windowsHide: true });
      console.log(`kill-port: killed PID ${pid} on :${port}`);
    } catch {
      // Process may have already exited
    }
  }
} catch {
  // No output from netstat = nothing on that port
  console.log(`kill-port: nothing listening on :${port}`);
}
