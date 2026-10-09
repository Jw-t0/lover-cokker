const { getCurrentUser, refreshCurrentUser } = require('../../services/user-service');
const { listCategories, listDishes, updateDishStatus, deleteDish, resetDefaultMenu, createCategory } = require('../../services/dish-service');
const { buildMenuTabState, withDishDefaults } = require('../../utils/domain/menu');

Page({
  data: {
    user: null,
    categories: [],
    dishes: [],
    menuGroups: [],
    selectedCategoryId: '',
    selectedGroup: { _id: '', id: '', name: '', dishes: [] },
    loading: true,
    error: ''
  },

  async onShow() {
    await this.loadMenu();
  },

  async loadMenu() {
    this.setData({ loading: true, error: '' });
    try {
      const user = await getCurrentUser();
      if (!user.coupleId) {
        this.setData({ user, categories: [], dishes: [], menuGroups: [], selectedCategoryId: '', selectedGroup: { _id: '', id: '', name: '', dishes: [] } });
        this.setData({ loading: false });
        return;
      }
      const [categories, dishes] = await Promise.all([listCategories(user.coupleId), listDishes(user.coupleId)]);
      const categoryMap = categories.reduce((map, category) => {
        map[category._id] = category.name;
        return map;
      }, {});
      const normalizedDishes = dishes.map((dish) => withDishDefaults({ ...dish, id: dish._id, categoryName: categoryMap[dish.categoryId] || '菜品' }));
      const tabState = buildMenuTabState({
        categories,
        dishes: normalizedDishes,
        selectedCategoryId: this.data.selectedCategoryId
      });
      this.setData({
        user,
        categories,
        dishes: normalizedDishes,
        ...tabState
      });
    } catch (error) {
      this.setData({ error: error.message || '菜单加载失败' });
      wx.showToast({ title: '菜单加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  retry() {
    this.loadMenu();
  },

  selectCategory(event) {
    const selectedCategoryId = event.currentTarget.dataset.id;
    this.setData(buildMenuTabState({
      categories: this.data.categories,
      dishes: this.data.dishes,
      selectedCategoryId
    }));
  },

  addDish() {
    wx.navigateTo({ url: '/pages/dish-edit/dish-edit' });
  },

  async initializeMenu() {
    try {
      await resetDefaultMenu({ mode: 'solo' });
      await refreshCurrentUser();
      wx.showToast({ title: '默认菜单已准备好', icon: 'none' });
      await this.loadMenu();
    } catch (error) {
      wx.showToast({ title: error.message || '菜单初始化失败', icon: 'none' });
    }
  },

  async addCategory() {
    const name = await new Promise((resolve) => {
      wx.showModal({
        title: '新增分类',
        editable: true,
        placeholderText: '例如：夜宵',
        confirmText: '保存',
        success: (res) => resolve(res.confirm ? res.content : '')
      });
    });
    const categoryName = String(name || '').trim();
    if (!categoryName) {
      wx.showToast({ title: '分类名不能为空', icon: 'none' });
      return;
    }
    try {
      const category = await createCategory(categoryName);
      wx.showToast({ title: '分类已添加', icon: 'none' });
      this.setData({ selectedCategoryId: category._id || category.id });
      this.loadMenu();
    } catch (error) {
      wx.showToast({ title: error.message || '分类添加失败', icon: 'none' });
    }
  },

  editDish(event) {
    const dish = event.detail.dish;
    wx.navigateTo({ url: `/pages/dish-edit/dish-edit?id=${dish._id || dish.id}` });
  },

  goDishDetail(event) {
    const dish = event.detail.dish;
    wx.setStorageSync('lastDishDetail', dish);
    wx.navigateTo({ url: `/pages/dish-detail/dish-detail?id=${dish._id || dish.id}` });
  },

  async toggleDish(event) {
    try {
      const dish = event.detail.dish;
      const next = dish.status === 'online' ? 'offline' : 'online';
      await updateDishStatus(dish._id || dish.id, next);
      wx.showToast({ title: next === 'online' ? '已上架' : '已下架', icon: 'none' });
      this.loadMenu();
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  async deleteDish(event) {
    const dish = event.detail.dish;
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: '删除菜品',
        content: '删除后客人将看不到这道菜，历史订单不会受影响。确定删除吗？',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;
    try {
      await deleteDish(dish._id || dish.id);
      wx.showToast({ title: '已删除', icon: 'none' });
      this.loadMenu();
    } catch (error) {
      wx.showToast({ title: error.message || '删除失败', icon: 'none' });
    }
  },

  async resetMenu() {
    const confirm = await new Promise((resolve) => {
      wx.showModal({
        title: '补齐默认菜单',
        content: '会补齐缺少的默认分类和菜品，不会删除自定义菜品，也不会影响已有订单。确定继续吗？',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirm) return;
    try {
      await resetDefaultMenu();
      await refreshCurrentUser();
      wx.showToast({ title: '默认菜单已补齐', icon: 'none' });
      this.loadMenu();
    } catch (error) {
      wx.showToast({ title: error.message || '重置失败', icon: 'none' });
    }
  }
});
