'use strict';

const os = require('os');
const path = require('path');

/** 统一日志目录：macOS ~/Library/Logs/…；Windows %LOCALAPPDATA%\… */
function resolveLogDir() {
  if (process.env.DINGTALK_LOG_DIR) {
    return process.env.DINGTALK_LOG_DIR;
  }
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(base, 'cursor-dingtalk-bridge', 'logs');
  }
  return path.join(os.homedir(), 'Library', 'Logs', 'cursor-dingtalk-bridge');
}

module.exports = { resolveLogDir };
