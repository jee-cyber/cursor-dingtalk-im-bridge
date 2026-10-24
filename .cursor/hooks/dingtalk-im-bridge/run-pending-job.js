#!/usr/bin/env node
'use strict';

/** 手动或 bridge 唤醒后：生成完整 Agent 提示词并复制到剪贴板 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const store = require('./store');
const { writePromptFiles } = require('./build-agent-prompt');
const config = require('./config');

const flagPath = path.join(__dirname, '..', 'dingtalk-agent-wake.flag');

function main() {
  const jobId = process.argv[2] || (fs.existsSync(flagPath) ? fs.readFileSync(flagPath, 'utf8').trim() : '');
  if (!jobId) {
    console.error('用法: node run-pending-job.js [jobId]');
    process.exit(1);
  }
  const job = store.readJob(jobId);
  if (!job) {
    console.error('找不到 job:', jobId);
    process.exit(1);
  }
  const prompt = writePromptFiles(job);
  spawnSync('pbcopy', { input: prompt });
  spawnSync('open', ['-a', 'Cursor', config.aiWorkflowRoot]);
  if (process.platform === 'darwin') {
    spawnSync(
      'osascript',
      [
        '-e',
        'display notification "提示词已复制。New Agent 选 Composer 2.5 后 Cmd+V 发送" with title "钉钉工单 ' +
          jobId +
          '"',
      ],
      { stdio: 'ignore' }
    );
  }
  console.log('jobId:', jobId);
  console.log('phase:', job.phase);
  console.log('已写入 .cursor/hooks/dingtalk-auto-prompt.md 并复制到剪贴板');
}

main();
