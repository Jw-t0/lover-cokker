const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('create order supports solo experience orders and optional subscribe notice', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createOrder/index.js'), 'utf8');

  assert.match(source, /async function getCouple/);
  assert.match(source, /findPartner/);
  assert.match(source, /findAppendableOrder/);
  assert.match(source, /appendItemsToOrder/);
  assert.match(source, /mode:\s*'append'/);
  assert.match(source, /mode:\s*'create'/);
  assert.match(source, /guestUserId: user\._id/);
  assert.match(source, /const soloMode = !chef/);
  assert.match(source, /soloMode/);
  assert.match(source, /chefUserId:\s*soloMode \? user\._id : ''/);
  assert.match(source, /guestName:/);
  assert.match(source, /ORDER_NOTIFY_TEMPLATE_ID/);
  assert.match(source, /const templateId = process\.env\.ORDER_NOTIFY_TEMPLATE_ID;/);
  assert.match(source, /throw new Error\('未配置订单提醒模板'\)/);
  assert.match(source, /throw new Error\('未找到伴侣的微信账号'\)/);
  assert.match(source, /subscribeMessage\.send/);
  assert.match(source, /trySendOrderSubscribe/);
  assert.match(source, /console\.warn\('ORDER_SUBSCRIBE_SEND_FAILED'/);
  assert.match(source, /pushError/);
  assert.match(source, /thing1:\s*\{\s*value:\s*`\$\{order\.guestName\}点菜啦`\s*\}/);
  assert.match(source, /date2:\s*\{\s*value:\s*formatNotifyDate\(order\.createdAt\)\s*\}/);
  assert.doesNotMatch(source, /amount3/);
  assert.doesNotMatch(source, /上一单还在制作中/);
  assert.doesNotMatch(source, /throw new Error\('上一单/);
  assert.doesNotMatch(source, /findActiveOrder/);
  assert.doesNotMatch(source, /catch\(\(\) => false\)/);
});

test('optional order notification has a bounded wait', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createOrder/index.js'), 'utf8');

  assert.match(source, /const NOTIFY_TIMEOUT_MS = \d+;/);
  assert.match(source, /Promise\.race\(\[[\s\S]*sendOrderSubscribe\(chef, order\)[\s\S]*NOTIFY_TIMEOUT_MS/);
});

test('create order rebuilds item snapshots from the shared menu instead of trusting client prices', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createOrder/index.js'), 'utf8');

  assert.match(source, /loadTrustedItems/);
  assert.match(source, /isDeleted:\s*false/);
  assert.match(source, /status:\s*'online'/);
  assert.match(source, /dish\.price/);
  assert.doesNotMatch(source, /const totalPrice = items\.reduce\(\(sum, item\) => sum \+ item\.subtotal/);
});

test('create order caps quantities after appending to an existing order', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createOrder/index.js'), 'utf8');

  assert.match(source, /同一道菜最多 99 份/);
  assert.match(source, /nextItems\.some/);
});

test('create order merges duplicate trusted cart rows and serializes active-order creation', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createOrder/index.js'), 'utf8');

  assert.match(source, /const trustedItems = cart\.map/);
  assert.match(source, /existing\.quantity \+= item\.quantity/);
  assert.match(source, /async function createOrAppendOrder/);
  assert.match(source, /db\.runTransaction/);
  assert.match(source, /status: _\.in\(APPENDABLE_STATUSES\)/);
});

test('order state changes and review writes use transactions for current-state checks', () => {
  const accept = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptOrder/index.js'), 'utf8');
  const cancel = fs.readFileSync(path.join(__dirname, '../cloudfunctions/cancelOrder/index.js'), 'utf8');
  const complete = fs.readFileSync(path.join(__dirname, '../cloudfunctions/completeOrder/index.js'), 'utf8');
  const review = fs.readFileSync(path.join(__dirname, '../cloudfunctions/submitReview/index.js'), 'utf8');

  assert.match(accept, /db\.runTransaction/);
  assert.match(cancel, /db\.runTransaction/);
  assert.match(complete, /db\.runTransaction/);
  assert.match(review, /transaction\.collection\('reviews'\)/);
});

test('order fulfillment cloud functions reject the ordering user', () => {
  const accept = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptOrder/index.js'), 'utf8');
  const complete = fs.readFileSync(path.join(__dirname, '../cloudfunctions/completeOrder/index.js'), 'utf8');

  assert.match(accept, /order\.guestUserId === user\._id && !order\.soloMode/);
  assert.match(accept, /order\.soloMode/);
  assert.match(complete, /currentOrder\.guestUserId === user\._id/);
  assert.match(complete, /isSoloDemoOrder/);
  assert.match(complete, /currentOrder\.chefUserId !== user\._id/);
});

test('review submission is idempotent for an order', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/submitReview/index.js'), 'utf8');

  assert.match(source, /where\(\{ orderId \}\)/);
  assert.match(source, /已经评价过啦/);
});
