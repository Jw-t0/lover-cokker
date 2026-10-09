const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('global theme uses the strawberry cream palette', () => {
  const appCss = read('miniprogram/app.wxss');
  const homeCss = read('miniprogram/pages/home/home.wxss');
  const tabCss = read('miniprogram/components/role-tab-bar/role-tab-bar.wxss');

  assert.match(appCss, /#ff7297/i);
  assert.match(appCss, /#fff2f5/i);
  assert.match(appCss, /#ffe29f/i);
  assert.match(tabCss, /#ff7297/i);
  assert.doesNotMatch(appCss, /#d85f3d|#2f7d64/i);
  assert.doesNotMatch(homeCss, /情侣私厨点餐/);
});

test('page and component styles do not retain the previous kitchen palette', () => {
  const styleFiles = [
    'miniprogram/pages/order/order.wxss',
    'miniprogram/pages/order-confirm/order-confirm.wxss',
    'miniprogram/pages/my-order/my-order.wxss',
    'miniprogram/pages/chef/chef.wxss',
    'miniprogram/pages/menu-manage/menu-manage.wxss',
    'miniprogram/pages/mine/mine.wxss',
    'miniprogram/pages/couple/couple.wxss',
    'miniprogram/pages/invite/invite.wxss',
    'miniprogram/components/dish-card/dish-card.wxss',
    'miniprogram/components/cart-sheet/cart-sheet.wxss',
    'miniprogram/components/order-card/order-card.wxss',
    'miniprogram/components/empty-state/empty-state.wxss'
  ];

  for (const styleFile of styleFiles) {
    const css = read(styleFile);
    assert.doesNotMatch(css, /#d85f3d|#2f7d64|#eef4e8|#f7efe2|#faf7ef/i, styleFile);
  }
});
