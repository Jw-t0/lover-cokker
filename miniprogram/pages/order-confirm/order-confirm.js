const { QUICK_REMARKS } = require('../../utils/constants');
const { addDishToCart, changeCartQuantity, summarizeCart } = require('../../utils/domain/cart');
const { parseTagText } = require('../../utils/domain/menu');
const { createOrder, getActiveOrder } = require('../../services/order-service');
const { getCurrentUser } = require('../../services/user-service');

const DRAFT_STORAGE_KEY = 'pendingOrderDraft';

Page({
  data: {
    cart: [],
    summary: { count: 0, totalPrice: 0 },
    remark: '',
    customRemarkInput: '',
    customQuickRemarks: [],
    quickRemarks: QUICK_REMARKS,
    coupleId: '',
    isAddingDish: false,
    submitting: false,
    submittedOrder: null
  },

  onLoad() {
    this.loadCustomRemarks();
    const draft = wx.getStorageSync(DRAFT_STORAGE_KEY) || {};
    const cart = Array.isArray(draft.cart) ? draft.cart : [];
    this.setData({ cart, remark: draft.remark || '', coupleId: draft.coupleId || '', summary: summarizeCart(cart) });
    this.loadOrderMode();
    this.validateDraftScope();
  },

  async validateDraftScope() {
    const user = await getCurrentUser().catch(() => null);
    if (!user || !user.coupleId) return;
    const draft = wx.getStorageSync(DRAFT_STORAGE_KEY) || {};
    if (draft.coupleId === user.coupleId) return;
    this.updateCart([]);
  },

  getEventChannel() {
    return this.getOpenerEventChannel ? this.getOpenerEventChannel() : null;
  },

  persistDraft() {
    const draft = { cart: this.data.cart, remark: this.data.remark, coupleId: this.data.coupleId || '' };
    wx.setStorageSync(DRAFT_STORAGE_KEY, draft);
    const eventChannel = this.getEventChannel();
    if (eventChannel && eventChannel.emit) eventChannel.emit('orderDraftChanged', { cart: this.data.cart });
  },

  updateCart(cart) {
    this.setData({
      cart,
      summary: summarizeCart(cart),
      ...(cart.length ? {} : { remark: '' })
    });
    if (!cart.length) {
      wx.removeStorageSync(DRAFT_STORAGE_KEY);
      const eventChannel = this.getEventChannel();
      if (eventChannel && eventChannel.emit) eventChannel.emit('orderDraftChanged', { cart });
      return;
    }
    this.persistDraft();
  },

  decreaseDish(event) {
    this.updateCart(changeCartQuantity(this.data.cart, event.currentTarget.dataset.id, -1));
  },

  increaseDish(event) {
    const id = event.currentTarget.dataset.id;
    const item = this.data.cart.find((cartItem) => cartItem.cartKey === id || cartItem.dishId === id);
    if (!item) return;
    const cart = addDishToCart(this.data.cart, item);
    if (summarizeCart(cart).count === this.data.summary.count) {
      wx.showToast({ title: '同一道菜最多 99 份', icon: 'none' });
      return;
    }
    this.updateCart(cart);
  },

  onRemark(event) {
    this.setData({ remark: event.detail.value });
    this.persistDraft();
  },

  appendRemark(event) {
    const text = event.currentTarget.dataset.text;
    const remarkParts = this.data.remark.split('、').map((item) => item.trim()).filter(Boolean);
    if (!remarkParts.includes(text)) remarkParts.push(text);
    this.setData({ remark: remarkParts.join('、') });
    this.persistDraft();
  },

  loadCustomRemarks() {
    const customQuickRemarks = wx.getStorageSync('customQuickRemarks') || [];
    this.setData({ customQuickRemarks, quickRemarks: [...QUICK_REMARKS, ...customQuickRemarks] });
  },

  async loadOrderMode() {
    try {
      const order = await getActiveOrder('guest');
      this.setData({ isAddingDish: !!order && ['pending', 'accepted'].includes(order.status) });
    } catch (error) {
      this.setData({ isAddingDish: false });
    }
  },

  onCustomRemarkInput(event) {
    this.setData({ customRemarkInput: event.detail.value });
  },

  addCustomRemark() {
    const tags = parseTagText(this.data.customRemarkInput);
    if (!tags.length) {
      wx.showToast({ title: '先写一个备注标签', icon: 'none' });
      return;
    }

    const customQuickRemarks = [...this.data.customQuickRemarks];
    tags.forEach((tag) => {
      if (!QUICK_REMARKS.includes(tag) && !customQuickRemarks.includes(tag)) customQuickRemarks.push(tag);
    });
    wx.setStorageSync('customQuickRemarks', customQuickRemarks);
    this.setData({
      customRemarkInput: '',
      customQuickRemarks,
      quickRemarks: [...QUICK_REMARKS, ...customQuickRemarks]
    });
  },

  goBack() {
    wx.navigateBack();
  },

  async submitOrder() {
    if (this.data.submitting) return;
    if (this.data.summary.count === 0) {
      wx.showToast({ title: '先选一道想吃的菜吧', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await createOrder({
        cart: this.data.cart,
        remark: this.data.remark
      });
      wx.removeStorageSync(DRAFT_STORAGE_KEY);
      this.setData({ submittedOrder: result.order });
      if (!result.order.soloMode && (!result.pushed || result.pushError)) {
        wx.showToast({ title: '订单已提交，提醒发送失败', icon: 'none' });
      }
    } catch (error) {
      wx.showToast({ title: error.message || '订单没有送出去，再试一次吧', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  finishSubmission() {
    if (this.data.submittedOrder && this.data.submittedOrder.soloMode) {
      wx.setStorageSync('activeRole', 'chef');
      wx.reLaunch({ url: '/pages/chef/chef' });
      return;
    }
    wx.setStorageSync('orderSubmissionComplete', true);
    wx.navigateBack({
      fail: () => {
        wx.removeStorageSync('orderSubmissionComplete');
        wx.reLaunch({ url: '/pages/my-order/my-order' });
      }
    });
  },

  onShareAppMessage() {
    const order = this.data.submittedOrder || {};
    const count = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return {
      title: `${order.guestName || 'TA'}点了 ${count || '几'} 道菜，等你接单`,
      path: '/pages/chef/chef'
    };
  }
});
