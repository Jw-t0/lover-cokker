const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const ACTIVE_STATUSES = ['pending', 'accepted', 'completed'];
const HISTORY_STATUSES = ['completed', 'reviewed', 'cancelled'];
const STATS_STATUSES = ['completed', 'reviewed'];
const HISTORY_PAGE_SIZE = 20;

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function getCouple(coupleId) {
  if (!coupleId) return null;
  try {
    const res = await db.collection('couples').doc(coupleId).get();
    return res.data || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

async function resolveReadableCouple(user) {
  const currentCouple = await getCouple(user.coupleId);
  const currentMemberIds = currentCouple && Array.isArray(currentCouple.memberIds) ? currentCouple.memberIds : [];
  if (currentCouple && currentCouple.status === 'active' && currentMemberIds.includes(user._id)) {
    return { coupleId: currentCouple._id, active: true };
  }

  const pendingId = user.pendingCoupleId || (currentCouple && currentCouple.status === 'pending_delete' ? currentCouple._id : '');
  if (!pendingId) return null;
  const pendingCouple = currentCouple && currentCouple._id === pendingId ? currentCouple : await getCouple(pendingId);
  const pendingDeleteAt = Number(user.pendingCoupleDeleteAt || (pendingCouple && pendingCouple.deleteAt) || 0);
  if (pendingDeleteAt <= Date.now()) return null;
  const memberIds = pendingCouple && Array.isArray(pendingCouple.memberIds) ? pendingCouple.memberIds : [];
  if (pendingCouple && pendingCouple.status === 'pending_delete' && memberIds.includes(user._id)) {
    return { coupleId: pendingCouple._id, active: false, pendingDeleteAt };
  }
  return null;
}

function roleQuery(user, role) {
  if (role === 'chef') return { chefUserId: user._id };
  if (role === 'all') return {};
  return { guestUserId: user._id };
}

function historyRole(role) {
  return role === 'chef' ? 'chef' : 'all';
}

function assertRoleAllowed(type, role) {
  if (!['guest', 'chef', 'all'].includes(role)) throw new Error('角色查询不合法');
  if (role === 'all' && type !== 'stats') throw new Error('当前查询不允许使用全部角色');
}

async function listOrders(coupleId, statuses, user, role, options = {}) {
  try {
    const baseFilter = { coupleId, status: _.in(statuses), ...roleQuery(user, role) };
    let filter = baseFilter;
    if (Number(options.beforeCreatedAt) > 0) {
      const beforeCreatedAt = Number(options.beforeCreatedAt);
      const beforeId = String(options.beforeId || '');
      const cursor = beforeId
        ? _.or(
          { createdAt: _.lt(beforeCreatedAt) },
          { createdAt: beforeCreatedAt, _id: _.lt(beforeId) }
        )
        : { createdAt: _.lt(beforeCreatedAt) };
      filter = _.and(baseFilter, cursor);
    }
    let query = db.collection('orders').where(filter).orderBy('createdAt', 'desc');
    if (Number(options.limit) > 0) query = query.limit(Number(options.limit));
    const res = await query.get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return [];
    throw error;
  }
}

function filterChefActiveOrders(orders, user) {
  return (Array.isArray(orders) ? orders : []).filter((order) => {
    if (order.status === 'pending') {
      if (order.soloMode && order.guestUserId === user._id) return true;
      return order.guestUserId !== user._id && (!order.chefUserId || order.chefUserId === user._id);
    }
    return order.chefUserId === user._id;
  });
}

async function listActiveOrders(coupleId, user, role) {
  if (role === 'guest') return listOrders(coupleId, ACTIVE_STATUSES, user, 'all');
  if (role !== 'chef') return listOrders(coupleId, ACTIVE_STATUSES, user, role);
  const orders = await listOrders(coupleId, ACTIVE_STATUSES, user, 'all');
  return filterChefActiveOrders(orders, user);
}

async function listReviews(coupleId) {
  try {
    const res = await db.collection('reviews').where({ coupleId }).get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return [];
    throw error;
  }
}

function needsReviews(type) {
  return type === 'all' || type === 'history' || type === 'stats';
}

function attachReviews(orders, reviews) {
  const reviewMap = (Array.isArray(reviews) ? reviews : []).reduce((map, review) => {
    map[review.orderId] = review;
    return map;
  }, {});
  return (Array.isArray(orders) ? orders : []).map((order) => ({
    ...order,
    review: order.review || reviewMap[order._id] || null
  }));
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function calculateStats(orders, reviews) {
  const completedOrders = orders.filter((order) => STATS_STATUSES.includes(order.status));
  const rating = reviews.length ? roundOne(reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length) : 0;
  const dishCount = new Map();

  completedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.dishId || item.name;
      const previous = dishCount.get(key) || { name: item.name, quantity: 0 };
      dishCount.set(key, { name: item.name, quantity: previous.quantity + Number(item.quantity || 0) });
    });
  });

  const favorite = [...dishCount.values()].sort((a, b) => b.quantity - a.quantity)[0];
  return {
    rating,
    completedCount: completedOrders.length,
    reviewCount: reviews.length,
    favoriteDish: favorite ? favorite.name : '暂无'
  };
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const readableCouple = await resolveReadableCouple(user);
  if (!readableCouple) {
    return {
      activeOrder: null,
      history: [],
      recentCancelled: null,
      stats: { rating: 0, completedCount: 0, reviewCount: 0, favoriteDish: '暂无' }
    };
  }

  const type = event.type || 'all';
  const role = event.role || 'guest';
  assertRoleAllowed(type, role);
  const coupleId = readableCouple.coupleId;
  const historyPage = Math.max(1, Number(event.page) || 1);
  const historyPageSize = Math.min(50, Math.max(1, Number(event.pageSize) || HISTORY_PAGE_SIZE));
  const tasks = [];
  if (type === 'all' || type === 'active' || type === 'overview') tasks.push(readableCouple.active ? listActiveOrders(coupleId, user, role) : Promise.resolve([]));
  if (type === 'all' || type === 'history' || type === 'stats') {
    const options = type === 'history'
      ? { beforeCreatedAt: event.beforeCreatedAt, beforeId: event.beforeId, limit: historyPageSize + 1 }
      : {};
    const statuses = type === 'history' ? HISTORY_STATUSES : [...HISTORY_STATUSES, ...STATS_STATUSES];
    const historyQueryRole = type === 'history' ? historyRole(role) : role;
    tasks.push(listOrders(coupleId, statuses, user, historyQueryRole, options));
  }
  if (type === 'overview') tasks.push(listOrders(coupleId, ['cancelled'], user, role));
  if (needsReviews(type)) tasks.push(listReviews(coupleId));

  const results = await Promise.all(tasks);
  let index = 0;
  const activeOrders = type === 'all' || type === 'active' || type === 'overview' ? results[index++] : [];
  let historyOrders = type === 'all' || type === 'history' || type === 'stats' ? results[index++] : [];
  const cancelledOrders = type === 'overview' ? results[index++] : [];
  const reviews = needsReviews(type) ? results[index++] : [];
  const historyHasMore = type === 'history' && historyOrders.length > historyPageSize;
  if (historyHasMore) historyOrders = historyOrders.slice(0, historyPageSize);
  const activeWithReviews = attachReviews(activeOrders, reviews);
  const historyWithReviews = attachReviews(historyOrders, reviews);

  return {
    activeOrder: activeWithReviews[0] || null,
    history: historyWithReviews.filter((order) => HISTORY_STATUSES.includes(order.status)),
    hasMore: historyHasMore,
    nextCursor: historyOrders.length
      ? { createdAt: historyOrders[historyOrders.length - 1].createdAt, id: historyOrders[historyOrders.length - 1]._id }
      : null,
    recentCancelled: cancelledOrders[0] || null,
    stats: calculateStats(historyOrders, reviews)
  };
};
