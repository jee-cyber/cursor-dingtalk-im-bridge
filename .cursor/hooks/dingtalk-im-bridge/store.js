'use strict';

const fs = require('fs');
const path = require('path');
const { dirs } = require('./config');

function ensureDirs() {
  for (const dir of Object.values(dirs)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function conversationKey(evt) {
  return evt.conversation_id || evt.sender_open_dingtalk_id || 'unknown';
}

function loadJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function loadConversations() {
  return loadJson(path.join(dirs.state, 'conversations.json'), {});
}

function saveConversations(map) {
  saveJson(path.join(dirs.state, 'conversations.json'), map);
}

function loadSeen() {
  return loadJson(path.join(dirs.state, 'seen-events.json'), {});
}

function saveSeen(map) {
  const keys = Object.keys(map);
  if (keys.length > 5000) {
    keys.sort();
    map = Object.fromEntries(keys.slice(-3000).map((k) => [k, map[k]]));
  }
  saveJson(path.join(dirs.state, 'seen-events.json'), map);
}

function writeJob(job) {
  ensureDirs();
  const file = path.join(dirs.inbox, `${job.jobId}.json`);
  saveJson(file, job);
  return file;
}

function readJob(jobId) {
  return loadJson(path.join(dirs.inbox, `${jobId}.json`), null);
}

function listPendingJobs() {
  ensureDirs();
  const files = fs.readdirSync(dirs.inbox).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => loadJson(path.join(dirs.inbox, f), null))
    .filter(Boolean)
    .sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''));
}

function appendAgentWake(record) {
  ensureDirs();
  const line = JSON.stringify({ ...record, at: new Date().toISOString() }) + '\n';
  fs.appendFileSync(path.join(dirs.state, 'agent-wake.jsonl'), line, 'utf8');
  fs.writeFileSync(path.join(__dirname, '..', 'dingtalk-agent-wake.flag'), record.jobId + '\n', 'utf8');
}

function clearConversationForJob(job) {
  const conversations = loadConversations();
  const key = job.conversation_id || job.sender_open_dingtalk_id;
  if (key && conversations[key]?.jobId === job.jobId) {
    conversations[key] = { phase: 'idle', jobId: null };
    saveConversations(conversations);
  }
}

function clearAgentWakeFlag() {
  const flag = path.join(__dirname, '..', 'dingtalk-agent-wake.flag');
  if (fs.existsSync(flag)) fs.unlinkSync(flag);
}

module.exports = {
  ensureDirs,
  conversationKey,
  loadConversations,
  saveConversations,
  loadSeen,
  saveSeen,
  writeJob,
  readJob,
  listPendingJobs,
  appendAgentWake,
  clearConversationForJob,
  clearAgentWakeFlag,
};
