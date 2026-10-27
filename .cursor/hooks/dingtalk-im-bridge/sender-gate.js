'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { classifyIntent, parseReqId } = require('./intent');

const CACHE_FILE = path.join(config.dirs.state, 'sender-org-cache.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function dwsArgs(tail) {
  const profile = config.dws.profile || process.env.DWS_PROFILE;
  return profile ? ['--profile', profile, ...tail] : tail;
}

function runDwsJson(args) {
  const result = spawnSync('dws', dwsArgs(args), {
    encoding: 'utf8',
    timeout: 45000,
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout || '{}');
  } catch {
    return null;
  }
}

function loadCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(map) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(map, null, 2) + '\n', 'utf8');
}

function deptNamesFromGetResult(data) {
  const rows = data?.result || [];
  const names = [];
  for (const row of rows) {
    const depts = row?.orgEmployeeModel?.depts || [];
    for (const d of depts) {
      if (d.deptName) names.push(String(d.deptName));
      if (d.deptPathName) names.push(String(d.deptPathName));
    }
  }
  return [...new Set(names)];
}

function matchCloudDelivery(deptNames) {
  const pattern = config.policy.replyDeptPattern;
  if (!pattern) return true;
  const re =
    pattern instanceof RegExp
      ? pattern
      : new RegExp(String(pattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return deptNames.some((n) => re.test(n));
}

function resolveUserId(openDingTalkId, displayName) {
  const cache = loadCache();
  const hit = cache[openDingTalkId];
  if (hit?.userId && Date.now() - (hit.checkedAt || 0) < CACHE_TTL_MS) {
    return hit.userId;
  }

  let userId = null;
  const byOpen = runDwsJson([
    'contact',
    'user',
    'get-by-open-dingtalk-id',
    '--open-dingtalk-id',
    openDingTalkId,
    '-f',
    'json',
  ]);
  if (byOpen?.userId) userId = byOpen.userId;
  if (!userId && byOpen?.result?.userId) userId = byOpen.result.userId;

  const name = String(displayName || '')
    .replace(/\(.*\)/g, '')
    .trim();
  if (!userId && name) {
    const search = runDwsJson([
      'contact',
      'user',
      'search',
      '--query',
      name,
      '-f',
      'json',
    ]);
    const list = search?.result || [];
    const row =
      list.find((u) => u.openDingTalkId === openDingTalkId) || list[0] || null;
    if (row?.userId) userId = row.userId;
  }

  if (userId) {
    cache[openDingTalkId] = {
      userId,
      displayName: name,
      checkedAt: Date.now(),
    };
    saveCache(cache);
  }
  return userId;
}

function resolveDeptNames(openDingTalkId, displayName) {
  if (!openDingTalkId) return [];
  const cache = loadCache();
  const hit = cache[openDingTalkId];
  if (hit?.deptNames?.length && Date.now() - (hit.checkedAt || 0) < CACHE_TTL_MS) {
    return hit.deptNames;
  }

  const userId = resolveUserId(openDingTalkId, displayName);
  if (!userId) return [];

  const detail = runDwsJson([
    'contact',
    'user',
    'get',
    '--user-id',
    String(userId),
    '-f',
    'json',
  ]);
  const deptNames = deptNamesFromGetResult(detail);
  cache[openDingTalkId] = {
    ...(cache[openDingTalkId] || {}),
    userId,
    deptNames,
    checkedAt: Date.now(),
  };
  saveCache(cache);
  return deptNames;
}

function isCloudDeliverySender(openDingTalkId, displayName) {
  if (!config.policy.gateCloudDeliveryDept) return true;
  const depts = resolveDeptNames(openDingTalkId, displayName);
  if (!depts.length) {
    return { ok: false, reason: '无法解析提问者部门，默认不回复' };
  }
  if (!matchCloudDelivery(depts)) {
    return {
      ok: false,
      reason: `非云交付部门（${depts.join(' / ')}）`,
    };
  }
  return { ok: true, depts };
}

function isWorkRequirement(text, intent, conv, job) {
  if (!config.policy.gateWorkOnly) return true;
  if (conv?.phase !== 'idle' && conv?.jobId && job) {
    return true;
  }
  if (intent === 'DIP' || intent === 'NEW_FEATURE') return true;
  if (parseReqId(text)) return true;
  if (intent === 'HANDLE') {
    return (
      config.dipKeywords.test(text) ||
      config.featureKeywords.test(text) ||
      /接口|YURUN_|DIP|Spec|编码|联调|发布|tmsdemo/i.test(text)
    );
  }
  if (/YJ2RQ|RJ2RQ/i.test(text)) return true;
  return false;
}

/**
 * @returns {Promise<{ allow: boolean, reason?: string }>}
 */
async function evaluateInbound(evt, conv, job) {
  const openId = evt.sender_open_dingtalk_id;
  const displayName = evt.sender || '';
  const text = String(evt.content || '').trim();
  const intent = classifyIntent(text);

  const dept = isCloudDeliverySender(openId, displayName);
  if (!dept.ok) {
    return { allow: false, reason: dept.reason };
  }

  if (!isWorkRequirement(text, intent, conv, job)) {
    return {
      allow: false,
      reason: `非开发/需求类消息（intent=${intent}）`,
    };
  }

  return { allow: true, intent, depts: dept.depts };
}

module.exports = {
  evaluateInbound,
  isCloudDeliverySender,
  isWorkRequirement,
  resolveDeptNames,
};
