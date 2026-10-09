const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { isProfileComplete } = require('../miniprogram/utils/domain/profile');

test('app launch preloads the current user for profile autofill', () => {
  const source = fs.readFileSync(path.join(__dirname, '../miniprogram/app.js'), 'utf8');

  assert.match(source, /require\('\.\/services\/user-service'\)/);
  assert.match(source, /this\.globalData\.userReady\s*=\s*getCurrentUser\(\{\s*app:\s*this\s*\}\)/);
  assert.match(source, /\.catch\(\(error\)\s*=>\s*\{/);
});

test('profile page fills the form from the current user when it loads', () => {
  const source = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/profile/profile.js'), 'utf8');

  assert.match(source, /await getCurrentUser\(\)/);
  assert.match(source, /avatarUrl:\s*user\.avatarUrl \|\| ''/);
  assert.match(source, /nickname:\s*user\.nickname \|\| ''/);
  assert.match(source, /count:\s*\(user\.nickname \|\| ''\)\.length/);
});

test('profile uploads temporary avatars before saving a shareable file id', () => {
  const source = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/profile/profile.js'), 'utf8');

  assert.match(source, /await wx\.cloud\.uploadFile\(/);
  assert.match(source, /cloudPath/);
  assert.match(source, /filePath:/);
  assert.match(source, /fileID/);
});

test('profile completeness requires a real nickname and avatar', () => {
  assert.equal(isProfileComplete({ nickname: '小厨师', avatarUrl: 'cloud://avatar' }), true);
  assert.equal(isProfileComplete({ nickname: '小厨师', avatarUrl: '' }), false);
  assert.equal(isProfileComplete({ nickname: '还没有昵称', avatarUrl: 'cloud://avatar' }), false);
});

test('profile page validates the invite-specific completeness requirement', () => {
  const source = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/profile/profile.js'), 'utf8');
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/pages/profile/profile.wxml'), 'utf8');

  assert.match(source, /fromInvite/);
  assert.match(source, /isProfileComplete/);
  assert.match(source, /pages\/invite\/invite\?pending=1/);
  assert.match(wxml, /fromInvite/);
});
