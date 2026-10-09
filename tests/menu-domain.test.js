const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_CATEGORIES } = require('../miniprogram/utils/constants');
const { buildMenuTabState, groupDishesByCategory, hasDuplicateDishName, parseTagText, withDishDefaults } = require('../miniprogram/utils/domain/menu');

test('default categories include fruit', () => {
  assert.equal(DEFAULT_CATEGORIES.some((category) => category.name === '水果'), true);
});

test('groups dishes by category order and keeps empty categories visible', () => {
  const groups = groupDishesByCategory({
    categories: [
      { _id: 'c1', name: '主食' },
      { _id: 'c2', name: '水果' }
    ],
    dishes: [
      { _id: 'd1', name: '苹果切盘', categoryId: 'c2' },
      { _id: 'd2', name: '牛腩饭', categoryId: 'c1' }
    ]
  });

  assert.deepEqual(groups.map((group) => ({ name: group.name, count: group.dishes.length })), [
    { name: '主食', count: 1 },
    { name: '水果', count: 1 }
  ]);
});

test('builds menu tab state with a stable selected category', () => {
  const state = buildMenuTabState({
    categories: [
      { _id: 'c1', name: '主食' },
      { _id: 'c2', name: '水果' }
    ],
    dishes: [
      { _id: 'd1', name: '苹果切盘', categoryId: 'c2' },
      { _id: 'd2', name: '牛腩饭', categoryId: 'c1' }
    ],
    selectedCategoryId: 'missing'
  });

  assert.equal(state.selectedCategoryId, 'c1');
  assert.equal(state.selectedGroup.name, '主食');
  assert.deepEqual(state.selectedGroup.dishes.map((dish) => dish.name), ['牛腩饭']);
});

test('detects duplicate dish names in the same couple menu while allowing the same dish during edit', () => {
  const dishes = [
    { _id: 'd1', name: '可乐鸡翅', isDeleted: false },
    { _id: 'd2', name: '番茄炒蛋', isDeleted: false }
  ];

  assert.equal(hasDuplicateDishName(dishes, ' 可乐鸡翅 '), true);
  assert.equal(hasDuplicateDishName(dishes, '可乐鸡翅', 'd1'), false);
  assert.equal(hasDuplicateDishName(dishes, '糖拌番茄'), false);
});

test('parses comma separated form tags into clean unique values', () => {
  assert.deepEqual(parseTagText('微辣, 少油，微辣  不葱'), ['微辣', '少油', '不葱']);
});

test('adds default taste options for old dishes', () => {
  const dish = withDishDefaults({ _id: 'd1', name: '旧菜品' });

  assert.deepEqual(dish.tasteOptions, ['少辣', '不辣', '少油']);
});
