function normalizeDishName(name) {
  return String(name || '').trim();
}

function parseTagText(text) {
  return String(text || '')
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index);
}

function hasDuplicateDishName(dishes, name, currentId) {
  const target = normalizeDishName(name);
  if (!target) return false;
  return (Array.isArray(dishes) ? dishes : []).some((dish) => {
    const dishId = dish._id || dish.id;
    if (currentId && dishId === currentId) return false;
    return !dish.isDeleted && normalizeDishName(dish.name) === target;
  });
}

function groupDishesByCategory({ categories, dishes }) {
  const dishList = Array.isArray(dishes) ? dishes : [];
  const groups = (Array.isArray(categories) ? categories : []).map((category) => ({
    ...category,
    id: category._id || category.id,
    dishes: dishList.filter((dish) => dish.categoryId === (category._id || category.id))
  }));

  const knownCategoryIds = new Set(groups.map((group) => group._id || group.id));
  const uncategorized = dishList.filter((dish) => !knownCategoryIds.has(dish.categoryId));
  if (uncategorized.length) {
    groups.push({ _id: 'uncategorized', id: 'uncategorized', name: '未分类', dishes: uncategorized });
  }
  return groups;
}

function createEmptyMenuGroup() {
  return { _id: '', id: '', name: '', dishes: [] };
}

function buildMenuTabState({ categories, dishes, selectedCategoryId }) {
  const menuGroups = groupDishesByCategory({ categories, dishes });
  const selectedGroup = menuGroups.find((group) => (group._id || group.id) === selectedCategoryId) || menuGroups[0] || createEmptyMenuGroup();
  const nextSelectedCategoryId = selectedGroup._id || selectedGroup.id || '';

  return {
    menuGroups,
    selectedCategoryId: nextSelectedCategoryId,
    selectedGroup
  };
}

function withDishDefaults(dish) {
  return {
    ...dish,
    tasteOptions: Array.isArray(dish.tasteOptions) && dish.tasteOptions.length
      ? dish.tasteOptions
      : ['少辣', '不辣', '少油'],
    ingredients: dish.ingredients || '',
    method: dish.method || ''
  };
}

module.exports = {
  normalizeDishName,
  buildMenuTabState,
  parseTagText,
  hasDuplicateDishName,
  groupDishesByCategory,
  withDishDefaults
};
