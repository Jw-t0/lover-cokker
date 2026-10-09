const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = error && (error.message || error.errMsg || String(error));
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function listByCouple(collection, coupleId) {
  try {
    return await db.collection(collection).where({ coupleId }).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    return { data: [] };
  }
}

exports.main = async () => {
  if (process.env.ALLOW_ORDER_RESET !== 'true') throw new Error('订单清理功能未开放');
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  if (!user.coupleId) return { ok: true, removed: 0 };
  const [orders, reviews] = await Promise.all([
    listByCouple('orders', user.coupleId),
    listByCouple('reviews', user.coupleId)
  ]);
  await Promise.all(orders.data.map((item) => db.collection('orders').doc(item._id).remove()));
  await Promise.all(reviews.data.map((item) => db.collection('reviews').doc(item._id).remove()));
  return { ok: true, removed: orders.data.length };
};
