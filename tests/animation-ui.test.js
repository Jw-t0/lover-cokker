const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('global pages and controls expose shared motion primitives', () => {
  const css = read('miniprogram/app.wxss');

  assert.match(css, /@keyframes\s+page-enter/);
  assert.match(css, /\.page\s*\{[^}]*animation:\s*page-enter/s);
  assert.match(css, /\.tap-feedback-pressed\s*\{[^}]*transform:/s);
  assert.match(css, /transition:\s*transform\s+200ms\s+cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
});

test('page entrance motion does not trap viewport-fixed overlays inside page content', () => {
  const css = read('miniprogram/app.wxss');
  const pageEnter = css.match(/@keyframes\s+page-enter\s*\{([\s\S]*?)\n\}/)[1];

  assert.match(css, /@keyframes\s+page-enter\s*\{[^}]*opacity:[\s\S]*?\}/s);
  assert.doesNotMatch(pageEnter, /transform:/);
});

test('motion stays light and gives cart count changes a short feedback', () => {
  const appCss = read('miniprogram/app.wxss');
  const homeCss = read('miniprogram/pages/home/home.wxss');
  const orderJs = read('miniprogram/pages/order/order.js');
  const orderWxml = read('miniprogram/pages/order/order.wxml');

  assert.match(appCss, /transition:\s*transform\s+200ms\s+cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
  assert.match(appCss, /\.tap-feedback\s*\{[^}]*scale\(\.985\)[^}]*opacity:\s*\.98/s);
  assert.match(appCss, /@keyframes\s+panel-slide-up\s*\{[^}]*translateY\(48%\)/s);
  assert.doesNotMatch(homeCss, /animation-delay:\s*5[0-9]{2}ms/);
  assert.match(orderJs, /cartCountBump:\s*false/);
  assert.match(orderJs, /cartCountBump:\s*countChanged/);
  assert.match(orderWxml, /class="summary \{\{cartCountBump/);
  assert.match(appCss, /@keyframes\s+cart-count-bump/);
});

test('ordering surfaces animate categories, dishes, cart and taste actions', () => {
  const appCss = read('miniprogram/app.wxss');
  const orderWxml = read('miniprogram/pages/order/order.wxml');
  const orderCss = read('miniprogram/pages/order/order.wxss');
  const dishWxml = read('miniprogram/components/dish-card/dish-card.wxml');
  const dishCss = read('miniprogram/components/dish-card/dish-card.wxss');
  const cartWxml = read('miniprogram/components/cart-sheet/cart-sheet.wxml');
  const cartCss = read('miniprogram/components/cart-sheet/cart-sheet.wxss');

  assert.match(orderWxml, /<view(?=[^>]*class="category )(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(orderWxml, /class="cart-bar"/);
  assert.match(orderWxml, /<view(?=[^>]*class="taste-option )(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(appCss, /@keyframes\s+panel-slide-up/);
  assert.match(orderCss, /\.taste-panel\s*\{[^}]*animation:\s*panel-slide-up/s);
  assert.match(orderCss, /\.taste-mask\s*\{[^}]*animation:\s*overlay-fade-in/s);
  assert.match(dishWxml, /<view(?=[^>]*class="dish-card card")(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(dishWxml, /<button(?=[^>]*class="add-button")(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(dishCss, /animation:\s*list-item-enter/);
  assert.match(cartWxml, /<view(?=[^>]*class="clear-action")(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(cartWxml, /<button(?=[^>]*class="stepper-button")(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(cartCss, /\.sheet\s*\{[^}]*animation:\s*panel-slide-up/s);
  assert.match(cartCss, /\.mask\s*\{[^}]*animation:\s*overlay-fade-in/s);
});

test('navigation and chef actions animate state changes and presses', () => {
  const appCss = read('miniprogram/app.wxss');
  const roleWxml = read('miniprogram/components/role-tab-bar/role-tab-bar.wxml');
  const roleCss = read('miniprogram/components/role-tab-bar/role-tab-bar.wxss');
  const chefWxml = read('miniprogram/pages/chef/chef.wxml');
  const chefCss = read('miniprogram/pages/chef/chef.wxss');

  assert.match(roleWxml, /<view(?=[^>]*class="role-tab-item )(?=[^>]*hover-class="tap-feedback")[^>]*>/s);
  assert.match(appCss, /\.role-tab-item,/s);
  assert.match(appCss, /transition:\s*transform\s+200ms\s+cubic-bezier\(\.16,\s*1,\s*\.3,\s*1\)/);
  assert.match(chefWxml, /class="tabs"/);
  assert.match(chefWxml, /class="stats-panel"/);
  assert.match(chefCss, /\.stats-panel\s*\{[^}]*animation:\s*panel-slide-up/s);
  assert.match(chefCss, /\.stats-mask\s*\{[^}]*animation:\s*overlay-fade-in/s);
});

test('interactive custom components share app motion styles', () => {
  const componentConfigs = [
    'dish-card',
    'cart-sheet',
    'role-tab-bar',
    'rating-stars',
    'order-card'
  ];

  for (const component of componentConfigs) {
    const config = JSON.parse(read(`miniprogram/components/${component}/${component}.json`));
    assert.equal(config.styleIsolation, 'apply-shared', component);
  }
});
