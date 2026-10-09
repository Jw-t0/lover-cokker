const test = require('node:test');
const assert = require('node:assert/strict');

function freshRequire(path) {
  delete require.cache[require.resolve(path)];
  return require(path);
}

test('dish service reads shared menu through cloud functions', async () => {
  const calls = [];
  global.wx = {
    cloud: {
      callFunction: async (options) => {
        calls.push(options);
        return {
          result: {
            categories: [{ _id: 'category-1', name: '肉菜' }],
            dishes: [{ _id: 'dish-1', name: '可乐鸡翅', status: 'online' }]
          }
        };
      }
    }
  };

  const { listCategories, listDishes } = freshRequire('../miniprogram/services/dish-service');

  assert.deepEqual(await listCategories('couple-1'), [{ _id: 'category-1', name: '肉菜' }]);
  assert.deepEqual(await listDishes('couple-1', { onlineOnly: true }), [{ _id: 'dish-1', name: '可乐鸡翅', status: 'online' }]);
  assert.deepEqual(calls.map((call) => call.name), ['getMenuData', 'getMenuData']);
  assert.deepEqual(calls.map((call) => call.data), [
    { type: 'categories', coupleId: 'couple-1' },
    { type: 'dishes', coupleId: 'couple-1', onlineOnly: true }
  ]);
});

test('dish mutations are sent through a cloud function', async () => {
  const calls = [];
  global.wx = {
    cloud: {
      callFunction: async (options) => {
        calls.push(options);
        return { result: { ok: true, dish: { _id: 'dish-1', name: '测试小炒' } } };
      }
    }
  };

  const { saveDish, updateDishStatus, deleteDish, createCategory } = freshRequire('../miniprogram/services/dish-service');

  await saveDish({ name: '测试小炒', price: 19 });
  await updateDishStatus('dish-1', 'offline');
  await deleteDish('dish-1');
  await createCategory('夜宵');

  assert.deepEqual(calls.map((call) => call.name), ['manageDish', 'manageDish', 'manageDish', 'manageDish']);
  assert.deepEqual(calls.map((call) => call.data.action), ['save', 'status', 'delete', 'createCategory']);
  assert.deepEqual(calls.at(-1).data.category, { name: '夜宵' });
});

test('invite details are loaded through a cloud function', async () => {
  const calls = [];
  global.wx = {
    cloud: {
      callFunction: async (options) => {
        calls.push(options);
        return { result: { invite: { inviteCode: 'ABC123', creatorUserId: 'user-1' } } };
      }
    }
  };

  const { getInvite } = freshRequire('../miniprogram/services/couple-service');

  assert.deepEqual(await getInvite('ABC123'), { inviteCode: 'ABC123', creatorUserId: 'user-1' });
  assert.deepEqual(calls, [{ name: 'getInviteData', data: { inviteCode: 'ABC123' } }]);
});

test('order service sends role scoped order queries', async () => {
  const calls = [];
  global.wx = {
    cloud: {
      callFunction: async (options) => {
        calls.push(options);
        return { result: { activeOrder: null, history: [], stats: {} } };
      }
    }
  };

  const { getActiveOrder, listHistory, getOrderStats } = freshRequire('../miniprogram/services/order-service');

  await getActiveOrder('guest');
  await getActiveOrder('chef');
  await listHistory('guest');
  await getOrderStats();

  assert.deepEqual(calls.map((call) => call.data), [
    { type: 'active', role: 'guest' },
    { type: 'active', role: 'chef' },
    { type: 'history', role: 'guest' },
    { type: 'stats', role: 'all' }
  ]);
});

test('couple details are loaded through a cloud function', async () => {
  const calls = [];
  global.wx = {
    cloud: {
      callFunction: async (options) => {
        calls.push(options);
        return { result: { couple: { _id: 'couple-1' }, partner: { nickname: '小厨师' } } };
      }
    }
  };

  const { getCoupleDetail } = freshRequire('../miniprogram/services/couple-service');

  assert.deepEqual(await getCoupleDetail(), { couple: { _id: 'couple-1' }, partner: { nickname: '小厨师' } });
  assert.deepEqual(calls, [{ name: 'getCoupleData', data: {} }]);
});
