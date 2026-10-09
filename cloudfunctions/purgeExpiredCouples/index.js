const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

function isCollectionMissing(error) {
  const message = error && (error.message || error.errMsg || String(error));
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function listExpiredCouples(now) {
  try {
    return await db.collection('couples').where({ status: 'pending_delete', deleteAt: _.lte(now) }).get();
  } catch (error) {
    if (isCollectionMissing(error)) return { data: [] };
    throw error;
  }
}

async function listByCouple(collection, coupleId) {
  try {
    return await db.collection(collection).where({ coupleId }).get();
  } catch (error) {
    if (isCollectionMissing(error)) return { data: [] };
    throw error;
  }
}

async function clearPendingReference(memberId, coupleId, now) {
  try {
    const res = await db.collection('users').doc(memberId).get();
    if (!res.data || res.data.pendingCoupleId !== coupleId) return;
    await db.collection('users').doc(memberId).update({
      data: { pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: now }
    });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
  }
}

async function purgeCouple(couple, now) {
  const [orders, reviews] = await Promise.all([
    listByCouple('orders', couple._id),
    listByCouple('reviews', couple._id)
  ]);
  await Promise.all([
    ...orders.data.map((item) => db.collection('orders').doc(item._id).remove()),
    ...reviews.data.map((item) => db.collection('reviews').doc(item._id).remove()),
    ...(Array.isArray(couple.memberIds) ? couple.memberIds : []).map((memberId) => clearPendingReference(memberId, couple._id, now)),
    db.collection('couples').doc(couple._id).update({
      data: { status: 'deleted', deletedAt: now, updatedAt: now }
    })
  ]);
  return { orders: orders.data.length, reviews: reviews.data.length };
}

exports.main = async () => {
  const now = Date.now();
  const expired = await listExpiredCouples(now);
  const results = await Promise.all(expired.data.map((couple) => purgeCouple(couple, now)));
  return {
    ok: true,
    couples: expired.data.length,
    orders: results.reduce((total, item) => total + item.orders, 0),
    reviews: results.reduce((total, item) => total + item.reviews, 0)
  };
};
