const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('order data cloud function supports guest and chef visibility filters', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');

  assert.match(source, /function roleQuery/);
  assert.match(source, /role === 'chef'/);
  assert.match(source, /filterChefActiveOrders/);
  assert.match(source, /!order\.chefUserId/);
  assert.match(source, /order\.chefUserId === user\._id/);
  assert.match(source, /order\.soloMode && order\.guestUserId === user\._id/);
  assert.match(source, /order\.guestUserId !== user\._id/);
  assert.match(source, /guestUserId: user\._id/);
  assert.match(source, /listActiveOrders\(coupleId, user, role\)/);
});

test('my order uses guest visibility while chef desk uses chef visibility', () => {
  const myOrderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.js'), 'utf8');
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');
  const chefJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');

  assert.match(myOrderJs, /getOrderOverview\('guest'\)/);
  assert.match(historyJs, /listHistoryPage\(this\.data\.role/);
  assert.match(chefJs, /getActiveOrder\('chef'\)/);
});

test('my order falls back to the direct active-order query when overview omits it', () => {
  const myOrderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.js'), 'utf8');

  assert.match(myOrderJs, /getActiveOrder\('guest'\)/);
});

test('history page follows the active role so chefs see orders they cooked', () => {
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');

  assert.match(historyJs, /activeRole/);
  assert.match(historyJs, /listHistoryPage\(this\.data\.role/);
  assert.doesNotMatch(historyJs, /listHistoryPage\('guest'/);
});

test('history orders use paged loading with an explicit continuation state', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '../miniprogram/services/order-service.js'), 'utf8');
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');
  const historyWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.wxml'), 'utf8');

  assert.match(source, /pageSize/);
  assert.match(source, /hasMore/);
  assert.match(source, /type === 'history' \? HISTORY_STATUSES/);
  assert.match(service, /listHistoryPage/);
  assert.match(historyJs, /loadMore/);
  assert.match(historyWxml, /wx:if="\{\{hasMore\}\}"/);
  assert.match(source, /beforeCreatedAt/);
  assert.match(source, /nextCursor/);
  assert.match(service, /beforeId/);
  assert.match(historyJs, /historyCursor/);
});

test('completed orders remain reachable in history until the guest reviews them', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');

  assert.match(source, /const HISTORY_STATUSES = \['completed', 'reviewed', 'cancelled'\]/);
  assert.match(source, /HISTORY_STATUSES\.includes\(order\.status\)/);
  assert.match(historyJs, /completed:\s*'已完成'/);
});

test('guest history includes the shared couple history while chef history stays chef-scoped', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');

  assert.match(source, /function historyRole\(role\)/);
  assert.match(source, /return role === 'chef' \? 'chef' : 'all'/);
  assert.match(source, /const historyQueryRole = type === 'history' \? historyRole\(role\) : role/);
  assert.match(source, /listOrders\(coupleId, statuses, user, historyQueryRole, options\)/);
});

test('guest history keeps a completed active order visible while the cloud history rolls forward', () => {
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');

  assert.match(historyJs, /getActiveOrder\('guest'\)/);
  assert.match(historyJs, /activeOrder\.status === 'completed'/);
  assert.match(historyJs, /!orders\.some\(\(order\) => order\._id === activeOrder\._id\)/);
});

test('order data rejects all-role reads outside statistics and retained history stays reachable from pages', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');
  const myOrderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.js'), 'utf8');

  assert.match(source, /function assertRoleAllowed/);
  assert.match(source, /role === 'all' && type !== 'stats'/);
  assert.match(historyJs, /listHistoryPage\(this\.data\.role/);
  assert.doesNotMatch(historyJs, /user\.coupleId \?/);
  assert.match(myOrderJs, /getOrderOverview\('guest'\)/);
  assert.doesNotMatch(myOrderJs, /user\.coupleId \? await getOrderOverview/);
  assert.match(source, /role === 'guest'\) return listOrders\(coupleId, ACTIVE_STATUSES, user, 'all'\)/);
});

test('active order lookup does not load the full review collection', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');

  assert.match(source, /function needsReviews\(type\)\s*\{[\s\S]*type === 'history'[\s\S]*type === 'stats'/);
  assert.match(source, /if \(needsReviews\(type\)\) tasks\.push\(listReviews\(coupleId\)\);/);
});

test('order overview exposes the latest cancelled order for recovery messaging', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '../miniprogram/services/order-service.js'), 'utf8');

  assert.match(source, /recentCancelled/);
  assert.match(source, /type === 'overview'/);
  assert.match(service, /getOrderOverview/);
});
