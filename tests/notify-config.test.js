const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('example cloud configuration uses the order notification variable consumed by createOrder', () => {
  const example = fs.readFileSync(path.join(__dirname, '../.env.example'), 'utf8');

  assert.match(example, /^ORDER_NOTIFY_TEMPLATE_ID=/m);
  assert.doesNotMatch(example, /^WECHAT_ORDER_NOTIFY_TEMPLATE_ID=/m);
});
