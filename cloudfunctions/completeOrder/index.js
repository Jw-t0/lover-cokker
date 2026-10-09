const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const order = await db.runTransaction(async (transaction) => {
    const orderRes = await transaction.collection('orders').doc(event.orderId).get();
    const currentOrder = orderRes.data;
    if (!currentOrder || currentOrder.coupleId !== user.coupleId) throw new Error('不能操作别人的订单');
    const isSoloDemoOrder = currentOrder.soloMode && currentOrder.guestUserId === user._id && currentOrder.chefUserId === user._id;
    if (currentOrder.guestUserId === user._id && !isSoloDemoOrder) throw new Error('下单者不能完成自己的订单');
    if (currentOrder.chefUserId !== user._id) throw new Error('只有接单的伴侣可以完成订单');
    if (currentOrder.status !== 'accepted') throw new Error('只有制作中订单可以完成');
    await transaction.collection('orders').doc(event.orderId).update({
      data: {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now()
      }
    });
    return currentOrder;
  });
  for (const item of order.items || []) {
    if (item.dishId) {
      await db.collection('dishes').doc(item.dishId).update({ data: { salesCount: _.inc(Number(item.quantity || 0)) } }).catch(() => {});
    }
  }
  return { ok: true };
};
