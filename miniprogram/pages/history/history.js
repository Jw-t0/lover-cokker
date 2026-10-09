const { getCurrentUser } = require('../../services/user-service');
const { listHistoryPage, getActiveOrder } = require('../../services/order-service');

const PAGE_SIZE = 20;

const STATUS_TEXT = {
  completed: '已完成',
  reviewed: '已评价',
  cancelled: '已取消'
};

Page({
  data: {
    orders: [],
    role: 'guest',
    page: 1,
    hasMore: false,
    historyCursor: null,
    loadingMore: false,
    loading: true,
    error: ''
  },

  async onShow() {
    const role = wx.getStorageSync('activeRole') === 'chef' ? 'chef' : 'guest';
    this.setData({ role });
    await this.loadHistory();
  },

  async loadHistory(append = false) {
    if (append && (this.data.loadingMore || !this.data.hasMore)) return;
    const requestId = (this.historyRequestId || 0) + 1;
    this.historyRequestId = requestId;
    const page = append ? this.data.page + 1 : 1;
    this.setData(append
      ? { loadingMore: true, error: '' }
      : { loading: true, error: '', orders: [], page: 1, hasMore: false, historyCursor: null });
    try {
      const user = await getCurrentUser();
      if (requestId !== this.historyRequestId) return;
      const result = await listHistoryPage(this.data.role, page, PAGE_SIZE, this.data.historyCursor);
      if (requestId !== this.historyRequestId) return;
      let orders = (result.orders || []).map((order) => ({ ...order, statusText: STATUS_TEXT[order.status] || order.status }));
      if (!append && this.data.role === 'guest') {
        const activeOrder = await getActiveOrder('guest').catch(() => null);
        if (requestId !== this.historyRequestId) return;
        if (activeOrder && activeOrder.status === 'completed' && !orders.some((order) => order._id === activeOrder._id)) {
          orders = [{ ...activeOrder, statusText: STATUS_TEXT[activeOrder.status] || activeOrder.status }, ...orders];
        }
      }
      this.setData({
        orders: append ? [...this.data.orders, ...orders] : orders,
        page,
        hasMore: !!result.hasMore,
        historyCursor: result.nextCursor || null,
        loading: false,
        loadingMore: false,
        error: ''
      });
    } catch (error) {
      if (requestId !== this.historyRequestId) return;
      this.setData({ loading: false, loadingMore: false, error: error.message || '历史订单加载失败' });
      wx.showToast({ title: '历史订单加载失败', icon: 'none' });
    }
  },

  async retry() {
    await this.loadHistory();
  },

  loadMore() {
    this.loadHistory(true);
  },

  onPullDownRefresh() {
    this.loadHistory().finally(() => wx.stopPullDownRefresh());
  }
});
