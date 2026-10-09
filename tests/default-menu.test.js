const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildDefaultMenu } = require('../miniprogram/utils/default-menu');
const { DEFAULT_DISHES } = require('../miniprogram/utils/constants');

test('builds an orderable fallback menu with category-linked dishes', () => {
  const { categories, dishes } = buildDefaultMenu();

  assert.ok(categories.length > 0);
  assert.ok(dishes.length > 0);
  assert.equal(dishes.every((dish) => dish.id && dish._id && dish.categoryId && dish.status === 'online'), true);
  assert.equal(categories.some((category) => category._id === dishes[0].categoryId), true);
});

test('default menus cover common everyday dishes in every initialization path', () => {
  const expectedNames = ['番茄炒蛋', '青椒肉丝', '麻婆豆腐', '宫保鸡丁', '回锅肉', '糖醋排骨', '红烧肉', '蛋炒饭', '凉拌黄瓜'];
  const resetSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/resetDefaultMenu/index.js'), 'utf8');
  const inviteSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');

  assert.ok(DEFAULT_DISHES.length >= 30);
  expectedNames.forEach((name) => {
    assert.ok(DEFAULT_DISHES.some((dish) => dish.name === name), `frontend default menu misses ${name}`);
    assert.match(resetSource, new RegExp(`name: '${name}'`));
    assert.match(inviteSource, new RegExp(`name: '${name}'`));
  });
});

test('default menu initialization upgrades an existing partial menu', () => {
  const resetSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/resetDefaultMenu/index.js'), 'utf8');
  const inviteSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');
  const menuDataSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getMenuData/index.js'), 'utf8');

  [resetSource, inviteSource].forEach((source) => {
    assert.doesNotMatch(source, /if \(existing\.data\.length\) return;/);
    assert.match(source, /db\.collection\('dishes'\)\.where\(\{ coupleId \}\)\.get\(\)/);
    assert.match(source, /existingDishes/);
  });
  assert.match(resetSource, /await ensureDefaultMenu\(coupleId\)/);
  assert.match(menuDataSource, /name: '水果',[\s\S]*sort: 9/);
});

test('default menu setup preserves custom dishes and active orders', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/resetDefaultMenu/index.js'), 'utf8');

  assert.doesNotMatch(source, /async function clearExisting/);
  assert.doesNotMatch(source, /status: 'cancelled', cancelReason: '重置菜单'/);
});
