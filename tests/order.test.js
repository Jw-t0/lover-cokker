const test = require('node:test');
const assert = require('node:assert/strict');
const { canCreateOrder, nextOrderStatus, createOrderSnapshot } = require('../miniprogram/utils/domain/order');

test('allows ordering again because active orders accept added dishes', () => {
  const activeOrders = [{ id: 'order-1', status: 'accepted' }];

  assert.equal(canCreateOrder(activeOrders), true);
});

test('allows the expected order state transitions', () => {
  assert.equal(nextOrderStatus('pending', 'accept'), 'accepted');
  assert.equal(nextOrderStatus('accepted', 'complete'), 'completed');
  assert.equal(nextOrderStatus('completed', 'review'), 'reviewed');
  assert.equal(nextOrderStatus('pending', 'cancel'), 'cancelled');
});

test('creates an immutable order item snapshot from cart', () => {
  const order = createOrderSnapshot({
    coupleId: 'couple-1',
    guestUserId: 'user-1',
    cart: [{ dishId: 'dish-1', cartKey: 'dish-1::少辣', name: '番茄炒蛋', price: 16, quantity: 2, subtotal: 32, imageUrl: '/tomato.png', selectedTastes: ['少辣'], tasteText: '少辣' }],
    remark: '少油'
  });

  assert.equal(order.totalPrice, 32);
  assert.equal(order.status, 'pending');
  assert.equal(order.items[0].name, '番茄炒蛋');
  assert.deepEqual(order.items[0].selectedTastes, ['少辣']);
  assert.equal(order.remark, '少油');
});
