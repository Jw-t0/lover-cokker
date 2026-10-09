const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('menu management shows category tabs and only renders the selected category', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.wxml'), 'utf8');

  assert.match(wxml, /class="category-tabs"/);
  assert.match(wxml, /bindtap="selectCategory"/);
  assert.match(wxml, /wx:for="{{selectedGroup\.dishes}}"/);
  assert.doesNotMatch(wxml, /wx:for="{{menuGroups}}"[^>]*class="category-section"/);
});

test('solo space initialization keeps an existing menu intact', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/resetDefaultMenu/index.js'), 'utf8');

  assert.match(source, /async function ensureDefaultMenu\(coupleId\)/);
  assert.match(source, /await ensureDefaultMenu\(coupleId\)/);
});

test('menu management exposes a category creation action', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.js'), 'utf8');

  assert.match(wxml, /bindtap="addCategory"/);
  assert.match(js, /async addCategory\(\)/);
  assert.match(js, /createCategory\(/);
});

test('empty menu management offers a recoverable initialization action', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.js'), 'utf8');

  assert.match(wxml, /初始化默认菜单/);
  assert.match(wxml, /bindtap="initializeMenu"/);
  assert.match(js, /initializeMenu/);
  assert.match(js, /refreshCurrentUser/);
});

test('menu management has loading and retryable error states', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/menu-manage/menu-manage.js'), 'utf8');

  assert.match(js, /loading/);
  assert.match(js, /retry/);
  assert.match(wxml, /wx:if="\{\{loading\}\}"/);
  assert.match(wxml, /bindtap="retry"/);
});

test('chef desk uses one explicit primary action for each active order state', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.wxml'), 'utf8');

  assert.match(wxml, /接单，准备开火/);
  assert.match(wxml, /这顿做好啦/);
});

test('completion asks for confirmation before moving an order to completed', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');

  assert.match(js, /确认这顿饭已经做好了吗/);
});

test('chef desk keeps the recipe library reachable from the kitchen', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');

  assert.match(wxml, /菜品大全/);
  assert.match(wxml, /bindtap="goRecipes"/);
  assert.match(js, /goRecipes\(\)\s*{\s*wx\.navigateTo\({ url: '\/pages\/recipes\/recipes' }\);\s*}/);
});

test('chef order loading keeps the order usable when optional stats fail', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');

  assert.match(js, /async loadStats\(coupleId/);
  assert.match(js, /catch \(error\) \{[\s\S]*favoriteDish: '暂无'/);
});
