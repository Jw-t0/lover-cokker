const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('chef desk does not expose irreversible full-order deletion in the normal workflow', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');

  assert.doesNotMatch(wxml, /清空所有订单/);
  assert.doesNotMatch(js, /clearAllOrders/);
});

test('clear orders is locked unless an explicit development switch is enabled', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/clearOrders/index.js'), 'utf8');

  assert.match(source, /ALLOW_ORDER_RESET/);
  assert.match(source, /订单清理功能未开放/);
});
