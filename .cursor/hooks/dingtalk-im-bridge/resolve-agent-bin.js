'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

function resolveAgentBin() {
  const candidates = [
    process.env.CURSOR_AGENT_BIN,
    config.cursorAgentBin,
    path.join(process.env.HOME || '', 'bin/cursor-agent'),
    path.join(process.env.HOME || '', '.local/bin/cursor-agent'),
    '/usr/local/bin/cursor-agent',
  ].filter(Boolean);
  for (const bin of candidates) {
    if (bin && fs.existsSync(bin)) return bin;
  }
  return null;
}

module.exports = { resolveAgentBin };
