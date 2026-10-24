/**
 * stop：读取 pending-reply.json，经 dws 回钉钉；READY_CODE 续跑 flag。
 */
const fs = require('fs');
const path = require('path');
const { sendPendingReply } = require('./dingtalk-im-bridge/send-pending-reply');

const codeFlag = path.join(__dirname, 'dingtalk-code.flag');

function readStdin() {
  if (process.stdin.isTTY) return '';
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  readStdin();
  const out = {};
  sendPendingReply();

  if (fs.existsSync(codeFlag)) {
    const jobHint = fs.readFileSync(codeFlag, 'utf8').trim();
    out.followup_message =
      '【钉钉工单·自动续跑】请按 AGENT-PROMPTS READY_CODE 编码；或等待 run-auto-agent 链式任务。jobId=' +
      jobHint;
    fs.unlinkSync(codeFlag);
  }

  process.stdout.write(JSON.stringify(out));
}

main();
