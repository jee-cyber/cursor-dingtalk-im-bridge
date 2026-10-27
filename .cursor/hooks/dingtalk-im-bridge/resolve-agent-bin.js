'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

function latestVersionDir(versionsRoot) {
  if (!versionsRoot || !fs.existsSync(versionsRoot)) return null;
  const names = fs
    .readdirSync(versionsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '.tmp-install')
    .map((d) => d.name)
    .sort()
    .reverse();
  for (const name of names) {
    const exe = path.join(versionsRoot, name, 'cursor-agent.exe');
    const bin = path.join(versionsRoot, name, 'cursor-agent');
    if (fs.existsSync(exe)) return exe;
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}

function resolveAgentBin() {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const localApp = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');

  const versionCandidates = [
    path.join(home, '.cursor', 'cursor-agent', 'versions'),
    path.join(localApp, 'cursor-agent', 'versions'),
  ];

  const candidates = [
    process.env.CURSOR_AGENT_BIN,
    config.cursorAgentBin,
    path.join(home, 'bin', 'cursor-agent'),
    path.join(home, 'bin', 'cursor-agent.exe'),
    path.join(home, '.local', 'bin', 'cursor-agent'),
    path.join(home, '.local', 'bin', 'cursor-agent.exe'),
    process.platform === 'win32' ? path.join(localApp, 'Programs', 'cursor-agent', 'cursor-agent.exe') : null,
    '/usr/local/bin/cursor-agent',
    ...versionCandidates.map(latestVersionDir),
  ].filter(Boolean);

  for (const bin of candidates) {
    if (bin && fs.existsSync(bin)) return bin;
  }
  return null;
}

module.exports = { resolveAgentBin };
