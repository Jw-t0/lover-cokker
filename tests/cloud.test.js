const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCloudError } = require('../miniprogram/services/cloud');

test('extracts readable business message from cloud function errors', () => {
  const error = new Error(
    'cloud.callFunction:fail Error: errCode: -1 | errMsg: cloud.callFunction:fail Error: 上一单还在制作中，先等等厨师吧'
  );

  assert.equal(normalizeCloudError(error).message, '上一单还在制作中，先等等厨师吧');
});

test('maps missing cloud user to an actionable login hint', () => {
  const error = new Error('cloud.callFunction:fail Error: USER_NOT_FOUND');

  assert.equal(normalizeCloudError(error).message, '云端用户还没初始化，请进入“我的”页刷新后再试');
});

test('maps devtools cloud security failures to an environment hint', () => {
  const error = new Error('cloud.callFunction:fail Error (trace: system error (Error), retry, abort) webapi_getwxaasyncsecinfo:fail');

  assert.equal(normalizeCloudError(error).message, '云开发初始化失败，请确认当前项目 AppID 与云环境 envId 匹配后重新编译');
});

test('does not claim login is missing for generic cloud timeouts', () => {
  const error = new Error('cloud.callFunction:fail Error (trace: system error (Error), retry, abort)');

  assert.equal(normalizeCloudError(error).message, '云调用失败，请检查云开发环境、网络状态后再试');
});
