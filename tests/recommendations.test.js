const test = require('node:test');
const assert = require('node:assert/strict');
const { pickRandomDishes } = require('../miniprogram/utils/domain/recommendations');

test('picks at most the requested number without mutating the source list', () => {
  const dishes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const original = dishes.slice();

  const result = pickRandomDishes(dishes, 3, () => 0);

  assert.equal(result.length, 3);
  assert.deepEqual(dishes, original);
  assert.equal(new Set(result.map((dish) => dish.id)).size, 3);
});

test('returns all dishes when fewer than three are available', () => {
  const dishes = [{ id: 'a' }, { id: 'b' }];

  assert.deepEqual(pickRandomDishes(dishes, 3, () => 0.5), dishes);
});
