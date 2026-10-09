const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateStoreStats } = require('../miniprogram/utils/domain/stats');

test('calculates store score, completed count, review count, and most popular dish', () => {
  const stats = calculateStoreStats({
    orders: [
      { status: 'reviewed', items: [{ dishId: 'a', name: '可乐鸡翅', quantity: 2 }] },
      { status: 'completed', items: [{ dishId: 'b', name: '番茄炒蛋', quantity: 1 }] },
      { status: 'cancelled', items: [{ dishId: 'a', name: '可乐鸡翅', quantity: 10 }] }
    ],
    reviews: [
      { rating: 5 },
      { rating: 4 }
    ]
  });

  assert.deepEqual(stats, {
    rating: 4.5,
    completedCount: 2,
    reviewCount: 2,
    favoriteDish: '可乐鸡翅'
  });
});
