const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('home is the first page and the app does not use native tabBar', () => {
  const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/app.json'), 'utf8'));

  assert.equal(app.pages[0], 'pages/home/home');
  assert.equal(Object.prototype.hasOwnProperty.call(app, 'tabBar'), false);
});

test('home stores the selected role before entering role pages', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(js, /wx\.setStorageSync\('activeRole', 'guest'\)/);
  assert.match(js, /wx\.setStorageSync\('activeRole', 'chef'\)/);
  assert.match(js, /wx\.navigateTo\({ url: '\/pages\/order\/order' }\)/);
  assert.match(js, /wx\.navigateTo\({ url: '\/pages\/chef\/chef' }\)/);
});

test('mine page switches to chef navigation before opening chef features', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/mine/mine.js'), 'utf8');

  assert.match(js, /const chefUrls = \[[\s\S]*\/pages\/chef\/chef[\s\S]*\/pages\/menu-manage\/menu-manage/);
  assert.match(js, /chefUrls\.includes\(url\)[\s\S]*activeRole', 'chef'/);
  assert.match(js, /url === '\/pages\/my-order\/my-order'[\s\S]*activeRole', 'guest'/);
});

test('role tab component defines guest and chef tab sets', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/components/role-tab-bar/role-tab-bar.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/role-tab-bar/role-tab-bar.wxml'), 'utf8');

  assert.match(js, /text: '餐桌'[\s\S]*url: '\/pages\/home\/home'/);
  assert.match(js, /guest: \[[\s\S]*text: '点菜'[\s\S]*text: '订单'[\s\S]*text: '我的'/);
  assert.match(js, /chef: \[[\s\S]*text: '厨房'[\s\S]*text: '订单'[\s\S]*text: '我的'/);
  assert.match(js, /text: '我的'[\s\S]*url: '\/pages\/mine\/mine'/);
  assert.match(js, /wx\.redirectTo/);
  assert.match(wxml, /wx:for="{{tabs}}"/);
});

test('role pages mount the custom role tab bar', () => {
  const pages = ['order', 'my-order', 'mine', 'chef', 'recipes', 'history'];
  for (const page of pages) {
    const json = JSON.parse(fs.readFileSync(path.join(__dirname, `../miniprogram/pages/${page}/${page}.json`), 'utf8'));
    const wxml = fs.readFileSync(path.join(__dirname, `../miniprogram/pages/${page}/${page}.wxml`), 'utf8');

    assert.equal(json.usingComponents['role-tab-bar'], '/components/role-tab-bar/role-tab-bar');
    assert.match(wxml, /<role-tab-bar/);
  }
});
