#!/usr/bin/env node
'use strict';

/**
 * 本地 E2E：模拟入站消息 → router → dws 回复（发到你本人 openDingTalkId）。
 * 不经过真实 @我 订阅，用于验证路由与发送链路。
 */

const fs = require('fs');
const path = require('path');
const { handleMessage, classifyIntent } = require('./router');
const { sendText } = require('./reply');
const store = require('./store');

const SELF_OPEN_ID = 'D3YJQUBtHlSuqq3NKc8LbuGVsXbB2V3zC';
const FAKE_SENDER = 'D_FAKE_SENDER_E2E_TEST_001';
const results = [];

function log(name, ok, detail) {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  process.stderr.write(`[${mark}] ${name}: ${detail}\n`);
}

async function runScenario(name, text, listenKind, channel) {
  const eventId = `e2e-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const evt = {
    type: 'message',
    event_id: eventId,
    message_id: eventId + '-msg',
    conversation_id: channel === 'group' ? 'cid_e2e_test_group' : undefined,
    sender_open_dingtalk_id: FAKE_SENDER,
    sender: 'E2E测试同事',
    content: text,
  };
  const intent = classifyIntent(text);
  const replies = await handleMessage(evt, listenKind);
  if (!replies || !replies.length) {
    log(name, false, 'router 无回复');
    return;
  }
  const sent = [];
  for (const r of replies) {
    const target =
      channel === 'direct'
        ? { channel: 'direct', sender_open_dingtalk_id: SELF_OPEN_ID, text: r.text }
        : { channel: 'direct', sender_open_dingtalk_id: SELF_OPEN_ID, text: `[模拟群${listenKind}] ${r.text}` };
    const out = sendText(target);
    sent.push({ text: r.text.slice(0, 60), ok: out.ok, error: out.error });
  }
  log(name, sent.every((s) => s.ok), `intent=${intent} replies=${sent.length} ${JSON.stringify(sent)}`);
}

async function main() {
  store.ensureDirs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(__dirname, 'state', `conversations.backup-${stamp}.json`);
  const convFile = path.join(__dirname, 'state', 'conversations.json');
  if (fs.existsSync(convFile)) {
    fs.copyFileSync(convFile, backup);
  }

  await runScenario('general_ack', '在吗', 'all-direct', 'direct');
  await runScenario('dip_s4', 'LE009 S4 401 帮忙看下', 'all-direct', 'direct');
  await runScenario(
    'new_feature_req',
    'YJ2RQ202610223704 运单撤销优化 请开发',
    'at-me',
    'group'
  );

  const jobs = fs.readdirSync(path.join(__dirname, 'inbox')).filter((f) => f.endsWith('.json'));
  const wake = fs.existsSync(path.join(__dirname, '..', 'dingtalk-agent-wake.flag'));
  log('inbox_jobs', jobs.length >= 1, jobs.join(', ') || 'empty');
  log('agent_wake_flag', wake, wake ? fs.readFileSync(path.join(__dirname, '..', 'dingtalk-agent-wake.flag'), 'utf8').trim() : 'missing');

  process.stdout.write(JSON.stringify({ results, jobs }, null, 2) + '\n');
  const failed = results.filter((r) => !r.ok);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(err.stack + '\n');
  process.exit(1);
});
