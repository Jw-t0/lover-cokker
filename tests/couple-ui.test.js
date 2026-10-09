const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('mine couple relationship entry opens a real page', () => {
  const app = JSON.parse(fs.readFileSync(path.join(__dirname, '../miniprogram/app.json'), 'utf8'));
  const mineJs = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/mine/mine.js'), 'utf8');

  assert.equal(app.pages.includes('pages/couple/couple'), true);
  assert.match(mineJs, /text: '情侣关系'[\s\S]*url: '\/pages\/couple\/couple'/);
});

test('couple page shows partner details and invite actions', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/couple/couple.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/couple/couple.js'), 'utf8');

  assert.match(js, /getCoupleDetail/);
  assert.match(js, /createInvite/);
  assert.match(wxml, /{{partner\.nickname/);
  assert.match(wxml, /bindtap="createInvite"/);
  assert.match(wxml, /wx:if="{{couple && partner}}"/);
  assert.match(js, /isProfileComplete/);
  assert.match(js, /profileChoiceVisible:\s*false/);
});

test('mine invite action also requires a complete profile', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/mine/mine.js'), 'utf8');

  assert.match(js, /isProfileComplete/);
  assert.match(js, /profileChoiceVisible:\s*false/);
});

test('mine distinguishes a solo table from an active couple relationship', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/mine/mine.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/mine/mine.js'), 'utf8');

  assert.match(js, /getCoupleDetail/);
  assert.match(js, /relationState:\s*'none'/);
  assert.match(wxml, /relationState === 'active'/);
  assert.match(wxml, /relationState === 'solo'/);
  assert.match(wxml, /relationState === 'pending_delete'/);
  assert.match(wxml, /单人饭桌已开启/);
});

test('couple detail cloud function returns the current user couple id', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getCoupleData/index.js'), 'utf8');

  assert.match(source, /coupleId: activeCouple \? activeCouple\._id : ''/);
});

test('couple page exposes relationship recovery and dissolution actions', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/couple/couple.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/couple/couple.js'), 'utf8');

  assert.match(js, /dissolveCouple/);
  assert.match(js, /refreshCurrentUser/);
  assert.match(js, /bindtap|dissolve/);
  assert.match(wxml, /解除关系/);
  assert.match(wxml, /30\s*天/);
  assert.match(wxml, /邀请TA恢复关系/);
});

test('relationship retention uses a pending deletion window and scheduled cleanup', () => {
  const dissolve = fs.readFileSync(path.join(__dirname, '../cloudfunctions/dissolveCouple/index.js'), 'utf8');
  const accept = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');
  const createInvite = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createInvite/index.js'), 'utf8');
  const purge = fs.readFileSync(path.join(__dirname, '../cloudfunctions/purgeExpiredCouples/index.js'), 'utf8');
  const trigger = JSON.parse(fs.readFileSync(path.join(__dirname, '../cloudfunctions/purgeExpiredCouples/config.json'), 'utf8'));

  assert.match(dissolve, /pending_delete/);
  assert.match(dissolve, /30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(dissolve, /pendingCoupleId/);
  assert.match(dissolve, /pendingCoupleDeleteAt/);
  assert.match(accept, /status === 'pending_delete'/);
  assert.match(accept, /deleteAt/);
  assert.match(accept, /status: 'active'/);
  assert.match(accept, /const currentCouple = accepter\.coupleId \? await getCouple\(accepter\.coupleId\) : null/);
  assert.match(accept, /canRestoreCouple\(targetCouple, invite, accepter, now\) &&/);
  assert.match(createInvite, /pendingCoupleId/);
  assert.match(purge, /status: 'pending_delete'/);
  assert.match(purge, /collection\('orders'\)/);
  assert.match(purge, /collection\('reviews'\)/);
  assert.equal(Array.isArray(trigger.triggers), true);
  assert.equal(trigger.triggers[0].type, 'timer');
});

test('dissolving a relationship invalidates old active invites and solo mode clears recovery references', () => {
  const dissolve = fs.readFileSync(path.join(__dirname, '../cloudfunctions/dissolveCouple/index.js'), 'utf8');
  const reset = fs.readFileSync(path.join(__dirname, '../cloudfunctions/resetDefaultMenu/index.js'), 'utf8');

  assert.match(dissolve, /invalidateActiveInvites/);
  assert.match(dissolve, /status: 'expired'/);
  assert.match(reset, /event\.mode === 'solo'/);
  assert.match(reset, /pendingCoupleId: ''/);
});

test('dissolved members can still read retained history during the recovery window', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');

  assert.match(source, /pendingCoupleId/);
  assert.match(source, /pending_delete/);
  assert.match(source, /pendingDeleteAt/);
});

test('couple detail does not treat a pending deletion space as active', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getCoupleData/index.js'), 'utf8');
  const orderSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getOrderData/index.js'), 'utf8');

  assert.match(source, /status === 'active'/);
  assert.match(source, /currentMemberIds\.includes\(user\._id\)/);
  assert.match(source, /status === 'pending_delete'/);
  assert.match(orderSource, /user\.coupleId/);
  assert.match(orderSource, /status === 'active'/);
  assert.match(orderSource, /memberIds\.includes\(user\._id\)/);
});
