const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('order page does not show the empty menu state while loading', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');

  assert.match(wxml, /wx:if="{{loading}}" class="menu-loading/);
  assert.match(wxml, /wx:if="{{!loading && !displayDishes\.length}}"/);
  assert.match(wxml, /<view wx:if="{{!loading && !cartVisible && !tastePanelVisible}}" class="cart-bar">/);
});

test('order page makes a failed cloud menu recoverable instead of treating fallback data as orderable', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(js, /menuError/);
  assert.match(js, /retryLoad/);
  assert.match(wxml, /菜单暂时不可用/);
  assert.match(wxml, /bindtap="retryLoad"/);
});

test('guest ordering page does not duplicate the orders navigation in its header', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxss'), 'utf8');

  assert.doesNotMatch(wxml, /header-order-button/);
  assert.doesNotMatch(js, /\bgoMyOrder\b/);
  assert.doesNotMatch(css, /\.header-order-button\s*\{/);
});

test('order cards expose a semantic class for each order status', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/order-card/order-card.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/components/order-card/order-card.wxss'), 'utf8');

  assert.match(wxml, /status-bar status-\{\{order\.status\}\}/);
  assert.match(css, /\.status-pending/);
  assert.match(css, /\.status-accepted/);
  assert.match(css, /#dff2dd/i);
});

test('cancelled order cards preserve the cancellation reason', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/order-card/order-card.wxml'), 'utf8');

  assert.match(wxml, /order\.cancelReason/);
  assert.match(wxml, /取消原因/);
});

test('order cards show when the meal was created', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/order-card/order-card.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/components/order-card/order-card.js'), 'utf8');

  assert.match(wxml, /createdAtText/);
  assert.match(js, /formatOrderDate/);
});

test('destructive order actions are not styled as disabled controls', () => {
  const appCss = fs.readFileSync(path.join(__dirname, '../miniprogram/app.wxss'), 'utf8');
  const myOrderWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.wxml'), 'utf8');
  const chefWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.wxml'), 'utf8');

  assert.match(appCss, /\.danger-button/);
  assert.match(myOrderWxml, /<button(?=[^>]*class="order-action-button danger-button")(?=[^>]*bindtap="cancelCurrentOrder")[^>]*>/s);
  assert.match(chefWxml, /<button(?=[^>]*class="action-button danger-button")(?=[^>]*bindtap="cancel")[^>]*>/s);
});

test('order pages expose retryable loading and error states', () => {
  const myOrderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.js'), 'utf8');
  const myOrderWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.wxml'), 'utf8');
  const chefWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.wxml'), 'utf8');

  assert.match(myOrderJs, /startPolling/);
  assert.match(myOrderWxml, /wx:if="\{\{loading\}\}"/);
  assert.match(myOrderWxml, /bindtap="retry"/);
  assert.match(chefWxml, /wx:if="\{\{loading\}\}"/);
});

test('order status refreshes do not overwrite a newer action result', () => {
  const myOrderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/my-order/my-order.js'), 'utf8');
  const chefJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/chef/chef.js'), 'utf8');
  const historyJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/history/history.js'), 'utf8');

  assert.match(myOrderJs, /orderRequestId/);
  assert.match(chefJs, /deskRequestId/);
  assert.match(historyJs, /historyRequestId/);
});

test('visually disabled checkout controls are also natively disabled', () => {
  const orderWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const confirmWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order-confirm/order-confirm.wxml'), 'utf8');
  const cartWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/cart-sheet/cart-sheet.wxml'), 'utf8');

  assert.match(orderWxml, /disabled="{{summary\.count === 0}}"/);
  assert.match(confirmWxml, /disabled="{{submitting}}"/);
  assert.match(cartWxml, /disabled="{{summary\.count === 0}}"/);
});

test('order checkout action uses a distinct label, directional arrow, and compact dark primary treatment', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxss'), 'utf8');

  assert.match(wxml, /class="bar-button checkout-button \{\{summary\.count > 0 \? 'primary-button' : 'disabled-button'\}\}"/);
  assert.match(wxml, /<text>确认订单<\/text>/);
  assert.match(wxml, /class="checkout-arrow">›<\/text>/);
  assert.match(wxml, /disabled="\{\{summary\.count === 0\}\}"/);
  assert.match(css, /\.checkout-button\s*\{[^}]*width:\s*218rpx;/s);
  assert.match(css, /\.checkout-button\s*\{[^}]*height:\s*88rpx;/s);
  assert.match(css, /\.checkout-button\.primary-button\s*\{[^}]*background:\s*#4d373e;/s);
  assert.match(css, /\.checkout-arrow\s*\{/);
});

test('cart summary floats above the role tabs and anchors checkout to the right edge', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxss'), 'utf8');

  assert.match(wxml, /class="cart-bar"[\s\S]*class="checkout-slot"[\s\S]*class="bar-button checkout-button/);
  assert.match(css, /\.cart-bar\s*\{[^}]*left:\s*28rpx;/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*right:\s*28rpx;/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*bottom:\s*calc\(158rpx\s+\+\s+env\(safe-area-inset-bottom\)\)/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*position:\s*fixed;/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*z-index:\s*100;/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*border-radius:\s*28rpx;/s);
  assert.match(css, /\.cart-bar\s*\{[^}]*box-shadow:\s*0\s+18rpx\s+42rpx/s);
  assert.match(css, /\.checkout-slot\s*\{[^}]*margin-left:\s*auto;/s);
  assert.match(css, /\.checkout-slot\s*\{[^}]*justify-content:\s*flex-end;/s);
});

test('cart sheet checkout matches the floating checkout action treatment', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/cart-sheet/cart-sheet.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/components/cart-sheet/cart-sheet.wxss'), 'utf8');

  assert.match(wxml, /class="footer-button checkout-button \{\{summary\.count > 0 \? 'primary-button' : 'disabled-button'\}\}"/);
  assert.match(wxml, /<text>确认订单<\/text>/);
  assert.match(wxml, /class="footer-arrow">›<\/text>/);
  assert.match(css, /\.footer-button\s*\{[^}]*height:\s*88rpx;/s);
  assert.match(css, /\.footer-button\s*\{[^}]*border-radius:\s*16rpx;/s);
  assert.match(css, /\.footer-button\.primary-button\s*\{[^}]*background:\s*#4d373e;/s);
  assert.match(css, /\.footer-arrow\s*\{/);
  assert.match(css, /\.footer\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /\.footer-button\s*\{[^}]*margin-left:\s*auto;/s);
});

test('order confirmation pins the submit button to the right edge of the fixed bar', () => {
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order-confirm/order-confirm.wxss'), 'utf8');

  assert.match(css, /\.confirm-bar\s*\{[^}]*width:\s*100%;/s);
  assert.match(css, /\.confirm-button\s*\{[^}]*margin-left:\s*auto;/s);
});

test('cart sheet takes over the checkout layer while it is open', () => {
  const orderWxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const cartCss = fs.readFileSync(path.join(__dirname, '../miniprogram/components/cart-sheet/cart-sheet.wxss'), 'utf8');

  assert.match(orderWxml, /<view wx:if="\{\{!loading && !cartVisible && !tastePanelVisible\}\}" class="cart-bar">/);
  assert.match(cartCss, /\.sheet-wrap\s*\{[^}]*z-index:\s*120;/s);
});

test('cart clear action requires confirmation before deleting the draft', () => {
  const cartJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(cartJs, /async clearCart/);
  assert.match(cartJs, /清空购物车/);
});

test('order page opens the taste panel for a dish selected on the home page', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(js, /openHomeSelectedDish\(\)/);
  assert.match(js, /wx\.getStorageSync\('homeSelectedDish'\)/);
  assert.match(js, /wx\.removeStorageSync\('homeSelectedDish'\)/);
  assert.match(js, /openTastePanel\(dish\)/);
});

test('dish detail keeps a guest add-to-order action connected to the order page', () => {
  const detail = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/dish-detail/dish-detail.wxml'), 'utf8');
  const detailJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/dish-detail/dish-detail.js'), 'utf8');
  const order = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(detail, /bindtap="addToOrder"/);
  assert.match(detailJs, /detailSelectedDish/);
  assert.match(order, /detailSelectedDish/);
});

test('home-selected dishes survive the transition from fallback to personal menu data', () => {
  const homeJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const orderJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(homeJs, /const selectedDish = this\.data\.recommendedDishes\.find/);
  assert.match(homeJs, /wx\.setStorageSync\('homeSelectedDish', selectedDish \|\| selectedDishId\)/);
  assert.match(orderJs, /const selectedDish = wx\.getStorageSync\('homeSelectedDish'\)/);
  assert.match(orderJs, /item\.name === selectedDish\.name/);
});

test('order page shows all dishes before a category filter is selected', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(wxml, /data-id="all"[\s\S]*全部/);
  assert.match(js, /selectedCategoryId:\s*'all'/);
  assert.match(js, /this\.data\.selectedCategoryId === 'all' \|\| dish\.categoryId === this\.data\.selectedCategoryId/);
});

test('order page repairs an existing partial default menu in the background', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(js, /DEFAULT_DISHES\.length/);
  assert.match(js, /DEFAULT_CATEGORIES\.length/);
  assert.match(js, /resetDefaultMenu\(\{ mode: 'sync' \}\)/);
  assert.match(js, /syncPartialDefaultMenu/);
});

test('unbound users cannot submit the fallback menu as a real order', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(js, /if \(!user \|\| !user\.coupleId\)/);
  assert.match(js, /请先从首页选择单人体验或邀请另一半/);
  assert.match(wxml, /bindtap="goHome"/);
});

test('partial menu repair failure stays advisory when existing dishes are usable', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.wxml'), 'utf8');

  assert.match(js, /menuNotice/);
  assert.match(js, /默认菜单还没补齐/);
  assert.match(wxml, /\{\{menuNotice\}\}/);
});

test('order page explains when a dish quantity reaches its cap', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order/order.js'), 'utf8');

  assert.match(js, /最多 99 份/);
});
