const { getCurrentUser } = require('../../services/user-service');
const { listCategories, listDishes } = require('../../services/dish-service');
const { RECIPE_LIBRARY, listRecipeCategories, filterRecipes, getRecipeById, getRecipeCover, markAddedRecipes, recipeToDishPayload } = require('../../utils/recipe-library');

const PAGE_SIZE = 60;

Page({
  data: {
    keyword: '',
    categories: [],
    selectedCategory: 'all',
    recipes: [],
    totalCount: 0,
    visibleCount: PAGE_SIZE,
    hasMore: false,
    addingRecipeId: '',
    addedRecipeIds: [],
    expandedId: ''
  },

  onLoad() {
    const categories = listRecipeCategories(RECIPE_LIBRARY);
    this.setData({
      categories
    });
    this.refreshRecipes();
  },

  async onShow() {
    await this.refreshAddedRecipes();
  },

  async refreshAddedRecipes() {
    try {
      const user = await getCurrentUser();
      if (!user.coupleId) {
        this.setData({ addedRecipeIds: [] });
        this.refreshRecipes({ keepVisibleCount: true });
        return;
      }
      const dishes = await listDishes(user.coupleId);
      const addedRecipeIds = markAddedRecipes(RECIPE_LIBRARY, dishes)
        .filter((recipe) => recipe.added)
        .map((recipe) => recipe.id);
      this.setData({ addedRecipeIds });
      this.refreshRecipes({ keepVisibleCount: true });
    } catch (error) {
      this.setData({ addedRecipeIds: [] });
      this.refreshRecipes({ keepVisibleCount: true });
    }
  },

  onSearchInput(event) {
    this.setData({ keyword: event.detail.value || '' });
    this.refreshRecipes();
  },

  selectCategory(event) {
    this.setData({ selectedCategory: event.currentTarget.dataset.category || 'all' });
    this.refreshRecipes();
  },

  decorateRecipes(recipes) {
    const addedRecipeIds = this.data.addedRecipeIds || [];
    return recipes.map((recipe) => ({ ...recipe, cover: getRecipeCover(recipe), added: addedRecipeIds.includes(recipe.id) }));
  },

  refreshRecipes(options = {}) {
    const filteredRecipes = filterRecipes(RECIPE_LIBRARY, {
      keyword: this.data.keyword,
      category: this.data.selectedCategory
    });
    const nextVisibleCount = options.keepVisibleCount ? Math.max(PAGE_SIZE, this.data.visibleCount) : PAGE_SIZE;
    const visibleRecipes = this.decorateRecipes(filteredRecipes.slice(0, nextVisibleCount));
    this.setData({
      recipes: visibleRecipes,
      totalCount: filteredRecipes.length,
      visibleCount: visibleRecipes.length,
      hasMore: filteredRecipes.length > visibleRecipes.length,
      expandedId: filteredRecipes.some((recipe) => recipe.id === this.data.expandedId) ? this.data.expandedId : ''
    });
  },

  loadMore() {
    const filteredRecipes = filterRecipes(RECIPE_LIBRARY, {
      keyword: this.data.keyword,
      category: this.data.selectedCategory
    });
    const nextVisibleCount = this.data.visibleCount + PAGE_SIZE;
    const visibleRecipes = this.decorateRecipes(filteredRecipes.slice(0, nextVisibleCount));
    this.setData({
      recipes: visibleRecipes,
      visibleCount: visibleRecipes.length,
      hasMore: filteredRecipes.length > visibleRecipes.length
    });
  },

  toggleRecipe(event) {
    const id = event.currentTarget.dataset.id;
    this.setData({ expandedId: this.data.expandedId === id ? '' : id });
  },

  async addRecipeToMenu(event) {
    const id = event.currentTarget.dataset.id;
    const recipe = getRecipeById(id);
    if (!recipe) {
      wx.showToast({ title: '没有找到这道菜', icon: 'none' });
      return;
    }
    if ((this.data.addedRecipeIds || []).includes(id)) {
      wx.showToast({ title: '这道菜已经在菜单里啦', icon: 'none' });
      return;
    }
    if (this.data.addingRecipeId) return;
    this.setData({ addingRecipeId: id });
    try {
      const user = await getCurrentUser();
      if (!user.coupleId) {
        wx.showToast({ title: '先去我的页面开启情侣空间', icon: 'none' });
        return;
      }
      const categories = await listCategories(user.coupleId);
      const payload = recipeToDishPayload(recipe, categories);
      wx.setStorageSync('pendingRecipePayload', { ...payload, status: 'offline' });
      wx.navigateTo({ url: '/pages/dish-edit/dish-edit?fromRecipe=1' });
    } catch (error) {
      wx.showToast({ title: error.message || '加入菜单失败', icon: 'none' });
    } finally {
      this.setData({ addingRecipeId: '' });
    }
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.refreshRecipes();
  }
});
