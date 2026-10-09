const { call } = require('./cloud');

async function createOrder(payload) {
  const result = await call('createOrder', payload);
  if (result.user) getApp().globalData.user = result.user;
  return result;
}

async function getActiveOrder(role = 'guest') {
  const result = await call('getOrderData', { type: 'active', role });
  return result.activeOrder || null;
}

async function getOrderOverview(role = 'guest') {
  const result = await call('getOrderData', { type: 'overview', role });
  return {
    activeOrder: result.activeOrder || null,
    recentCancelled: result.recentCancelled || null
  };
}

async function listHistory(role = 'guest') {
  const result = await call('getOrderData', { type: 'history', role });
  return result.history || [];
}

async function listHistoryPage(role = 'guest', page = 1, pageSize = 20, cursor = null) {
  const result = await call('getOrderData', {
    type: 'history',
    role,
    page,
    pageSize,
    beforeCreatedAt: cursor && cursor.createdAt,
    beforeId: cursor && cursor.id
  });
  return { orders: result.history || [], hasMore: !!result.hasMore, nextCursor: result.nextCursor || null };
}

async function getOrderStats() {
  const result = await call('getOrderData', { type: 'stats', role: 'all' });
  return result.stats || { rating: 0, completedCount: 0, reviewCount: 0, favoriteDish: '暂无' };
}

async function getMonthlyReport(month) {
  const result = await call('monthlyReport', { month });
  return result.report;
}

async function pushMonthlyReport(month) {
  return call('monthlyReport', { action: 'push', month });
}

async function acceptOrder(orderId) {
  return call('acceptOrder', { orderId });
}

async function completeOrder(orderId) {
  return call('completeOrder', { orderId });
}

async function cancelOrder(orderId, cancelReason) {
  return call('cancelOrder', { orderId, cancelReason });
}

async function submitReview(payload) {
  return call('submitReview', payload);
}

async function clearOrders() {
  return call('clearOrders');
}

module.exports = {
  createOrder,
  getActiveOrder,
  getOrderOverview,
  listHistory,
  listHistoryPage,
  acceptOrder,
  completeOrder,
  cancelOrder,
  submitReview,
  clearOrders,
  getOrderStats,
  getMonthlyReport,
  pushMonthlyReport
};
