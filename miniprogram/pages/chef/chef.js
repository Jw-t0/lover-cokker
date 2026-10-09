const { getCurrentUser } = require('../../services/user-service');
const { getActiveOrder, acceptOrder, completeOrder, cancelOrder, getOrderStats } = require('../../services/order-service');
const { ORDER_NOTIFY_TEMPLATE_ID } = require('../../utils/constants');

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
    loading: true,
    error: '',
    statsVisible: false,
    stats: {
      rating: 0,
      completedCount: 0,
      reviewCount: 0,
      favoriteDish: '暂无'
    }
  },

  async onShow() {
    await this.loadDesk();
    this.startPolling();
  },

  onHide() {
    this.stopPolling();
  },

  onPullDownRefresh() {
    this.loadDesk().finally(() => wx.stopPullDownRefresh());
  },

  startPolling() {
    this.stopPolling();
    if (!this.data.order || !['pending', 'accepted'].includes(this.data.order.status)) return;
    this.refreshTimer = setInterval(() => this.loadDesk(true), 10000);
  },

  stopPolling() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = null;
  },

  async loadDesk(silent = false) {
    const requestId = (this.deskRequestId || 0) + 1;
    this.deskRequestId = requestId;
    if (!silent) this.setData({ loading: true, error: '' });
    try {
      const user = await getCurrentUser();
      if (requestId !== this.deskRequestId) return;
      const order = user.coupleId ? await getActiveOrder('chef') : null;
      if (requestId !== this.deskRequestId) return;
      if (order) order.statusText = STATUS_TEXT[order.status] || order.status;
      this.setData({ user, order, error: '' });
      if (user.coupleId) await this.loadStats(user.coupleId, requestId);
    } catch (error) {
      if (requestId !== this.deskRequestId) return;
      this.setData({ order: null, error: error.message || '工作台加载失败' });
      wx.showToast({ title: '工作台加载失败', icon: 'none' });
    } finally {
      if (requestId === this.deskRequestId && !silent) this.setData({ loading: false });
    }
  },

  async retry() {
    await this.loadDesk();
    this.startPolling();
  },

  async loadStats(coupleId, requestId = this.deskRequestId) {
    try {
      const stats = await getOrderStats(coupleId);
      if (requestId === this.deskRequestId) this.setData({ stats });
    } catch (error) {
      if (requestId === this.deskRequestId) {
        this.setData({ stats: { rating: 0, completedCount: 0, reviewCount: 0, favoriteDish: '暂无' } });
      }
    }
  },

  goMenu() {
    wx.navigateTo({ url: '/pages/menu-manage/menu-manage' });
  },

  goRecipes() {
    wx.navigateTo({ url: '/pages/recipes/recipes' });
  },

  goHistory() {
    wx.setStorageSync('activeRole', 'chef');
    wx.navigateTo({ url: '/pages/history/history' });
  },

  toggleStats() {
    this.setData({ statsVisible: !this.data.statsVisible });
  },

  requestOrderSubscribe() {
    if (!ORDER_NOTIFY_TEMPLATE_ID || !wx.requestSubscribeMessage) {
      wx.showToast({ title: '当前微信版本不支持订阅提醒', icon: 'none' });
      return;
    }

    wx.requestSubscribeMessage({
      tmplIds: [ORDER_NOTIFY_TEMPLATE_ID],
      success: (res) => {
        const accepted = res[ORDER_NOTIFY_TEMPLATE_ID] === 'accept';
        wx.showToast({ title: accepted ? '点菜提醒已开启' : '没有开启提醒', icon: 'none' });
      },
      fail: () => {
        wx.showToast({ title: '提醒开启失败，请稍后再试', icon: 'none' });
      }
    });
  },

  async accept() {
    if (!this.data.order) return;
    try {
      await acceptOrder(this.data.order._id);
      wx.showToast({ title: '已接单，准备开火啦', icon: 'none' });
      this.loadDesk();
    } catch (error) {
      wx.showToast({ title: error.message || '接单失败', icon: 'none' });
    }
  },

  async complete() {
    if (!this.data.order) return;
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '完成订单',
        content: '确认这顿饭已经做好了吗？确认后客人就可以评价了。',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirmed) return;
    try {
      await completeOrder(this.data.order._id);
      wx.showToast({ title: '这顿饭完成啦', icon: 'none' });
      this.loadDesk();
    } catch (error) {
      wx.showToast({ title: error.message || '完成失败', icon: 'none' });
    }
  },

  async cancel() {
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
      await cancelOrder(this.data.order._id, '厨师取消');
      wx.showToast({ title: '订单已取消', icon: 'none' });
      this.loadDesk();
    } catch (error) {
      wx.showToast({ title: error.message || '取消失败', icon: 'none' });
    }
  }
});
