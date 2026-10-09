const test = require('node:test');
const assert = require('node:assert/strict');
const { DISH_ICON_GROUPS } = require('../miniprogram/data/dish-icons');

test('dish icon catalog provides grouped choices for common meal types', () => {
  assert.ok(DISH_ICON_GROUPS.length >= 8);
  assert.ok(DISH_ICON_GROUPS.every((group) => group.name && group.items.length > 0));

  const icons = DISH_ICON_GROUPS.flatMap((group) => group.items);
  assert.ok(icons.length >= 40);
  assert.equal(new Set(icons).size, icons.length);
});
