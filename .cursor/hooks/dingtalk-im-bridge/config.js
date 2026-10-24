'use strict';

const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');

module.exports = {
  aiWorkflowRoot: root,
  /** 过滤自己发出的消息，避免回复死循环（可 env 覆盖） */
  /** 安装后必填：dws 身份 openDingTalkId，防回复死循环 */
  selfOpenDingTalkId: process.env.DINGTALK_SELF_OPEN_ID || '',
  cursorBin:
    process.env.CURSOR_CLI ||
    '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
  /** FULL_AUTO：入队后 detached 跑 cursor-agent --print */
  fullAuto: process.env.DINGTALK_FULL_AUTO !== '0',
  fullAutoTimeoutMs: Number(process.env.DINGTALK_AGENT_TIMEOUT_MS || 900000),
  /** cursor-agent 模型（与 --list-models 一致） */
  agentModel: process.env.DINGTALK_AGENT_MODEL || 'composer-2.5',
  cursorAgentBin: process.env.CURSOR_AGENT_BIN || '',
  dirs: {
    state: path.join(__dirname, 'state'),
    inbox: path.join(__dirname, 'inbox'),
    media: path.join(__dirname, 'media'),
  },
  /** 群聊也允许自动编码；复杂澄清改走单聊 */
  policy: {
    autoCodeInGroup: true,
    /** 澄清问题超过该条数，或 Agent 标记 complexClarify 时改单聊提问 */
    complexClarifyQuestionThreshold: 3,
    /** 单聊里仍可直接澄清，不必再转通道 */
    directClarifyInPlace: true,
  },
  reqIdPattern: /(YJ2RQ|RJ2RQ)\d+/gi,
  dipKeywords: /DIP|tmsdemo|S4|ECC|YURUN_LE|模拟|发布|接口配置|出站|管道|SAP|PO\b|401|会话失效|字段约束/i,
  featureKeywords: /新功能|新需求|开发|需求|页面|字段|流程|导出|优化|改造|YJ2RQ|RJ2RQ/i,
  handleKeywords: /处理|排查|修|问题|报错|失败|帮忙|看一下/i,
  ackText: '已收到，我看一下。',
  templates: {
    askReqId:
      '这是 TMS 新功能类需求的话，请先给需求编号（如 YJ2RQ202610223704）和一句话名称。若是 S4/ECC 接口配置问题，请回复 S4 或 ECC，并带上接口编码或报错原文。',
    askSystem: '请确认是 S4 还是 ECC 相关？回复 S4 或 ECC，并补充接口编码或报错信息。',
    queuedAgent: (jobId) =>
      `已入队（${jobId}），我会在 Cursor 里按 Spec/Skill 处理；有结论会在本对话或单聊回复你。`,
    complexClarifyIntro: (reqId) =>
      `【${reqId || '需求'}】有几项需要和你单独确认，后续几条我会私信你，群里先不展开细节。`,
  },
  dws: {
    listenFormat: ['-f', 'ndjson'],
    profile: process.env.DWS_PROFILE || '',
  },
};
