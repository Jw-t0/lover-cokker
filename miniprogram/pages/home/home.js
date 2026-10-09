const { getCurrentUser, refreshCurrentUser } = require('../../services/user-service');
const { getActiveOrder } = require('../../services/order-service');
const { listDishes, resetDefaultMenu } = require('../../services/dish-service');
const { buildDefaultMenu } = require('../../utils/default-menu');
const { pickRandomDishes } = require('../../utils/domain/recommendations');
const { isProfileComplete } = require('../../utils/domain/profile');

const fallbackDishes = buildDefaultMenu().dishes;

const HOME_ORDER_STATE = {
  pending: {
    title: '订单已送到厨房',
    desc: '等主厨接单后，就会开始制作。',
    action: '查看订单'
  },
  accepted: {
    title: '这顿饭在制作',
    desc: '厨房已经开火，闻起来很香。',
    action: '查看进度'
  },
  completed: {
    title: '这顿饭做好了',
    desc: '去看看这顿饭，再给主厨打个分吧。',
    action: '去评价'
  }
};

Page({
  data: {
    user: null,
    homeOrder: null,
    recommendedDishes: [],
    modeChoiceVisible: false,
    profileChoiceVisible: false,
    pendingDishId: '',
    soloModeLoading: false,
    loading: true,
    homeError: ''
  },

  onShow() {
    this.loadHome();
  },

  async loadHome() {
    const requestId = (this.homeRequestId || 0) + 1;
    this.homeRequestId = requestId;
    this.setData({ loading: true, homeError: '' });
    try {
      const user = await getCurrentUser();
      if (requestId !== this.homeRequestId) return;
      if (!user || !user.coupleId) {
        this.setData({ user, homeOrder: null, recommendedDishes: pickRandomDishes(fallbackDishes, 3), loading: false, homeError: '' });
        return;
      }

      const [orderResult, dishesResult] = await Promise.allSettled([
        getActiveOrder('guest'),
        listDishes(user.coupleId, { onlineOnly: true })
      ]);
      if (requestId !== this.homeRequestId) return;
      const order = orderResult.status === 'fulfilled' ? orderResult.value : null;
      const dishes = dishesResult.status === 'fulfilled' ? dishesResult.value : [];
      const homeError = orderResult.status === 'rejected'
        ? '订单状态暂时无法加载，请重试'
        : (dishesResult.status === 'rejected' ? '菜单暂时无法加载，当前显示的是备用菜单' : '');
      const recommendationDishes = dishes.length ? dishes : fallbackDishes;
      const homeState = order ? HOME_ORDER_STATE[order.status] || HOME_ORDER_STATE.pending : null;

      this.setData({
        user,
        homeOrder: order ? {
          ...order,
          homeState,
          previewItems: (order.items || []).slice(0, 2)
        } : null,
        recommendedDishes: pickRandomDishes(recommendationDishes, 3),
        loading: false,
        homeError
      });
    } catch (error) {
      if (requestId !== this.homeRequestId) return;
      this.setData({ homeOrder: null, recommendedDishes: pickRandomDishes(fallbackDishes, 3), loading: false, homeError: error.message || '饭桌暂时打不开' });
    }
  },

  retryLoad() {
    this.loadHome();
  },

  navigateToOrder(selectedDishId) {
    this.setData({ modeChoiceVisible: false, profileChoiceVisible: false, pendingDishId: '' });
    if (selectedDishId) {
      const selectedDish = this.data.recommendedDishes.find((item) => (item._id || item.id) === selectedDishId);
      wx.setStorageSync('homeSelectedDish', selectedDish || selectedDishId);
    }
    wx.setStorageSync('activeRole', 'guest');
    wx.navigateTo({ url: '/pages/order/order' });
  },

  async goOrder(selectedDishId) {
    const user = this.data.user || await getCurrentUser().catch(() => null);
    if (!user || !user.coupleId) {
      this.setData({ modeChoiceVisible: true, pendingDishId: selectedDishId || '' });
      return;
    }
    this.navigateToOrder(selectedDishId);
  },

  async chooseSoloMode() {
    if (this.data.soloModeLoading) return;
    const selectedDishId = this.data.pendingDishId;
    this.setData({ modeChoiceVisible: false, soloModeLoading: true });
    try {
      await resetDefaultMenu({ mode: 'solo' });
      const user = await refreshCurrentUser();
      this.setData({ user });
      this.navigateToOrder(selectedDishId);
    } catch (error) {
      this.setData({ modeChoiceVisible: true });
      wx.showToast({ title: error.message || '单人空间开启失败', icon: 'none' });
    } finally {
      this.setData({ soloModeLoading: false });
    }
  },

  chooseInviteMode() {
    this.setData({ modeChoiceVisible: false, pendingDishId: '' });
    this.goInvite();
  },

  closeModeChoice() {
    this.setData({ modeChoiceVisible: false, pendingDishId: '' });
  },

  stopModeChoiceTap() {},

  async goInvite() {
    const user = this.data.user || await getCurrentUser().catch(() => null);
    if (!isProfileComplete(user)) {
      this.setData({ modeChoiceVisible: false, profileChoiceVisible: true, pendingDishId: '' });
      return;
    }
    this.createInviteCard();
  },

  chooseProfileForInvite() {
    this.setData({ profileChoiceVisible: false });
    wx.navigateTo({ url: '/pages/profile/profile?fromInvite=1' });
  },

  sendInviteDirectly() {
    this.setData({ profileChoiceVisible: false });
    this.createInviteCard();
  },

  closeProfileChoice() {
    this.setData({ profileChoiceVisible: false });
  },

  async createInviteCard() {
    wx.navigateTo({ url: '/pages/invite/invite?pending=1' });
  },

  goRecommendedDish(event) {
    const id = event.currentTarget.dataset.id;
    const dish = this.data.recommendedDishes.find((item) => (item._id || item.id) === id);
    if (!dish) {
      this.goOrder();
      return;
    }
    this.goOrder(dish._id || dish.id);
  },

  goMyOrder() {
    wx.setStorageSync('activeRole', 'guest');
    wx.navigateTo({ url: '/pages/my-order/my-order' });
  },

  goHistory() {
    wx.setStorageSync('activeRole', 'guest');
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goChef() {
    wx.setStorageSync('activeRole', 'chef');
    wx.navigateTo({ url: '/pages/chef/chef' });
  },

  goMine() {
    wx.setStorageSync('activeRole', wx.getStorageSync('activeRole') || 'guest');
    wx.navigateTo({ url: '/pages/mine/mine' });
  }
});
