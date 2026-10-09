const REPORT_STATUSES = ['completed', 'reviewed'];

function pad(num) {
  return String(num).padStart(2, '0');
}

function monthKey(timestamp) {
  const date = new Date(Number(timestamp) || Date.now());
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function roundOne(value) {
  return Math.round(value * 10) / 10;
}

function buildMonthlyReport({ month, orders, reviews }) {
  const targetMonth = month || monthKey(Date.now());
  const selectedOrders = (Array.isArray(orders) ? orders : []).filter((order) =>
    REPORT_STATUSES.includes(order.status) && monthKey(order.createdAt) === targetMonth
  );
  const dishMap = new Map();

  selectedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.dishId || item.name;
      const previous = dishMap.get(key) || { dishId: item.dishId || '', name: item.name, quantity: 0, amount: 0 };
      const quantity = Number(item.quantity) || 0;
      const amount = Number(item.subtotal) || (Number(item.price) || 0) * quantity;
      dishMap.set(key, {
        ...previous,
        quantity: previous.quantity + quantity,
        amount: previous.amount + amount
      });
    });
  });

  const dishes = [...dishMap.values()].sort((a, b) => b.quantity - a.quantity || b.amount - a.amount);
  const reviewList = (Array.isArray(reviews) ? reviews : []).filter((review) =>
    monthKey(review.createdAt) === targetMonth
  );
  const rating = reviewList.length
    ? roundOne(reviewList.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewList.length)
    : 0;

  return {
    month: targetMonth,
    orderCount: selectedOrders.length,
    totalPrice: selectedOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0),
    totalDishes: dishes.reduce((sum, dish) => sum + dish.quantity, 0),
    dishes,
    topDish: dishes[0] || { name: '暂无', quantity: 0, amount: 0 },
    rating
  };
}

module.exports = {
  buildMonthlyReport,
  monthKey
};
