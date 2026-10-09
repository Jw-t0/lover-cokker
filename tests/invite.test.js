const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInviteAcceptance } = require('../miniprogram/utils/domain/invite');

test('rejects accepting your own invite', () => {
  const result = validateInviteAcceptance({
    invite: { creatorUserId: 'user-1', status: 'active', expireAt: 2000 },
    accepter: { id: 'user-1' },
    now: 1000
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'SELF_INVITE');
});

test('accepts an active invite for an unbound different user', () => {
  const result = validateInviteAcceptance({
    invite: { creatorUserId: 'user-1', status: 'active', expireAt: 2000 },
    accepter: { id: 'user-2' },
    now: 1000
  });

  assert.equal(result.ok, true);
});

test('rejects an invite that would add a third member to a couple space', () => {
  const result = validateInviteAcceptance({
    invite: { creatorUserId: 'user-1', status: 'active', expireAt: 2000 },
    accepter: { id: 'user-3' },
    targetCouple: { memberIds: ['user-1', 'user-2'], status: 'active' },
    now: 1000
  });

  assert.deepEqual(result, { ok: false, reason: 'COUPLE_FULL' });
});
