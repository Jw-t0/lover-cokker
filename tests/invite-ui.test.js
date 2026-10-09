const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isSelfInvite } = require('../miniprogram/utils/domain/invite');

test('detects when the current user opens their own invite', () => {
  assert.equal(isSelfInvite({ id: 'user-1' }, { creatorUserId: 'user-1' }), true);
  assert.equal(isSelfInvite({ id: 'user-1' }, { creatorUserId: 'user-2' }), false);
  assert.equal(isSelfInvite(null, { creatorUserId: 'user-1' }), false);
});

test('invite creator can forward the invite through WeChat share', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');

  assert.match(wxml, /open-type="share"/);
  assert.match(js, /onShareAppMessage\(\)/);
  assert.match(js, /path:\s*`\/pages\/invite\/invite\?code=\$\{this\.data\.code\}`/);
});

test('invite page separates creator forwarding and recipient response actions', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');

  assert.match(wxml, /wx:if="{{selfInvite}}"[\s\S]*open-type="share"/);
  assert.match(
    wxml,
    /<view wx:else class="recipient-actions">[\s\S]*bindtap="accept"[\s\S]*<button(?=[^>]*class="later")(?=[^>]*bindtap="later")[^>]*>暂不接受<\/button>[\s\S]*<\/view>/
  );
});

test('invite page resolves the creator cloud avatar for the viewer', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');

  assert.match(js, /wx\.cloud\.getTempFileURL\(/);
  assert.match(js, /fileList:\s*\[creator\.avatarUrl\]/);
  assert.match(js, /tempFileURL/);
});

test('invite page uses friendly defaults when the creator skips profile setup', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');

  assert.match(wxml, /creator\.nickname && creator\.nickname !== '还没有昵称'/);
  assert.match(js, /nickname !== '还没有昵称'/);
});

test('invite page prepares a new invite after navigating into its loading state', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');

  assert.match(js, /createInvite/);
  assert.match(js, /pending === '1'/);
  assert.match(js, /loading:\s*true/);
  assert.match(wxml, /invite-loading-card/);
  assert.match(wxml, /正在准备邀请卡/);
});

test('invite page has explicit unavailable and retry states', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');

  assert.match(js, /inviteError/);
  assert.match(js, /retryLoad/);
  assert.match(wxml, /邀请暂时打不开/);
  assert.match(js, /邀请已经过期/);
  assert.match(wxml, /wx:if="\{\{canAccept\}\}"/);
});

test('invite page hides acceptance from a non-recipient', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.wxml'), 'utf8');

  assert.match(js, /recipientUserId/);
  assert.match(js, /!recipientMismatch/);
  assert.match(wxml, /\{\{unavailableReason\}\}/);
});

test('invite page handles a deleted target couple before accepting', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');
  const cloud = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getInviteData/index.js'), 'utf8');

  assert.match(js, /targetCoupleStatus/);
  assert.match(cloud, /targetCoupleStatus/);
  assert.match(js, /这段关系已经不能恢复啦/);
});

test('accepting an invite refreshes the cached current user before leaving the invite page', () => {
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/invite/invite.js'), 'utf8');

  assert.match(js, /refreshCurrentUser/);
  assert.match(js, /await refreshCurrentUser\(\)/);
});
