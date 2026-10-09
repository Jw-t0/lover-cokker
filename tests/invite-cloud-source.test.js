const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('accept invite allows a user with only a personal couple space to join the invite couple', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');

  assert.doesNotMatch(source, /if \(accepter\.coupleId\) throw new Error\('你已经有情侣空间啦'\)/);
  assert.match(source, /async function getCouple/);
  assert.match(source, /function canMoveFromCurrentCouple/);
  assert.match(source, /if \(coupleId && accepter\.coupleId === coupleId\)/);
  assert.match(source, /currentCouple && !canMoveFromCurrentCouple\(currentCouple, accepter\)/);
});

test('invite creation keeps a default-card fallback for incomplete profiles', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createInvite/index.js'), 'utf8');

  assert.match(source, /creatorUserId: user\._id/);
  assert.doesNotMatch(source, /请先完善个人资料/);
});

test('invite records bind an existing couple invite to its remaining partner', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/createInvite/index.js'), 'utf8');

  assert.match(source, /recipientUserId/);
  assert.match(source, /memberIds\.find/);
});

test('accept invite rejects a full couple space and a non-recipient', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');

  assert.match(source, /recipientUserId/);
  assert.match(source, /targetMemberIds\.length >= 2/);
  assert.match(source, /情侣空间已经绑定两个人/);
});

test('accept invite cannot resurrect a deleted couple space', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');

  assert.match(source, /targetCouple\.status/);
  assert.match(source, /!\['active', 'pending_delete'\]\.includes/);
  assert.match(source, /这段关系已经不能恢复啦/);
});

test('invite acceptance is single-use and restores only while both members retain recovery references', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/acceptInvite/index.js'), 'utf8');

  assert.match(source, /claimInvite/);
  assert.match(source, /status: 'processing'/);
  assert.match(source, /db\.runTransaction/);
  assert.match(source, /canRestoreMembers/);
});

test('public invite data projects creator fields instead of returning the database record', () => {
  const source = fs.readFileSync(path.join(__dirname, '../cloudfunctions/getInviteData/index.js'), 'utf8');

  assert.match(source, /function publicUser\(user\)/);
  assert.match(source, /creator: publicUser\(creator\)/);
  assert.match(source, /function publicInvite\(invite\)/);
  assert.match(source, /invite: publicInvite\(invite\)/);
});
