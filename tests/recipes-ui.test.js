const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('recipe library page shows result count and supports loading more', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxml'), 'utf8');

  assert.match(js, /const PAGE_SIZE = 60/);
  assert.match(js, /loadMore\(\)/);
  assert.match(wxml, /共 {{totalCount}} 道菜谱/);
  assert.match(wxml, /wx:if="{{hasMore}}"/);
  assert.match(wxml, /bindtap="loadMore"/);
});

test('recipe library decorates cards with semantic cover icons', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.js'), 'utf8');

  assert.match(js, /getRecipeCover/);
  assert.match(js, /cover: getRecipeCover\(recipe\)/);
});

test('recipe library page can add a recipe into the chef menu', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxml'), 'utf8');

  assert.match(js, /addRecipeToMenu/);
  assert.match(js, /pendingRecipePayload/);
  assert.match(js, /pages\/dish-edit\/dish-edit\?fromRecipe=1/);
  assert.doesNotMatch(js, /await saveDish\(payload\)/);
  assert.match(js, /listDishes/);
  assert.match(js, /markAddedRecipes/);
  assert.match(wxml, /<view class="add-menu-button {{item\.added \? 'added' : ''}}"[^>]*catchtap="addRecipeToMenu"/);
  assert.match(wxml, /加入菜单/);
});

test('recipe library greys out recipes that are already in the menu', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxml'), 'utf8');
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxss'), 'utf8');

  assert.match(wxml, /add-menu-button {{item\.added \? 'added' : ''}}/);
  assert.match(wxml, /item\.added \? '已加入'/);
  assert.match(wxss, /\.add-menu-button\.added\s*{[^}]*background: #eeeeee;[^}]*color: #999999;/s);
});

test('recipe library action buttons stay compact', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxml'), 'utf8');
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/recipes/recipes.wxss'), 'utf8');

  assert.match(wxml, /<view wx:if="{{keyword}}"(?=[^>]*class="clear-button")(?=[^>]*bindtap="clearSearch")[^>]*>/s);
  assert.match(wxss, /\.clear-button\s*{[^}]*width: 32rpx;[^}]*height: 32rpx;[^}]*font-size: 20rpx;/s);
  assert.match(wxss, /\.add-menu-button\s*{[^}]*width: 104rpx;[^}]*height: 38rpx;[^}]*font-size: 18rpx;/s);
});
