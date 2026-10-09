const { DEFAULT_CATEGORIES, DEFAULT_DISHES } = require('./constants');

function buildDefaultMenu() {
  const categories = DEFAULT_CATEGORIES.map((item, index) => ({
    ...item,
    _id: `default-${index}`,
    id: `default-${index}`
  }));

  const dishes = DEFAULT_DISHES.map((item, index) => {
    const category = categories.find((cat) => cat.name === item.categoryName);
    return {
      ...item,
      _id: `dish-${index}`,
      id: `dish-${index}`,
      categoryId: category._id,
      status: 'online',
      imageUrl: '',
      method: item.method || '',
      ingredients: item.ingredients || '',
      tasteOptions: item.tasteOptions || ['少辣', '不辣', '少油'],
      isDeleted: false
    };
  });

  return { categories, dishes };
}

module.exports = {
  buildDefaultMenu
};
