const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const APPENDABLE_STATUSES = ['pending', 'accepted'];
const NOTIFY_TIMEOUT_MS = 1200;

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
  let res;
  try {
    res = await db.collection('users').where({ openid }).limit(1).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('users');
    throw new Error('USER_NOT_FOUND');
  }
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function ensureCouple(user) {
  if (user.coupleId) return user.coupleId;
  const data = {
    memberIds: [user._id],
    status: 'active',
    createdBy: user._id,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  let res;
  try {
    res = await db.collection('couples').add({ data });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('couples');
    res = await db.collection('couples').add({ data });
  }
  const userUpdate = { coupleId: res._id, updatedAt: Date.now() };
  if (user.pendingCoupleId) {
    userUpdate.pendingCoupleId = '';
    userUpdate.pendingCoupleDeleteAt = 0;
  }
  await db.collection('users').doc(user._id).update({ data: userUpdate });
  return res._id;
}

async function getCouple(coupleId) {
  try {
    const res = await db.collection('couples').doc(coupleId).get();
    return res.data || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

async function getUser(userId) {
  if (!userId) return null;
  try {
    const res = await db.collection('users').doc(userId).get();
    return res.data || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

async function findPartner(coupleId, userId) {
  const couple = await getCouple(coupleId);
  const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
  if (memberIds.length > 2) throw new Error('情侣空间成员异常，请重新绑定后再下单');
  const partnerId = memberIds.find((id) => id && id !== userId);
  return getUser(partnerId);
}

async function findAppendableOrder(coupleId, guestUserId) {
  try {
    return await db.collection('orders').where({
      coupleId,
      guestUserId,
      status: _.in(APPENDABLE_STATUSES)
    }).orderBy('createdAt', 'desc').limit(1).get();
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('orders');
    return { data: [] };
  }
}

async function addOrder(order) {
  try {
    return await db.collection('orders').add({ data: order });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('orders');
    return db.collection('orders').add({ data: order });
  }
}

async function loadTrustedItems(cart, coupleId) {
  if (!Array.isArray(cart) || !cart.length) throw new Error('先选一道想吃的菜吧');

  let result;
  try {
    result = await db.collection('dishes').where({
      coupleId,
      isDeleted: false,
      status: 'online'
    }).get();
  } catch (error) {
    if (isCollectionMissing(error)) throw new Error('菜单还没准备好，请先刷新菜单再试');
    throw error;
  }

  const dishes = new Map((result.data || []).map((dish) => [dish._id, dish]));
  const trustedItems = cart.map((item) => {
    const dish = dishes.get(item && item.dishId);
    if (!dish) throw new Error('有菜品刚刚下架了，请刷新菜单后再试');

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new Error('菜品数量需为 1-99 份');
    }

    const allowedTastes = Array.isArray(dish.tasteOptions) ? dish.tasteOptions.map((taste) => String(taste)) : [];
    const selectedTastes = Array.from(new Set(
      (Array.isArray(item.selectedTastes) ? item.selectedTastes : [])
        .map((taste) => String(taste || '').trim())
        .filter((taste) => allowedTastes.includes(taste))
    ));
    const price = Number(dish.price);
    const subtotal = price * quantity;
    const tasteText = selectedTastes.join('、');

    return {
      dishId: dish._id,
      cartKey: `${dish._id}::${selectedTastes.slice().sort().join('|')}`,
      name: dish.name,
      price,
      quantity,
      subtotal,
      imageUrl: dish.imageUrl || '',
      emoji: dish.emoji || '',
      selectedTastes,
      tasteText
    };
  });

  const merged = [];
  trustedItems.forEach((item) => {
    const existing = merged.find((candidate) => candidate.cartKey === item.cartKey);
    if (!existing) {
      merged.push(item);
      return;
    }
    existing.quantity += item.quantity;
    if (existing.quantity > 99) throw new Error('同一道菜最多 99 份');
    existing.subtotal = existing.price * existing.quantity;
  });
  return merged;
}

function mergeOrderItems(currentItems, addedItems) {
  const merged = [...(Array.isArray(currentItems) ? currentItems : [])];
  addedItems.forEach((item) => {
    const key = item.cartKey || item.dishId;
    const existing = merged.find((mergedItem) => (mergedItem.cartKey || mergedItem.dishId) === key);
    if (!existing) {
      merged.push(item);
      return;
    }
    existing.quantity = Number(existing.quantity || 0) + Number(item.quantity || 0);
    existing.subtotal = Number(existing.subtotal || 0) + Number(item.subtotal || 0);
  });
  return merged;
}

function mergeRemark(existingRemark, addedRemark) {
  const existing = existingRemark && existingRemark !== '没有备注' ? String(existingRemark).trim() : '';
  const added = addedRemark && addedRemark !== '没有备注' ? String(addedRemark).trim() : '';
  if (!existing) return added || '没有备注';
  if (!added || existing.includes(added)) return existing;
  return `${existing}、${added}`;
}

async function appendItemsToOrder(order, items, remark, soloMode, user, store = db) {
  const nextItems = mergeOrderItems(order.items, items);
  if (nextItems.some((item) => Number(item.quantity || 0) > 99)) {
    throw new Error('同一道菜最多 99 份');
  }
  const totalPrice = nextItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const data = {
    items: nextItems,
    totalPrice,
    remark: mergeRemark(order.remark, remark),
    updatedAt: Date.now()
  };
  if (soloMode) {
    data.soloMode = true;
    data.chefUserId = user._id;
    data.chefName = user.nickname || '';
  }
  await store.collection('orders').doc(order._id).update({ data });
  return {
    ...order,
    ...data,
    id: order._id
  };
}

async function appendToCurrentOrder(orderId, items, remark, soloMode, user) {
  return db.runTransaction(async (transaction) => {
    const currentRes = await transaction.collection('orders').doc(orderId).get();
    const currentOrder = currentRes.data;
    if (!currentOrder || !APPENDABLE_STATUSES.includes(currentOrder.status)) {
      throw new Error('这份订单已经不能加菜了，请重新点菜');
    }
    return appendItemsToOrder(currentOrder, items, remark, soloMode, user, transaction);
  });
}

async function createOrAppendOrder(coupleId, user, items, remark, soloMode) {
  return db.runTransaction(async (transaction) => {
    const activeRes = await transaction.collection('orders').where({
      coupleId,
      status: _.in(APPENDABLE_STATUSES)
    }).orderBy('createdAt', 'desc').limit(1).get();
    if (activeRes.data.length) {
      const order = await appendItemsToOrder(activeRes.data[0], items, remark, soloMode, user, transaction);
      return { order, appended: true, mode: 'append' };
    }

    const totalPrice = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const order = {
      coupleId,
      guestUserId: user._id,
      guestName: user.nickname || '你的另一半',
      chefUserId: soloMode ? user._id : '',
      chefName: soloMode ? user.nickname || '' : '',
      soloMode,
      items,
      remark: remark || '没有备注',
      totalPrice,
      status: 'pending',
      createdAt: Date.now() + Math.random()
    };
    const res = await transaction.collection('orders').add({ data: order });
    return { order: { ...order, _id: res._id, id: res._id }, appended: false, mode: 'create' };
  });
}

function pad(num) {
  return String(num).padStart(2, '0');
}

function formatNotifyDate(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function sendOrderSubscribe(chef, order) {
  const templateId = process.env.ORDER_NOTIFY_TEMPLATE_ID;
  if (!templateId) throw new Error('未配置订单提醒模板');
  if (!chef || !chef.openid) throw new Error('未找到伴侣的微信账号');
  await cloud.openapi.subscribeMessage.send({
    touser: chef.openid,
    templateId,
    page: 'pages/chef/chef',
    data: {
      thing1: { value: `${order.guestName}点菜啦` },
      date2: { value: formatNotifyDate(order.createdAt) }
    }
  });
  return true;
}

async function trySendOrderSubscribe(chef, order) {
  if (!chef) return { pushed: true, pushError: '' };
  try {
    let timeoutTimer;
    const pushed = await Promise.race([
      sendOrderSubscribe(chef, order),
      new Promise((resolve) => {
        timeoutTimer = setTimeout(() => resolve(false), NOTIFY_TIMEOUT_MS);
      })
    ]).finally(() => clearTimeout(timeoutTimer));
    if (!pushed) return { pushed: false, pushError: '订单提醒发送超时' };
    return { pushed, pushError: '' };
  } catch (error) {
    const pushError = error && (error.errMsg || error.message || String(error));
    console.warn('ORDER_SUBSCRIBE_SEND_FAILED', {
      pushError,
      errCode: error && error.errCode,
      chefUserId: chef && chef._id,
      hasChefOpenid: !!(chef && chef.openid)
    });
    return { pushed: false, pushError };
  }
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const coupleId = await ensureCouple(user);
  const couple = await getCouple(coupleId);
  if (!couple || couple.status !== 'active' || !Array.isArray(couple.memberIds) || !couple.memberIds.includes(user._id)) {
    throw new Error('情侣空间不可用，请重新绑定后再下单');
  }
  const chef = await findPartner(coupleId, user._id);
  const soloMode = !chef;
  const items = await loadTrustedItems(event.cart, coupleId);

  const result = await createOrAppendOrder(coupleId, user, items, event.remark, soloMode);
  const { order, appended, mode } = result;
  const { pushed, pushError } = await trySendOrderSubscribe(chef, order);
  return {
    order,
    appended,
    mode,
    pushed,
    pushError,
    user: { ...user, coupleId, id: user._id }
  };
};
