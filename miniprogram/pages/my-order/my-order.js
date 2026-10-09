const { getCurrentUser } = require('../../services/user-service');
const { getOrderOverview, getActiveOrder, cancelOrder, submitReview } = require('../../services/order-service');

const STATUS_TEXT = {
  pending: '待接单',
  accepted: '制作中',
  completed: '已完成',
  reviewed: '已评价',
  cancelled: '已取消'
};

Page({
  data: {
    user: null,
    order: null,
    recentCancelled: null,
    rating: 5,
    reviewContent: '',
    loading: true,
    error: '',
    reviewSubmitting: false
  },

  async onShow() {
    await this.loadOrder();
    this.startPolling();
  },

  onHide() {
    this.stopPolling();
  },

  onPullDownRefresh() {
    this.loadOrder().finally(() => wx.stopPullDownRefresh());
  },

  startPolling() {
    this.stopPolling();
    if (!this.data.order || !['pending', 'accepted', 'completed'].includes(this.data.order.status)) return;
    this.refreshTimer = setInterval(() => this.loadOrder(true), 10000);
  },

  stopPolling() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  },

  async loadOrder(silent = false) {
    const requestId = (this.orderRequestId || 0) + 1;
    this.orderRequestId = requestId;
    if (!silent) this.setData({ loading: true, error: '' });
    try {
      const user = await getCurrentUser();
      if (requestId !== this.orderRequestId) return;
      let overview;
      try {
        overview = await getOrderOverview('guest');
      } catch (overviewError) {
        const activeOrder = await getActiveOrder('guest');
        if (!activeOrder) throw overviewError;
        overview = { activeOrder, recentCancelled: null };
      }
      if (requestId !== this.orderRequestId) return;
      const order = overview.activeOrder || await getActiveOrder('guest');
      if (order) order.statusText = STATUS_TEXT[order.status] || order.status;
      const cancelledAt = Number(overview.recentCancelled && (overview.recentCancelled.cancelledAt || overview.recentCancelled.createdAt));
      const recentCancelled = !order && overview.recentCancelled && Date.now() - cancelledAt <= 7 * 24 * 60 * 60 * 1000
        ? overview.recentCancelled
        : null;
      this.setData({ user, order, recentCancelled, error: '' });
    } catch (error) {
      if (requestId !== this.orderRequestId) return;
      this.setData({ order: null, recentCancelled: null, error: error.message || '订单加载失败' });
      wx.showToast({ title: '订单加载失败', icon: 'none' });
    } finally {
      if (requestId === this.orderRequestId && !silent) this.setData({ loading: false });
    }
  },

  async retry() {
    await this.loadOrder();
    this.startPolling();
  },

  goHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goOrder() {
    wx.redirectTo({ url: '/pages/order/order' });
  },

  async cancelCurrentOrder() {
    if (!this.data.order) return;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: '取消订单',
        content: '确定要取消这份订单吗？',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;
    try {
      await cancelOrder(this.data.order._id, '客人取消');
      wx.showToast({ title: '订单已取消', icon: 'none' });
      this.loadOrder();
    } catch (error) {
      wx.showToast({ title: error.message || '取消失败', icon: 'none' });
    }
  },

  onRatingChange(event) {
    this.setData({ rating: event.detail.value });
  },

  onReviewInput(event) {
    this.setData({ reviewContent: event.detail.value });
  },

  async submitReview() {
    if (!this.data.order || this.data.reviewSubmitting) return;
    this.setData({ reviewSubmitting: true });
    try {
      await submitReview({
        orderId: this.data.order._id,
        rating: this.data.rating,
        content: this.data.reviewContent
      });
      wx.showToast({ title: '评价已收到，厨师会偷笑的', icon: 'none' });
      wx.navigateTo({ url: '/pages/history/history' });
    } catch (error) {
      wx.showToast({ title: error.message || '评价提交失败', icon: 'none' });
    } finally {
      this.setData({ reviewSubmitting: false });
    }
  }
});
