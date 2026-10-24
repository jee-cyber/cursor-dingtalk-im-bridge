/**
 * sessionStart：若有钉钉工单唤醒标记，注入 Agent 上下文。
 */
const fs = require('fs');
const path = require('path');

const bridgeDir = path.join(__dirname, 'dingtalk-im-bridge');
const flagPath = path.join(__dirname, 'dingtalk-agent-wake.flag');
const promptsPath = path.join(bridgeDir, 'AGENT-PROMPTS.md');

function readStdin() {
  if (process.stdin.isTTY) return '';
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function loadJob(jobId) {
  const file = path.join(bridgeDir, 'inbox', `${jobId}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const raw = readStdin().trim();
  if (!raw.startsWith('{')) {
    process.stdout.write('{}');
    return;
  }

  if (!fs.existsSync(flagPath)) {
    process.stdout.write('{}');
    return;
  }

  const jobId = fs.readFileSync(flagPath, 'utf8').trim();
  const job = loadJob(jobId);
  if (!job) {
    process.stdout.write('{}');
    return;
  }

  const prompts = fs.existsSync(promptsPath)
    ? fs.readFileSync(promptsPath, 'utf8')
    : '见 dingtalk-im-bridge/AGENT-PROMPTS.md';

  const ctx = [
    '【钉钉工单】默认模型 Composer 2.5。本回合优先处理以下 inbox 任务（无需再等用户输入，直接开始执行；完成后更新 job.phase 并写 pending-reply.json）：',
    '```json',
    JSON.stringify(job, null, 2),
    '```',
    '执行说明摘要：',
    prompts.slice(0, 4000),
  ].join('\n');

  const payload = { additional_context: ctx };
  fs.writeFileSync(path.join(__dirname, 'dingtalk-last-inject.txt'), ctx.slice(0, 12000), 'utf8');
  process.stdout.write(JSON.stringify(payload));
}

main();
