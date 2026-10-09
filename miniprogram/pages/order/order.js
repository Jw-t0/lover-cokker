const { buildDefaultMenu } = require('../../utils/default-menu');
const { addDishToCart, changeCartQuantity, summarizeCart, clearCart } = require('../../utils/domain/cart');
const { withDishDefaults } = require('../../utils/domain/menu');
const { withTimeout } = require('../../utils/async');
const { getCurrentUser } = require('../../services/user-service');
const { DEFAULT_CATEGORIES, DEFAULT_DISHES } = require('../../utils/constants');
const { listCategories, listDishes, resetDefaultMenu } = require('../../services/dish-service');

const MENU_LOAD_TIMEOUT_MS = 3500;
const DRAFT_STORAGE_KEY = 'pendingOrderDraft';

Page({
  data: {
    user: null,
    categories: [],
    selectedCategoryId: 'all',
    dishes: [],
    displayDishes: [],
    cart: [],
    summary: { count: 0, totalPrice: 0 },
    cartVisible: false,
    tastePanelVisible: false,
    pendingDish: null,
    selectedTastes: [],
    tasteOptionsForPanel: [],
    cartCountBump: false,
    loading: true,
    menuError: '',
    menuNotice: ''
  },

  async onLoad() {
    this.restorePendingCart();
    await this.loadData();
    this.restorePendingCart(this.data.user && this.data.user.coupleId);
    this.openHomeSelectedDish();
  },

  async onShow() {
    if (wx.getStorageSync('orderSubmissionComplete')) {
      wx.removeStorageSync('orderSubmissionComplete');
      this.updateCart([]);
      wx.redirectTo({ url: '/pages/my-order/my-order' });
      return;
    }
    if (this.data.user) {
      try {
        await this.loadMenu(this.data.user);
        this.openDetailSelectedDish();
      } catch (error) {
        this.setData({ menuError: error.message || '菜单暂时不可用，请重试', menuNotice: '' });
      }
    }
  },

  async loadData() {
    try {
      const user = await withTimeout(getCurrentUser(), MENU_LOAD_TIMEOUT_MS, '菜单加载超时');
      this.setData({ user, menuError: '', menuNotice: '' });
      await withTimeout(this.loadMenu(user), MENU_LOAD_TIMEOUT_MS, '菜单加载超时');
    } catch (error) {
      this.loadFallbackMenu();
      this.setData({ menuError: error.message || '菜单暂时不可用，请重试', menuNotice: '' });
      wx.showToast({ title: '菜单暂时不可用，请检查网络后重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  retryLoad() {
    this.loadData().then(() => this.restorePendingCart(this.data.user && this.data.user.coupleId));
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  async loadMenu(user) {
    if (!user || !user.coupleId) {
      this.loadFallbackMenu();
      this.setData({ menuError: '请先从首页选择单人体验或邀请另一半', menuNotice: '' });
      return;
    }
    const [categories, dishes] = await Promise.all([
      listCategories(user.coupleId),
      listDishes(user.coupleId, { onlineOnly: true })
    ]);
    if (!categories.length || !dishes.length) {
      try {
        await this.syncPartialDefaultMenu(user, categories, dishes);
        if (this.data.categories.length && this.data.dishes.length) return;
      } catch (error) {
        // The fallback below keeps the page readable while the user can retry.
      }
      this.loadFallbackMenu();
      this.setData({ menuError: '菜单还没准备好，请重新加载', menuNotice: '' });
      return;
    }
    const normalizedDishes = dishes.map(withDishDefaults);
    this.setData({
      categories,
      dishes: normalizedDishes,
      selectedCategoryId: 'all',
      menuError: '',
      menuNotice: ''
    });
    this.refreshDisplayDishes();
    this.syncPartialDefaultMenu(user, categories, dishes);
  },

  async syncPartialDefaultMenu(user, categories, dishes) {
    if (this.defaultMenuSyncing || (categories.length >= DEFAULT_CATEGORIES.length && dishes.length >= DEFAULT_DISHES.length)) {
      return;
    }
    this.defaultMenuSyncing = true;
    try {
      await resetDefaultMenu({ mode: 'sync' });
      const [syncedCategories, syncedDishes] = await Promise.all([
        listCategories(user.coupleId),
        listDishes(user.coupleId, { onlineOnly: true })
      ]);
      if (!syncedCategories.length || !syncedDishes.length) {
        this.setData({ menuNotice: '默认菜单还没补齐，请稍后重新加载。' });
        return;
      }
      this.setData({
        categories: syncedCategories,
        dishes: syncedDishes.map(withDishDefaults),
        selectedCategoryId: 'all',
        menuError: '',
        menuNotice: ''
      });
      this.refreshDisplayDishes();
    } catch (error) {
      // The existing menu is already usable; a later page show can retry the backfill.
      this.setData({ menuNotice: '默认菜单还没补齐，请稍后重新加载。' });
    } finally {
      this.defaultMenuSyncing = false;
    }
  },

  loadFallbackMenu() {
    const { categories, dishes } = buildDefaultMenu();
    this.setData({ categories, dishes: dishes.map(withDishDefaults), selectedCategoryId: 'all' });
    this.refreshDisplayDishes();
  },

  refreshDisplayDishes() {
    const quantities = this.data.cart.reduce((map, item) => {
      map[item.dishId] = (map[item.dishId] || 0) + item.quantity;
      return map;
    }, {});
    const displayDishes = this.data.dishes
      .filter((dish) => this.data.selectedCategoryId === 'all' || dish.categoryId === this.data.selectedCategoryId)
      .map((dish) => ({ ...dish, id: dish._id || dish.id, quantity: quantities[dish._id || dish.id] || 0 }));
    this.setData({ displayDishes });
  },

  selectCategory(event) {
    this.setData({ selectedCategoryId: event.currentTarget.dataset.id });
    this.refreshDisplayDishes();
  },

  addDish(event) {
    if (this.data.menuError) {
      wx.showToast({ title: '菜单暂时不可用，请先重新加载', icon: 'none' });
      return;
    }
    const dish = event.detail.dish;
    this.openTastePanel(dish);
  },

  openTastePanel(dish) {
    if ((dish.tasteOptions || []).length) {
      this.setData({
        pendingDish: dish,
        selectedTastes: [],
        tasteOptionsForPanel: dish.tasteOptions.map((name) => ({ name, selected: false })),
        tastePanelVisible: true
      });
      return;
    }
    this.addDishWithTastes(dish, []);
  },

  openHomeSelectedDish() {
    if (this.data.menuError) return;
    const selectedDish = wx.getStorageSync('homeSelectedDish');
    const selectedDishId = selectedDish && typeof selectedDish === 'object'
      ? selectedDish._id || selectedDish.id
      : selectedDish;
    if (!selectedDishId) return;
    wx.removeStorageSync('homeSelectedDish');
    const dish = this.data.dishes.find((item) => (item._id || item.id) === selectedDishId) ||
      (selectedDish && typeof selectedDish === 'object'
        ? this.data.dishes.find((item) => item.name === selectedDish.name)
        : null);
    if (!dish) return;
    if (this.data.selectedCategoryId !== 'all' && dish.categoryId !== this.data.selectedCategoryId) {
      this.setData({ selectedCategoryId: dish.categoryId });
      this.refreshDisplayDishes();
    }
    this.openTastePanel(dish);
  },

  openDetailSelectedDish() {
    const selectedDish = wx.getStorageSync('detailSelectedDish');
    if (!selectedDish) return;
    wx.removeStorageSync('detailSelectedDish');
    const dish = this.data.dishes.find((item) =>
      (item._id || item.id) === (selectedDish._id || selectedDish.id) || item.name === selectedDish.name
    );
    if (dish) this.openTastePanel(dish);
  },

  addDishWithTastes(dish, selectedTastes) {
    const cart = addDishToCart(this.data.cart, { ...dish, selectedTastes });
    if (summarizeCart(cart).count === this.data.summary.count) {
      wx.showToast({ title: '同一道菜最多 99 份', icon: 'none' });
      return;
    }
    this.updateCart(cart);
    wx.showToast({ title: '已加入小饭桌', icon: 'none' });
  },

  decreaseDish(event) {
    const dish = event.detail.dish;
    const cart = changeCartQuantity(this.data.cart, dish._id || dish.id, -1);
    this.updateCart(cart);
  },

  restorePendingCart(coupleId = '') {
    const draft = wx.getStorageSync(DRAFT_STORAGE_KEY) || {};
    if (coupleId && draft.coupleId !== coupleId) {
      wx.removeStorageSync(DRAFT_STORAGE_KEY);
      this.setData({ cart: [], summary: summarizeCart([]) });
      return;
    }
    const cart = Array.isArray(draft.cart) ? draft.cart : [];
    this.setData({ cart, summary: summarizeCart(cart) });
  },

  updateCart(cart) {
    const summary = summarizeCart(cart);
    const countChanged = summary.count !== this.data.summary.count;
    if (this.cartCountBumpTimer) clearTimeout(this.cartCountBumpTimer);
    this.setData({ cart, summary, cartCountBump: countChanged });
    if (countChanged) {
      this.cartCountBumpTimer = setTimeout(() => {
        this.setData({ cartCountBump: false });
        this.cartCountBumpTimer = null;
      }, 260);
    }
    if (!cart.length) {
      wx.removeStorageSync(DRAFT_STORAGE_KEY);
    } else {
      const draft = wx.getStorageSync(DRAFT_STORAGE_KEY) || {};
      wx.setStorageSync(DRAFT_STORAGE_KEY, {
        cart,
        remark: draft.remark || '',
        coupleId: (this.data.user && this.data.user.coupleId) || ''
      });
    }
    this.refreshDisplayDishes();
  },

  openCart() {
    this.setData({ cartVisible: true });
  },

  closeCart() {
    this.setData({ cartVisible: false });
  },

  async clearCart() {
    if (!this.data.cart.length) return;
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '清空购物车',
        content: '清空后当前选择和备注都会删除，确定继续吗？',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirmed) return;
    this.updateCart(clearCart());
    this.setData({ cartVisible: false });
  },

  onCartDecrease(event) {
    this.updateCart(changeCartQuantity(this.data.cart, event.detail.dishId, -1));
  },

  onCartIncrease(event) {
    const item = this.data.cart.find((cartItem) => cartItem.dishId === event.detail.dishId || cartItem.cartKey === event.detail.dishId);
    if (!item) return;
    const cart = addDishToCart(this.data.cart, item);
    if (summarizeCart(cart).count === this.data.summary.count) {
      wx.showToast({ title: '同一道菜最多 99 份', icon: 'none' });
      return;
    }
    this.updateCart(cart);
  },

  toggleTaste(event) {
    const taste = event.currentTarget.dataset.taste;
    const selectedTastes = this.data.selectedTastes.includes(taste)
      ? this.data.selectedTastes.filter((item) => item !== taste)
      : [...this.data.selectedTastes, taste];
    this.setData({
      selectedTastes,
      tasteOptionsForPanel: this.data.tasteOptionsForPanel.map((item) => ({ ...item, selected: selectedTastes.includes(item.name) }))
    });
  },

  confirmTaste() {
    if (!this.data.pendingDish) return;
    this.addDishWithTastes(this.data.pendingDish, this.data.selectedTastes);
    this.closeTastePanel();
  },

  closeTastePanel() {
    this.setData({ tastePanelVisible: false, pendingDish: null, selectedTastes: [], tasteOptionsForPanel: [] });
  },

  goDishDetail(event) {
    const dish = event.detail.dish;
    wx.setStorageSync('lastDishDetail', dish);
    wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${dish._id || dish.id}&mode=guest` });
  },

  goOrderConfirm() {
    if (this.data.menuError) {
      wx.showToast({ title: '菜单暂时不可用，请先重新加载', icon: 'none' });
      return;
    }
    if (this.data.summary.count === 0) {
      wx.showToast({ title: '先选一道想吃的菜吧', icon: 'none' });
      return;
    }

    const pendingDraft = wx.getStorageSync(DRAFT_STORAGE_KEY) || {};
    wx.setStorageSync(DRAFT_STORAGE_KEY, {
      cart: this.data.cart,
      remark: pendingDraft.remark || '',
      coupleId: (this.data.user && this.data.user.coupleId) || ''
    });
    this.setData({ cartVisible: false });
    wx.navigateTo({
      url: '/pages/order-confirm/order-confirm',
      events: {
        orderDraftChanged: ({ cart }) => this.updateCart(Array.isArray(cart) ? cart : [])
      }
    });
  }
});
