const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

const REPORT_STATUSES = ['completed', 'reviewed'];

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = String((error && (error.message || error.errMsg)) || error || '');
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

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
  const selectedOrders = (Array.isArray(orders) ? orders : []).filter((order) =>
    REPORT_STATUSES.includes(order.status) && monthKey(order.createdAt) === month
  );
  const dishMap = new Map();

  selectedOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.dishId || item.name;
      const previous = dishMap.get(key) || { dishId: item.dishId || '', name: item.name, quantity: 0, amount: 0 };
      const quantity = Number(item.quantity) || 0;
      const amount = Number(item.subtotal) || (Number(item.price) || 0) * quantity;
      dishMap.set(key, { ...previous, quantity: previous.quantity + quantity, amount: previous.amount + amount });
    });
  });

  const dishes = [...dishMap.values()].sort((a, b) => b.quantity - a.quantity || b.amount - a.amount);
  const reviewList = (Array.isArray(reviews) ? reviews : []).filter((review) =>
    monthKey(review.createdAt) === month
  );
  const rating = reviewList.length
    ? roundOne(reviewList.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewList.length)
    : 0;

  return {
    month,
    orderCount: selectedOrders.length,
    totalPrice: selectedOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0),
    totalDishes: dishes.reduce((sum, dish) => sum + dish.quantity, 0),
    dishes,
    topDish: dishes[0] || { name: '暂无', quantity: 0, amount: 0 },
    rating
  };
}

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function listOrders(coupleId) {
  try {
    const res = await db.collection('orders').where({ coupleId, status: _.in(REPORT_STATUSES) }).get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return [];
    throw error;
  }
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

async function saveReport(report, user, pushed) {
  const data = {
    ...report,
    coupleId: user.coupleId,
    userId: user._id,
    pushed: !!pushed,
    createdAt: Date.now()
  };
  try {
    return await db.collection('monthlyReports').add({ data });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('monthlyReports');
    return db.collection('monthlyReports').add({ data });
  }
}

async function sendSubscribe(openid, report) {
  const templateId = process.env.MONTHLY_REPORT_TEMPLATE_ID;
  if (!templateId) return false;
  await cloud.openapi.subscribeMessage.send({
    touser: openid,
    templateId,
    page: 'pages/monthly-report/monthly-report',
    data: {
      thing1: { value: `${report.month} 月度点菜汇报` },
      thing2: { value: `最爱：${report.topDish.name}` },
      number3: { value: report.orderCount },
      amount4: { value: report.totalPrice }
    }
  });
  return true;
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  if (!user.coupleId) throw new Error('还没有情侣空间，暂时无法生成月报');
  const month = event.month || monthKey(Date.now());
  const [orders, reviews] = await Promise.all([listOrders(user.coupleId), listReviews(user.coupleId)]);
  const report = buildMonthlyReport({ month, orders, reviews });
  let pushed = false;
  if (event.action === 'push') {
    pushed = await sendSubscribe(OPENID, report).catch(() => false);
  }
  const res = event.action === 'push' ? await saveReport(report, user, pushed) : null;
  return { report, pushed, reportId: res && res._id };
};
