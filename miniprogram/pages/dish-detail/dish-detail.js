const { getDish } = require('../../services/dish-service');
const { withDishDefaults } = require('../../utils/domain/menu');

Page({
  data: {
    id: '',
    dish: null,
    canOrder: false,
    loading: true,
    error: ''
  },

  async onLoad(options) {
    const id = options.id || '';
    this.setData({ id, canOrder: options.mode === 'guest' });
    await this.loadDish(id);
  },

  addToOrder() {
    if (!this.data.dish) return;
    wx.setStorageSync('detailSelectedDish', this.data.dish);
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/pages/order/order' })
    });
  },

  async loadDish(id) {
    const cached = wx.getStorageSync('lastDishDetail');
    if (cached && (cached._id === id || cached.id === id)) {
      this.setData({ dish: withDishDefaults(cached), loading: false, error: '' });
    }
    if (!id || id.startsWith('default-') || id.startsWith('dish-')) {
      if (!this.data.dish) this.setData({ loading: false, error: '没有找到这道菜' });
      return;
    }
    try {
      const dish = await getDish(id);
      if (!dish) throw new Error('没有找到这道菜');
      this.setData({ dish: withDishDefaults(dish), loading: false, error: '' });
    } catch (error) {
      this.setData({ loading: false, error: error.message || '菜品详情加载失败' });
      if (!this.data.dish) wx.showToast({ title: error.message || '菜品详情加载失败', icon: 'none' });
    }
  }
});
