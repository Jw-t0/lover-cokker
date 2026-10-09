const test = require('node:test');
const assert = require('node:assert/strict');
const { withTimeout } = require('../miniprogram/utils/async');

test('withTimeout rejects when the operation takes too long', async () => {
  await assert.rejects(
    withTimeout(new Promise(() => {}), 5, '菜单加载超时'),
    /菜单加载超时/
  );
});

test('withTimeout resolves when the operation finishes in time', async () => {
  const result = await withTimeout(Promise.resolve('ok'), 50, '菜单加载超时');

  assert.equal(result, 'ok');
});
