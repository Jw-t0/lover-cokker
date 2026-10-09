const test = require('node:test');
const assert = require('node:assert/strict');

const orderPagePath = require.resolve('../miniprogram/pages/order/order.js');

function loadOrderPageDefinition() {
  const originalPage = global.Page;
  let definition;

  global.Page = (pageDefinition) => {
    definition = pageDefinition;
  };
  delete require.cache[orderPagePath];
  require(orderPagePath);

  if (originalPage === undefined) delete global.Page;
  else global.Page = originalPage;
  return definition;
}

function createPage(definition) {
  const page = {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(nextData) {
      Object.assign(this.data, nextData);
    }
  };
  page.refreshDisplayDishes = () => {};
  return page;
}

function installStorage(t, storage) {
  const originalWx = global.wx;
  global.wx = {
    getStorageSync(key) {
      return storage.get(key);
    },
    setStorageSync(key, value) {
      storage.set(key, value);
    },
    removeStorageSync(key) {
      storage.delete(key);
    }
  };
  t.after(() => {
    if (originalWx === undefined) delete global.wx;
    else global.wx = originalWx;
  });
}

test('order cart survives a guest tab replacement', async (t) => {
  const cart = [
    { dishId: 'dish-1', cartKey: 'dish-1::', name: '番茄炒蛋', price: 18, quantity: 2, subtotal: 36 }
  ];
  const storage = new Map([['pendingOrderDraft', { cart: [], remark: '少油' }]]);
  installStorage(t, storage);

  const definition = loadOrderPageDefinition();
  const originalPage = createPage(definition);
  originalPage.updateCart(cart);

  assert.deepEqual(storage.get('pendingOrderDraft'), { cart, remark: '少油', coupleId: '' });

  const replacementPage = createPage(definition);
  let cartWhenMenuLoads;
  replacementPage.loadData = async () => {
    cartWhenMenuLoads = replacementPage.data.cart;
  };

  await replacementPage.onLoad();

  assert.deepEqual(cartWhenMenuLoads, cart);
  assert.deepEqual(replacementPage.data.summary, { count: 2, totalPrice: 36 });
});

test('clearing the order cart removes its persisted draft', (t) => {
  const storage = new Map([['pendingOrderDraft', { cart: [{ dishId: 'dish-1', quantity: 1 }], remark: '少油' }]]);
  installStorage(t, storage);

  const page = createPage(loadOrderPageDefinition());
  page.updateCart([]);

  assert.equal(storage.has('pendingOrderDraft'), false);
  assert.deepEqual(page.data.summary, { count: 0, totalPrice: 0 });
});
