const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = String((error && (error.message || error.errMsg)) || error || '');
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureFruitCategory(coupleId) {
  try {
    const res = await db.collection('categories').where({ coupleId, name: '水果' }).limit(1).get();
    if (res.data.length) return;
    await db.collection('categories').add({
      data: {
        coupleId,
        name: '水果',
        sort: 9,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('categories');
    await db.collection('categories').add({
      data: {
        coupleId,
        name: '水果',
        sort: 9,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  }
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

function assertCoupleAccess(user, coupleId) {
  if (!coupleId || user.coupleId !== coupleId) throw new Error('不能查看别人的菜单');
}

async function listCategories(coupleId) {
  try {
    const res = await db.collection('categories').where({ coupleId }).orderBy('sort', 'asc').get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return [];
    throw error;
  }
}

async function listDishes(coupleId, onlineOnly) {
  const query = { coupleId, isDeleted: false };
  if (onlineOnly) query.status = 'online';
  try {
    const res = await db.collection('dishes').where(query).orderBy('createdAt', 'desc').get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return [];
    throw error;
  }
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const type = event.type || 'all';

  if (type === 'dish') {
    const res = await db.collection('dishes').doc(event.dishId).get();
    if (res.data.coupleId !== user.coupleId) throw new Error('不能查看别人的菜品');
    return { dish: res.data };
  }

  const coupleId = event.coupleId || user.coupleId;
  assertCoupleAccess(user, coupleId);
  await ensureFruitCategory(coupleId);

  if (type === 'categories') {
    return { categories: await listCategories(coupleId) };
  }
  if (type === 'dishes') {
    return { dishes: await listDishes(coupleId, !!event.onlineOnly) };
  }

  const [categories, dishes] = await Promise.all([
    listCategories(coupleId),
    listDishes(coupleId, !!event.onlineOnly)
  ]);
  return { categories, dishes };
};
