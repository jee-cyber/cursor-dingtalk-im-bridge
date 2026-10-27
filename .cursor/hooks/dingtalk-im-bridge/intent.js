'use strict';

const config = require('./config');

function parseReqId(text) {
  const m = text.match(config.reqIdPattern);
  return m ? m[0].toUpperCase() : null;
}

function classifyIntent(text) {
  const hasReq = !!parseReqId(text);
  if (config.dipKeywords.test(text) && !hasReq) {
    return 'DIP';
  }
  if (hasReq || config.featureKeywords.test(text)) {
    return 'NEW_FEATURE';
  }
  if (config.handleKeywords.test(text)) {
    return 'HANDLE';
  }
  return 'GENERAL';
}

module.exports = { classifyIntent, parseReqId };
