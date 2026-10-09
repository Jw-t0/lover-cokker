const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pageDir = path.join(__dirname, '../miniprogram/pages/dish-edit');

test('dish editor exposes grouped icon picker controls', () => {
  const wxml = fs.readFileSync(path.join(pageDir, 'dish-edit.wxml'), 'utf8');

  assert.match(wxml, /bindtap="openIconPicker"/);
  assert.match(wxml, /wx:if="\{\{iconPickerVisible\}\}"/);
  assert.match(wxml, /wx:for="\{\{iconGroups\}\}"/);
  assert.match(wxml, /wx:for="\{\{group\.items\}\}"/);
  assert.match(wxml, /bindtap="chooseEmoji"/);
  assert.match(wxml, /bindtap="closeIconPicker"/);
});

test('dish editor writes selected emoji into the form', () => {
  const js = fs.readFileSync(path.join(pageDir, 'dish-edit.js'), 'utf8');

  assert.match(js, /require\(['"]\.\.\/\.\.\/data\/dish-icons['"]\)/);
  assert.match(js, /iconPickerVisible:\s*false/);
  assert.match(js, /chooseEmoji\(event\)/);
  assert.match(js, /const emoji = event\.currentTarget\.dataset\.emoji/);
  assert.match(js, /form:\s*\{ \.\.\.this\.data\.form, emoji, imageUrl: '' \}/);
  assert.match(js, /imageUrl:\s*''/);
});

test('dish editor prevents duplicate saves while a dish is being persisted', () => {
  const wxml = fs.readFileSync(path.join(pageDir, 'dish-edit.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(pageDir, 'dish-edit.js'), 'utf8');

  assert.match(js, /saving:\s*false/);
  assert.match(js, /if \(this\.data\.saving\) return/);
  assert.match(js, /this\.setData\(\{ saving: true \}\)/);
  assert.match(js, /saving: false/);
  assert.match(wxml, /class="primary-button save"[^>]*disabled="\{\{saving\}\}"/);
});

test('dish editor keeps recipe payload visible even when menu reads are delayed', () => {
  const js = fs.readFileSync(path.join(pageDir, 'dish-edit.js'), 'utf8');

  assert.match(js, /const recipePayload = options\.fromRecipe === '1' \? wx\.getStorageSync\('pendingRecipePayload'\) : null/);
  assert.match(js, /recipePayload[\s\S]*this\.setData\(\{ form:/);
});

test('dish editor gives add and edit pages matching navigation titles', () => {
  const js = fs.readFileSync(path.join(pageDir, 'dish-edit.js'), 'utf8');

  assert.match(js, /wx\.setNavigationBarTitle\(\{ title: options\.id \? '编辑菜品' : '添加菜品' \}\)/);
});
