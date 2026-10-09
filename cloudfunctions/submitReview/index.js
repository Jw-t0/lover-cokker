const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = error && (error.message || error.errMsg || String(error));
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = error && (error.message || error.errMsg || String(error));
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function addReview(review) {
  try {
    return await db.collection('reviews').add({ data: review });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('reviews');
    return db.collection('reviews').add({ data: review });
  }
}

async function findReview(orderId) {
  try {
    const res = await db.collection('reviews').where({ orderId }).limit(1).get();
    return res.data[0] || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const rating = Math.max(1, Math.min(5, Number(event.rating) || 5));
  await ensureCollection('reviews');
  const review = await db.runTransaction(async (transaction) => {
    const orderRes = await transaction.collection('orders').doc(event.orderId).get();
    const order = orderRes.data;
    if (!order) throw new Error('订单不存在');
    if (order.coupleId !== user.coupleId) throw new Error('不能评价别人的订单');
    if (order.guestUserId !== user._id) throw new Error('只有下单人可以评价');
    if (order.status === 'reviewed') throw new Error('这份订单已经评价过啦');
    if (order.status !== 'completed') throw new Error('只有已完成订单可以评价');
    const existing = await transaction.collection('reviews').where({ orderId: event.orderId }).limit(1).get();
    if (existing.data.length) throw new Error('这份订单已经评价过啦');

    const reviewData = {
      orderId: event.orderId,
      coupleId: order.coupleId,
      guestUserId: user._id,
      rating,
      content: String(event.content || '').slice(0, 100),
      createdAt: Date.now()
    };
    const res = await transaction.collection('reviews').add({ data: reviewData });
    const savedReview = { ...reviewData, _id: res._id, id: res._id };
    await transaction.collection('orders').doc(event.orderId).update({
      data: {
        status: 'reviewed',
        review: savedReview,
        reviewedAt: Date.now(),
        updatedAt: Date.now()
      }
    });
    return savedReview;
  });
  return { review };
};
