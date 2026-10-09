const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('profile choice sheet offers completion or direct invite with a clear warning', () => {
  const wxml = fs.readFileSync(path.join(__dirname, '../miniprogram/components/profile-choice-sheet/profile-choice-sheet.wxml'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '../miniprogram/components/profile-choice-sheet/profile-choice-sheet.js'), 'utf8');
  const wxss = fs.readFileSync(path.join(__dirname, '../miniprogram/components/profile-choice-sheet/profile-choice-sheet.wxss'), 'utf8');

  assert.match(wxml, /填写个人资料/);
  assert.match(wxml, /直接发送/);
  assert.match(wxml, /默认头像和昵称/);
  assert.match(wxml, /bindtap="chooseProfile"/);
  assert.match(wxml, /bindtap="chooseDirect"/);
  assert.match(js, /triggerEvent\('complete'\)/);
  assert.match(js, /triggerEvent\('direct'\)/);
  assert.match(wxss, /position:\s*fixed/);
});
