const { getCurrentUser } = require('../../services/user-service');
const { listCategories, listDishes, getDish, saveDish } = require('../../services/dish-service');
const { hasDuplicateDishName, parseTagText } = require('../../utils/domain/menu');
const { DISH_ICON_GROUPS } = require('../../data/dish-icons');

Page({
  data: {
    id: '',
    user: null,
    categories: [],
    existingDishes: [],
    categoryIndex: 0,
    iconGroups: DISH_ICON_GROUPS,
    iconPickerVisible: false,
    saving: false,
    form: {
      name: '',
      categoryId: '',
      description: '',
      ingredients: '',
      method: '',
      tasteOptionsText: '少辣, 不辣, 少油',
      price: '',
      imageUrl: '',
      emoji: '🍽️',
      status: 'online',
      isDeleted: false
    }
  },

  async onLoad(options) {
    wx.setNavigationBarTitle({ title: options.id ? '编辑菜品' : '添加菜品' });
    this.setData({ id: options.id || '' });
    await this.loadForm(options.id, options);
  },

  async loadForm(id, options = {}) {
    const recipePayload = options.fromRecipe === '1' ? wx.getStorageSync('pendingRecipePayload') : null;
    let form = recipePayload
      ? {
        ...this.data.form,
        ...recipePayload,
        status: 'offline',
        tasteOptionsText: (recipePayload.tasteOptions || []).join(', ')
      }
      : this.data.form;
    if (recipePayload && !id) this.setData({ form });

    try {
      const user = await getCurrentUser();
      const [categories, existingDishes] = user.coupleId
        ? await Promise.all([listCategories(user.coupleId), listDishes(user.coupleId)])
        : [[], []];
      if (id) {
        const dish = await getDish(id);
        form = {
          name: dish.name,
          categoryId: dish.categoryId,
          description: dish.description,
          ingredients: dish.ingredients || '',
          method: dish.method || '',
          tasteOptionsText: (dish.tasteOptions || []).join(', '),
          price: String(dish.price),
          imageUrl: dish.imageUrl || '',
          emoji: dish.emoji || '🍽️',
          status: dish.status || 'online',
          isDeleted: false
        };
      } else if (!recipePayload && categories[0]) {
        form = { ...form, categoryId: categories[0]._id };
      }
      const categoryIndex = Math.max(0, categories.findIndex((item) => item._id === form.categoryId));
      this.setData({ user, categories, existingDishes, form, categoryIndex });
    } catch (error) {
      wx.showToast({
        title: recipePayload ? '菜谱内容已带入，分类加载失败' : '菜品加载失败',
        icon: 'none'
      });
    }
  },

  input(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ form: { ...this.data.form, [field]: event.detail.value } });
  },

  chooseCategory(event) {
    const categoryIndex = Number(event.detail.value);
    const category = this.data.categories[categoryIndex];
    if (!category) return;
    this.setData({ categoryIndex, form: { ...this.data.form, categoryId: category._id } });
  },

  switchStatus(event) {
    this.setData({ form: { ...this.data.form, status: event.detail.value ? 'online' : 'offline' } });
  },

  openIconPicker() {
    this.setData({ iconPickerVisible: true });
  },

  closeIconPicker() {
    this.setData({ iconPickerVisible: false });
  },

  stopIconPickerTap() {},

  chooseEmoji(event) {
    const emoji = event.currentTarget.dataset.emoji;
    if (!emoji) return;
    this.setData({
      iconPickerVisible: false,
      form: { ...this.data.form, emoji, imageUrl: '' }
    });
  },

  async chooseImage() {
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
      const file = res.tempFiles[0];
      const cloudPath = `dish-images/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
      const upload = await wx.cloud.uploadFile({ cloudPath, filePath: file.tempFilePath });
      this.setData({ form: { ...this.data.form, imageUrl: upload.fileID } });
    } catch (error) {
      wx.showToast({ title: '图片没有选好', icon: 'none' });
    }
  },

  async save() {
    if (this.data.saving) return;
    const form = this.data.form;
    if (!form.name.trim()) {
      wx.showToast({ title: '菜名不能为空', icon: 'none' });
      return;
    }
    if (!form.categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    if (hasDuplicateDishName(this.data.existingDishes, form.name, this.data.id)) {
      wx.showToast({ title: '这道菜已经存在啦', icon: 'none' });
      return;
    }
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0 || price > 999) {
      wx.showToast({ title: '价格需为 0-999', icon: 'none' });
      return;
    }
    const payload = {
      ...form,
      id: this.data.id,
      coupleId: this.data.user && this.data.user.coupleId,
      name: form.name.trim().slice(0, 12),
      description: form.description.trim().slice(0, 30),
      ingredients: form.ingredients.trim().slice(0, 200),
      method: form.method.trim().slice(0, 300),
      tasteOptions: parseTagText(form.tasteOptionsText).slice(0, 12),
      price,
      salesCount: 0
    };
    this.setData({ saving: true });
    try {
      await saveDish(payload);
      wx.removeStorageSync('pendingRecipePayload');
      wx.showToast({ title: '菜品保存好啦', icon: 'none' });
      wx.navigateBack();
    } catch (error) {
      wx.showToast({ title: error.message || '菜品保存失败', icon: 'none' });
    } finally {
      this.setData({ saving: false });
    }
  }
});
