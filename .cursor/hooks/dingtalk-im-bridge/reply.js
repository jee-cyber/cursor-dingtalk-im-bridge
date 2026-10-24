'use strict';

const { spawnSync } = require('child_process');

/**
 * @param {{ channel: 'group'|'direct', conversation_id?: string, sender_open_dingtalk_id?: string, text: string }} target
 */
function sendText(target) {
  const tail = ['chat', '+messages-send', '--as', 'user', '-y', '--text', target.text];
  if (target.channel === 'group' && target.conversation_id) {
    tail.push('--group', target.conversation_id);
  } else if (target.sender_open_dingtalk_id) {
    tail.push('--open-dingtalk-id', target.sender_open_dingtalk_id);
  } else {
    return { ok: false, error: 'missing reply target' };
  }

  const profile = process.env.DWS_PROFILE;
  const args = profile ? ['--profile', profile, ...tail] : tail;

  const result = spawnSync('dws', args, {
    encoding: 'utf8',
    env: process.env,
    timeout: 120000,
  });

  if (result.error) {
    return { ok: false, error: result.error.message };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      error: (result.stderr || result.stdout || '').trim() || `exit ${result.status}`,
    };
  }
  return { ok: true, stdout: (result.stdout || '').trim() };
}

module.exports = { sendText };
