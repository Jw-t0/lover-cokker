const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('home keeps the icon-only profile action fixed at the far right of the toolbar', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(wxml, /<view class="mine-link" aria-label="我的"[\s\S]*bindtap="goMine"[\s\S]*class="mine-avatar"/);
  assert.doesNotMatch(wxml, /<button class="mine-link"/);
  assert.match(wxml, /class="mine-avatar-head"/);
  assert.match(wxml, /class="mine-avatar-shoulders"/);
  assert.match(css, /\.mine-link\s*\{[^}]*width:\s*64rpx;/s);
  assert.match(css, /\.mine-link\s*\{[^}]*height:\s*64rpx;/s);
  assert.match(css, /\.mine-link\s*\{[^}]*flex:\s*0\s+0\s+64rpx;/s);
  assert.match(css, /\.mine-link\s*\{[^}]*max-width:\s*64rpx;/s);
  assert.match(css, /\.mine-link\s*\{[^}]*margin-left:\s*auto;/s);
  assert.match(css, /\.mine-link\s*\{[^}]*border-radius:\s*50%;/s);
  assert.match(css, /\.mine-avatar-head\s*\{/);
  assert.match(css, /\.mine-avatar-shoulders\s*\{/);
});

test('home is a shared table with guest and kitchen shortcuts', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(wxml, /爱心饭堂/);
  assert.match(wxml, /<view wx:else class="title">想和你一起吃<\/view>/);
  assert.match(wxml, /<view wx:else class="subtitle">菜单已经备好<\/view>/);
  assert.match(wxml, /正在准备今天的饭桌/);
  assert.match(wxml, /菜单马上就好/);
  assert.match(wxml, /<view class="entry-title">翻开菜单<\/view>/);
  assert.match(wxml, /把想吃的告诉厨房/);
  assert.match(wxml, /挑好菜，厨房马上收到/);
  assert.match(wxml, /进入厨房/);
  assert.doesNotMatch(wxml, /情侣私厨点餐/);
  assert.match(js, /goOrder\(\)/);
  assert.match(js, /goChef\(\)/);
});

test('home opens the primary menu directly without a transition layer', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(wxml, /class="order-entry"[^>]*bindtap="goOrder"/);
  assert.doesNotMatch(wxml, /menu-opening-wrap|menu-opening-surface|menu-cover-kicker/);
  assert.doesNotMatch(js, /menuOpening|openMenu\(/);
  assert.doesNotMatch(css, /menu-surface-expand|menu-opening-wrap|menu-opening-surface/);
});

test('home uses a full table section and a compact footer in the no-order state', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');

  assert.match(wxml, /我们的饭桌/);
  assert.match(wxml, /看记录 ›/);
  assert.match(wxml, /今天也要好好吃饭/);
  assert.match(wxml, /挑好菜，厨房马上收到/);
});

test('home navigation titles use the new product name', () => {
  const appConfig = fs.readFileSync(path.join(__dirname, '../miniprogram/app.json'), 'utf8');
  const homeConfig = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.json'), 'utf8');

  assert.match(appConfig, /"navigationBarTitleText":\s*"爱心饭堂"/);
  assert.match(homeConfig, /"navigationBarTitleText":\s*"爱心饭堂"/);
});

test('home loads active guest order and menu previews for its two states', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(js, /getActiveOrder\('guest'\)/);
  assert.match(js, /listDishes\(user\.coupleId, \{ onlineOnly: true \}\)/);
  assert.match(js, /homeOrder/);
  assert.match(wxml, /wx:if="{{homeOrder}}"/);
  assert.match(wxml, /wx:else/);
  assert.match(wxml, /推荐菜/);
  assert.match(wxml, /想再加一道菜？/);
  assert.match(wxml, /这顿饭做好啦/);
  assert.match(js, /订单已送到厨房/);
  assert.match(js, /这顿饭在制作/);
  assert.match(js, /这顿饭做好了/);
});

test('home renders recommendations only inside the no-order branch', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const activeMealIndex = wxml.indexOf('<view wx:if="{{homeOrder}}" class="active-meal"');
  const noOrderBranchIndex = wxml.indexOf('<block wx:else>\n    <view class="order-entry"');
  const recommendationIndex = wxml.indexOf('<view wx:if="{{recommendedDishes.length}}" class="recommend-section">');

  assert.ok(activeMealIndex >= 0);
  assert.ok(noOrderBranchIndex > activeMealIndex);
  assert.ok(recommendationIndex > noOrderBranchIndex);
  assert.doesNotMatch(wxml.slice(activeMealIndex, noOrderBranchIndex), /recommend-section/);
});

test('home uses default menu recommendations when there is no couple space', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(js, /const \{ buildDefaultMenu \} = require\('\.\.\/\.\.\/utils\/default-menu'\)/);
  assert.match(js, /const fallbackDishes = buildDefaultMenu\(\)\.dishes/);
  assert.match(js, /recommendedDishes:\s*pickRandomDishes\(fallbackDishes, 3\)/);
});

test('home keeps the active meal and menu preview areas above the fixed navigation', () => {
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(css, /\.active-meal/);
  assert.match(css, /\.recommend-grid/);
  assert.match(css, /min-height:\s*88rpx/);
  assert.match(css, /padding:\s*34rpx\s+36rpx\s+220rpx/);
});

test('home gives pending orders a distinct waiting-for-acceptance state', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(wxml, /待接单/);
  assert.match(wxml, /homeOrder\.status === 'pending'/);
  assert.match(css, /\.meal-pending/);
});

test('home uses a first-load placeholder instead of briefly showing the no-order path', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(js, /loading:\s*true/);
  assert.match(js, /loading:\s*false/);
  assert.match(wxml, /wx:if="{{loading}}" class="home-loading"/);
  assert.match(css, /\.home-loading/);
});

test('home exposes a retryable error state instead of silently pretending there is no order', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');

  assert.match(js, /homeError/);
  assert.match(js, /retryLoad/);
  assert.match(wxml, /饭桌暂时打不开/);
  assert.match(wxml, /bindtap="retryLoad"/);
});

test('home ignores stale refresh results after a fast return to the page', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(js, /const requestId = \(this\.homeRequestId \|\| 0\) \+ 1/);
  assert.match(js, /requestId !== this\.homeRequestId/);
});

test('home adds decorative kitchen stickers without competing with actions', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.doesNotMatch(wxml, /kitchen-sticker|sticker-spoon|sticker-cherry|sticker-heart/);
  assert.match(wxml, /class="hero-visual"/);
  assert.match(wxml, /class="hero-visual-plate"/);
  assert.match(wxml, /class="table-runner"/);
  assert.match(wxml, /meal-state-sticker/);
  assert.match(css, /\.hero-visual\s*\{[^}]*pointer-events:\s*none/);
});

test('home anchors one calm visual to the hero instead of scattering stickers', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.doesNotMatch(wxml, /kitchen-sticker|sticker-spoon|sticker-cherry|sticker-heart/);
  assert.match(wxml, /class="hero-visual"/);
  assert.match(wxml, /class="hero-visual-plate"/);
  assert.match(css, /\.hero\s*\{[^}]*display:\s*flex/);
  assert.match(css, /\.hero-visual\s*\{[^}]*flex:\s*0\s+0/);
  assert.match(css, /\.hero-visual-plate\s*\{/);
  assert.doesNotMatch(css, /@keyframes\s+sticker-(sway|float)/);
});

test('home provides staged entrance motion and tactile press feedback', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(wxml, /class="order-entry"[^>]*hover-class="pressing"/);
  assert.match(wxml, /class="recommend-card"[^>]*hover-class="pressing"/);
  assert.match(wxml, /class="quick-card"[^>]*hover-class="pressing"/);
  assert.match(css, /@keyframes\s+home-rise-in/);
  assert.match(css, /animation:\s*home-rise-in/);
  assert.match(css, /\.pressing\s*\{[^}]*transform:\s*translateY\(1rpx\) scale\(\.985\)/s);
  assert.match(css, /recommend-card:nth-child\(2\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /\.home\s*,\s*\.home\s+\*/);
});

test('home recommendation carries the selected dish into the ordering flow', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(wxml, /data-id="{{item\._id \|\| item\.id}}"[\s\S]*bindtap="goRecommendedDish"/);
  assert.match(js, /goRecommendedDish\(event\)/);
  assert.match(js, /wx\.setStorageSync\('homeSelectedDish'/);
});

test('home asks users without a couple to choose solo mode or an invite', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const css = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.wxss'), 'utf8');

  assert.match(wxml, /class="mode-choice-wrap"/);
  assert.match(wxml, /bindtap="chooseSoloMode"/);
  assert.match(wxml, /bindtap="chooseInviteMode"/);
  assert.match(wxml, /先选一种方式/);
  assert.match(wxml, /和 TA 一起开饭，或者先自己试试饭堂/);
  assert.match(wxml, /进入单人体验/);
  assert.match(wxml, /邀请情侣/);
  assert.match(js, /modeChoiceVisible:\s*false/);
  assert.match(js, /pendingDishId/);
  assert.match(js, /modeChoiceVisible:\s*true/);
  assert.match(js, /!user\.coupleId/);
  assert.match(js, /isProfileComplete/);
  assert.match(js, /profileChoiceVisible:\s*false/);
  assert.match(js, /chooseProfileForInvite/);
  assert.match(js, /createInvite/);
  assert.match(js, /\/pages\/invite\/invite\?pending=1/);
  assert.doesNotMatch(js, /showActionSheet/);
  assert.match(css, /\.mode-choice-wrap\s*\{[^}]*position:\s*fixed/s);
  assert.match(css, /\.mode-choice-sheet\s*\{[^}]*bottom:\s*0/s);
});

test('choosing solo mode initializes the personal menu space before navigating', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');
  const resetMenu = fs.readFileSync(path.join(__dirname, '../miniprogram/services/dish-service.js'), 'utf8');

  assert.match(js, /refreshCurrentUser/);
  assert.match(js, /resetDefaultMenu\(\{ mode: 'solo' \}\)/);
  assert.match(js, /async chooseSoloMode\(\)[\s\S]*await resetDefaultMenu\(\{ mode: 'solo' \}\)[\s\S]*await refreshCurrentUser\(\)/);
  assert.match(resetMenu, /function resetDefaultMenu\(options = \{\}\)[\s\S]*call\('resetDefaultMenu', options\)/);
});

test('home randomizes the full recommendation pool', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/home/home.js'), 'utf8');

  assert.match(js, /pickRandomDishes/);
  assert.match(js, /recommendedDishes:\s*pickRandomDishes\(fallbackDishes, 3\)/);
  assert.match(js, /recommendedDishes:\s*pickRandomDishes\(recommendationDishes, 3\)/);
  assert.doesNotMatch(js, /recommendedDishes:\s*(?:fallbackDishes|recommendationDishes)\.slice\(0,\s*3\)/);
});
