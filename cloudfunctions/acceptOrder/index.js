const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  await db.runTransaction(async (transaction) => {
    const orderRes = await transaction.collection('orders').doc(event.orderId).get();
    const order = orderRes.data;
    if (!order || order.coupleId !== user.coupleId) throw new Error('不能操作别人的订单');
    if (order.guestUserId === user._id && !order.soloMode) throw new Error('下单者不能接自己的订单');
    if (order.status !== 'pending') throw new Error('只有待接单订单可以接单');
    await transaction.collection('orders').doc(event.orderId).update({
      data: {
        status: 'accepted',
        chefUserId: user._id,
        chefName: user.nickname || '',
        acceptedAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  });
  return { ok: true };
};
