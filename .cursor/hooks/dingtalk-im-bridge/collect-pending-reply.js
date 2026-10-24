'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

const pendingPath = path.join(__dirname, 'pending-reply.json');

function docsCandidates(jobId) {
  const base = path.join(config.aiWorkflowRoot, 'docs');
  const hits = [];
  if (!fs.existsSync(base)) return hits;
  const stack = [base];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) stack.push(p);
      else if (name === `pending-reply-${jobId}.json`) hits.push(p);
    }
  }
  return hits;
}

/** 将 Agent 落错位置的 pending-reply 收拢到标准路径 */
function collectPendingReply(jobId) {
  if (fs.existsSync(pendingPath)) return pendingPath;
  for (const src of docsCandidates(jobId)) {
    try {
      fs.copyFileSync(src, pendingPath);
      return pendingPath;
    } catch {
      /* try next */
    }
  }
  return null;
}

module.exports = { collectPendingReply, pendingPath, docsCandidates };
