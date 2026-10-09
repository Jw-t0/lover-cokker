const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = String((error && (error.message || error.errMsg)) || error || '');
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function getDish(id) {
  const res = await db.collection('dishes').doc(id).get();
  return res.data;
}

async function assertDishAccess(user, id) {
  const dish = await getDish(id);
  if (dish.coupleId !== user.coupleId) throw new Error('不能操作别人的菜品');
  return dish;
}

async function assertCategoryAccess(user, categoryId) {
  const res = await db.collection('categories').doc(categoryId).get();
  if (res.data.coupleId !== user.coupleId) throw new Error('不能使用别人的分类');
}

async function assertUniqueCategoryName(user, name) {
  let res;
  try {
    res = await db.collection('categories').where({ coupleId: user.coupleId, name }).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('categories');
    return;
  }
  if (res.data.length) throw new Error('这个分类已经存在啦');
}

async function getNextCategorySort(coupleId) {
  let res;
  try {
    res = await db.collection('categories').where({ coupleId }).orderBy('sort', 'desc').limit(1).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('categories');
    return 1;
  }
  const latest = res.data[0];
  return Number(latest && latest.sort ? latest.sort : 0) + 1;
}

function parseTagText(text) {
  return String(text || '')
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function normalizeDish(input, user) {
  const dish = input || {};
  const name = String(dish.name || '').trim().slice(0, 12);
  if (!name) throw new Error('菜名不能为空');
  if (!dish.categoryId) throw new Error('请选择分类');
  const price = Number(dish.price);
  if (!Number.isFinite(price) || price < 0 || price > 999) throw new Error('价格需为 0-999');
  return {
    coupleId: user.coupleId,
    categoryId: dish.categoryId,
    name,
    description: String(dish.description || '').trim().slice(0, 30),
    price,
    imageUrl: dish.imageUrl || '',
    emoji: dish.emoji || '🍽️',
    method: String(dish.method || '').trim().slice(0, 300),
    ingredients: String(dish.ingredients || '').trim().slice(0, 200),
    tasteOptions: Array.isArray(dish.tasteOptions)
      ? dish.tasteOptions.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 12)
      : parseTagText(dish.tasteOptionsText).slice(0, 12),
    status: dish.status === 'offline' ? 'offline' : 'online',
    isDeleted: false,
    salesCount: Number(dish.salesCount || 0)
  };
}

async function assertUniqueDishName(user, name, currentId) {
  let res;
  try {
    res = await db.collection('dishes').where({ coupleId: user.coupleId, name, isDeleted: false }).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('dishes');
    return;
  }
  const duplicated = res.data.some((dish) => dish._id !== currentId);
  if (duplicated) throw new Error('这道菜已经存在啦，换个名字吧');
}

async function saveDish(user, dish) {
  if (!user.coupleId) throw new Error('请先重置默认菜单，开启情侣小饭桌');
  const payload = normalizeDish(dish, user);
  await assertCategoryAccess(user, payload.categoryId);
  await assertUniqueDishName(user, payload.name, dish.id);

  if (dish.id) {
    await assertDishAccess(user, dish.id);
    const data = { ...payload, updatedAt: Date.now() };
    await db.collection('dishes').doc(dish.id).update({ data });
    return { ...data, _id: dish.id, id: dish.id };
  }

  let res;
  const data = { ...payload, createdAt: Date.now(), updatedAt: Date.now() };
  try {
    res = await db.collection('dishes').add({ data });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('dishes');
    res = await db.collection('dishes').add({ data });
  }
  return { ...data, _id: res._id, id: res._id };
}

async function createCategory(user, category) {
  if (!user.coupleId) throw new Error('请先重置默认菜单，开启情侣小饭桌');
  const name = String((category && category.name) || '').trim().slice(0, 8);
  if (!name) throw new Error('分类名不能为空');
  await assertUniqueCategoryName(user, name);
  const now = Date.now();
  const data = {
    coupleId: user.coupleId,
    name,
    sort: await getNextCategorySort(user.coupleId),
    createdAt: now,
    updatedAt: now
  };
  const res = await db.collection('categories').add({ data });
  return { ...data, _id: res._id, id: res._id };
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const action = event.action;

  if (action === 'save') {
    return { dish: await saveDish(user, event.dish || {}) };
  }

  if (action === 'createCategory') {
    return { category: await createCategory(user, event.category || {}) };
  }

  if (action === 'status') {
    await assertDishAccess(user, event.id);
    const status = event.status === 'offline' ? 'offline' : 'online';
    await db.collection('dishes').doc(event.id).update({ data: { status, updatedAt: Date.now() } });
    return { ok: true };
  }

  if (action === 'delete') {
    await assertDishAccess(user, event.id);
    await db.collection('dishes').doc(event.id).update({ data: { isDeleted: true, updatedAt: Date.now() } });
    return { ok: true };
  }

  throw new Error('未知菜品操作');
};
