const { ORDER_STATUS } = require('../constants');

const ACTIVE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED, ORDER_STATUS.COMPLETED];

const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: {
    accept: ORDER_STATUS.ACCEPTED,
    cancel: ORDER_STATUS.CANCELLED
  },
  [ORDER_STATUS.ACCEPTED]: {
    complete: ORDER_STATUS.COMPLETED,
    cancel: ORDER_STATUS.CANCELLED
  },
  [ORDER_STATUS.COMPLETED]: {
    review: ORDER_STATUS.REVIEWED
  }
};

function isActiveOrder(order) {
  return order && ACTIVE_STATUSES.includes(order.status);
}

function canCreateOrder(existingOrders) {
  return true;
}

function nextOrderStatus(currentStatus, action) {
  const next = TRANSITIONS[currentStatus] && TRANSITIONS[currentStatus][action];
  if (!next) {
    throw new Error(`Invalid order transition: ${currentStatus} -> ${action}`);
  }
  return next;
}

function createOrderSnapshot({ coupleId, guestUserId, cart, remark }) {
  const items = (Array.isArray(cart) ? cart : []).map((item) => ({
    dishId: item.dishId,
    cartKey: item.cartKey || '',
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    subtotal: Number(item.subtotal) || 0,
    imageUrl: item.imageUrl || '',
    emoji: item.emoji || '',
    selectedTastes: Array.isArray(item.selectedTastes) ? item.selectedTastes : [],
    tasteText: item.tasteText || ''
  }));
  const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    coupleId,
    guestUserId,
    chefUserId: '',
    items,
    remark: remark || '没有备注',
    totalPrice,
    status: ORDER_STATUS.PENDING
  };
}

module.exports = {
  ACTIVE_STATUSES,
  isActiveOrder,
  canCreateOrder,
  nextOrderStatus,
  createOrderSnapshot
};
