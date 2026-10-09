const test = require('node:test');
const assert = require('node:assert/strict');
const { addDishToCart, changeCartQuantity, summarizeCart } = require('../miniprogram/utils/domain/cart');

test('adds dishes and calculates totals', () => {
  let cart = [];
  cart = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28, imageUrl: '/x.png' });
  cart = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28, imageUrl: '/x.png' });
  cart = addDishToCart(cart, { id: 'dish-2', name: '土豆炖牛腩', price: 38, imageUrl: '/y.png' });

  assert.deepEqual(summarizeCart(cart), { count: 3, totalPrice: 94 });
  assert.equal(cart[0].quantity, 2);
  assert.equal(cart[0].subtotal, 56);
});

test('removes an item when quantity reaches zero', () => {
  let cart = [{ dishId: 'dish-1', name: '可乐鸡翅', price: 28, quantity: 1, subtotal: 28, imageUrl: '/x.png' }];

  cart = changeCartQuantity(cart, 'dish-1', -1);

  assert.deepEqual(cart, []);
});

test('summarizes cart items without a stored subtotal', () => {
  const cart = [{ dishId: 'dish-1', name: '可乐鸡翅', price: 28, quantity: 2 }];

  assert.deepEqual(summarizeCart(cart), { count: 2, totalPrice: 56 });
});

test('keeps the same dish with different tastes as separate cart rows', () => {
  let cart = [];
  cart = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28, selectedTastes: ['少辣'] });
  cart = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28, selectedTastes: ['多葱'] });
  cart = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28, selectedTastes: ['少辣'] });

  assert.equal(cart.length, 2);
  assert.equal(cart[0].quantity, 2);
  assert.deepEqual(cart.map((item) => item.tasteText), ['少辣', '多葱']);
  assert.deepEqual(summarizeCart(cart), { count: 3, totalPrice: 84 });
});

test('treats the same taste combination as one row regardless of selection order', () => {
  const dish = { id: 'dish-1', name: '番茄炒蛋', price: 18 };
  const first = addDishToCart([], { ...dish, selectedTastes: ['少辣', '少油'] });
  const second = addDishToCart(first, { ...dish, selectedTastes: ['少油', '少辣'] });

  assert.equal(second.length, 1);
  assert.equal(second[0].quantity, 2);
});

test('decreases only one taste row when reducing from a dish card', () => {
  const cart = [
    { dishId: 'dish-1', cartKey: 'dish-1::少辣', name: '可乐鸡翅', price: 28, quantity: 2, subtotal: 56, selectedTastes: ['少辣'] },
    { dishId: 'dish-1', cartKey: 'dish-1::多葱', name: '可乐鸡翅', price: 28, quantity: 1, subtotal: 28, selectedTastes: ['多葱'] }
  ];

  const next = changeCartQuantity(cart, 'dish-1', -1);

  assert.deepEqual(next.map((item) => item.quantity), [1, 1]);
});

test('caps one taste row at 99 portions', () => {
  const cart = [{ dishId: 'dish-1', cartKey: 'dish-1::', name: '可乐鸡翅', price: 28, quantity: 99, subtotal: 2772 }];

  const next = addDishToCart(cart, { id: 'dish-1', name: '可乐鸡翅', price: 28 });

  assert.equal(next[0].quantity, 99);
  assert.equal(next[0].subtotal, 2772);
});
