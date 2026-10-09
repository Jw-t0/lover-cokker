const { call } = require('./cloud');

async function listCategories(coupleId) {
  const result = await call('getMenuData', { type: 'categories', coupleId });
  return result.categories || [];
}

async function listDishes(coupleId, options = {}) {
  const result = await call('getMenuData', { type: 'dishes', coupleId, onlineOnly: !!options.onlineOnly });
  return result.dishes || [];
}

async function getDish(dishId) {
  const result = await call('getMenuData', { type: 'dish', dishId });
  return result.dish;
}

async function saveDish(dish) {
  const result = await call('manageDish', { action: 'save', dish });
  return result.dish;
}

async function updateDishStatus(id, status) {
  return call('manageDish', { action: 'status', id, status });
}

async function deleteDish(id) {
  return call('manageDish', { action: 'delete', id });
}

async function resetDefaultMenu(options = {}) {
  return call('resetDefaultMenu', options);
}

async function createCategory(name) {
  const result = await call('manageDish', { action: 'createCategory', category: { name } });
  return result.category;
}

module.exports = {
  listCategories,
  listDishes,
  getDish,
  saveDish,
  updateDishStatus,
  deleteDish,
  resetDefaultMenu,
  createCategory
};
