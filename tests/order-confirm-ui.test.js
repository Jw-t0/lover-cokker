const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('order page sends the selected dishes to a dedicated confirmation page', () => {
  const app = JSON.parse(read('miniprogram/app.json'));
  const wxml = read('miniprogram/pages/order/order.wxml');
  const js = read('miniprogram/pages/order/order.js');

  assert.ok(app.pages.includes('pages/order-confirm/order-confirm'));
  assert.doesNotMatch(wxml, /class="remark-card/);
  assert.match(wxml, /bindtap="goOrderConfirm"/);
  assert.match(wxml, /<text>确认订单<\/text>/);
  assert.match(js, /const DRAFT_STORAGE_KEY = 'pendingOrderDraft';/);
  assert.match(js, /const pendingDraft = wx\.getStorageSync\(DRAFT_STORAGE_KEY\)/);
  assert.match(js, /remark: pendingDraft\.remark \|\| ''/);
  assert.match(js, /wx\.navigateTo\(\{[\s\S]*url: '\/pages\/order-confirm\/order-confirm'/);
  assert.doesNotMatch(js, /createOrder/);
});

test('successful submission returns through the order page before opening order history', () => {
  const orderJs = read('miniprogram/pages/order/order.js');
  const confirmJs = read('miniprogram/pages/order-confirm/order-confirm.js');

  assert.match(confirmJs, /wx\.setStorageSync\('orderSubmissionComplete', true\)/);
  assert.match(confirmJs, /wx\.navigateBack\(/);
  assert.doesNotMatch(confirmJs, /wx\.redirectTo\(\{ url: '\/pages\/my-order\/my-order' \}\)/);
  assert.match(orderJs, /wx\.getStorageSync\('orderSubmissionComplete'\)/);
  assert.match(orderJs, /wx\.redirectTo\(\{ url: '\/pages\/my-order\/my-order' \}\)/);
});

test('order confirmation page owns remarks and final submission', () => {
  const wxml = read('miniprogram/pages/order-confirm/order-confirm.wxml');
  const js = read('miniprogram/pages/order-confirm/order-confirm.js');
  const constants = read('miniprogram/utils/constants.js');

  assert.match(wxml, /确认订单/);
  assert.match(wxml, /wx:for="{{cart}}"/);
  assert.match(wxml, /口味备注/);
  assert.match(wxml, /bindinput="onRemark"/);
  assert.match(wxml, /bindtap="submitOrder"/);
  assert.match(constants, /ORDER_NOTIFY_TEMPLATE_ID\s*=\s*''/);
  assert.match(js, /createOrder\(\{[\s\S]*cart: this\.data\.cart,[\s\S]*remark: this\.data\.remark/);
  assert.doesNotMatch(js, /console\.info\('CREATE_ORDER_RESULT', result\)/);
  assert.match(js, /!result\.pushed \|\| result\.pushError/);
  assert.match(js, /result\.pushError/);
  assert.match(js, /const DRAFT_STORAGE_KEY = 'pendingOrderDraft'/);
  assert.match(js, /wx\.removeStorageSync\(DRAFT_STORAGE_KEY\)/);
});

test('successful order submission offers a native WeChat share action for the chef', () => {
  const wxml = read('miniprogram/pages/order-confirm/order-confirm.wxml');
  const js = read('miniprogram/pages/order-confirm/order-confirm.js');

  assert.match(wxml, /wx:if="\{\{submittedOrder\}\}"/);
  assert.match(wxml, /wx:if="\{\{!submittedOrder\.soloMode\}\}"[\s\S]*open-type="share"/);
  assert.match(wxml, />发给 TA</);
  assert.match(wxml, /去厨房接单/);
  assert.match(js, /submittedOrder: null/);
  assert.match(js, /this\.setData\(\{ submittedOrder: result\.order \}\)/);
  assert.match(js, /onShareAppMessage\(\)/);
  assert.match(js, /path:\s*'\/pages\/chef\/chef'/);
});

test('solo experience orders do not show a failed partner notification', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order-confirm/order-confirm.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order-confirm/order-confirm.js'), 'utf8');

  assert.match(js, /result\.order\.soloMode/);
  assert.match(js, /activeRole', 'chef'/);
  assert.match(js, /pages\/chef\/chef/);
  assert.match(wxml, /submittedOrder\.soloMode \? '去厨房接单'/);
});

test('order confirmation gives feedback when a dish reaches the quantity cap', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/order-confirm/order-confirm.js'), 'utf8');

  assert.match(js, /increaseDish[\s\S]*summarizeCart\(cart\)\.count === this\.data\.summary\.count[\s\S]*最多 99 份/);
});

test('chef desk lets the receiver subscribe to order reminders', () => {
  const wxml = read('miniprogram/pages/chef/chef.wxml');
  const js = read('miniprogram/pages/chef/chef.js');

  assert.match(wxml, /bindtap="requestOrderSubscribe"/);
  assert.match(wxml, />开启点菜提醒</);
  assert.match(js, /ORDER_NOTIFY_TEMPLATE_ID/);
  assert.match(js, /wx\.requestSubscribeMessage\(\{[\s\S]*tmplIds:\s*\[ORDER_NOTIFY_TEMPLATE_ID\]/);
  assert.match(js, /res\[ORDER_NOTIFY_TEMPLATE_ID\] === 'accept'/);
});

test('bottom overlays hide the role tab so their action buttons stay tappable', () => {
  const orderWxml = read('miniprogram/pages/order/order.wxml');
  const cartSheetWxml = read('miniprogram/components/cart-sheet/cart-sheet.wxml');

  assert.match(orderWxml, /<role-tab-bar wx:if="{{!cartVisible && !tastePanelVisible}}"/);
  assert.doesNotMatch(cartSheetWxml, /textarea/);
  assert.match(cartSheetWxml, /<text>确认订单<\/text>/);
});

test('clearing the cart removes the pending draft and taste rows use unique keys', () => {
  const orderJs = read('miniprogram/pages/order/order.js');
  const cartSheetWxml = read('miniprogram/components/cart-sheet/cart-sheet.wxml');

  assert.match(orderJs, /if \(!cart\.length\) \{[\s\S]*wx\.removeStorageSync\(DRAFT_STORAGE_KEY\);/);
  assert.match(cartSheetWxml, /wx:key="cartKey"/);
});

test('pending order drafts are scoped to the current couple space', () => {
  const orderJs = read('miniprogram/pages/order/order.js');
  const confirmJs = read('miniprogram/pages/order-confirm/order-confirm.js');

  assert.match(orderJs, /coupleId/);
  assert.match(orderJs, /pendingOrderDraft/);
  assert.match(confirmJs, /coupleId/);
});
