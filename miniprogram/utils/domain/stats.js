const { ORDER_STATUS } = require('../constants');

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function calculateStoreStats({ orders, reviews }) {
  const orderList = Array.isArray(orders) ? orders : [];
  const reviewList = Array.isArray(reviews) ? reviews : [];
  const completedOrders = orderList.filter((order) =>
    [ORDER_STATUS.COMPLETED, ORDER_STATUS.REVIEWED].includes(order.status)
  );
  const rating =
    reviewList.length === 0
      ? 0
      : roundOne(reviewList.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewList.length);
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
    reviewCount: reviewList.length,
    favoriteDish: favorite ? favorite.name : '暂无'
  };
}

module.exports = {
  calculateStoreStats
};
