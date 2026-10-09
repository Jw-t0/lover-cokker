const { HOWTOCOOK_RECIPES } = require('../data/howtocook-recipes');

const RECIPE_LIBRARY = HOWTOCOOK_RECIPES;

const CATEGORY_NAME_MAP = {
  荤菜: '肉菜',
  水产: '肉菜',
  素菜: '家常菜',
  主食: '家常菜',
  半成品: '家常菜',
  调料: '家常菜',
  汤羹: '汤',
  甜品: '甜品',
  饮品: '饮料',
  早餐: '早餐'
};

const CATEGORY_PRICE_MAP = {
  荤菜: 28,
  水产: 32,
  素菜: 16,
  主食: 18,
  半成品: 18,
  调料: 8,
  汤羹: 12,
  甜品: 16,
  饮品: 10,
  早餐: 12
};

const RECIPE_COVER_RULES = [
  { keywords: ['鸡蛋', '蛋黄', '咸蛋', '皮蛋'], icon: '🥚' },
  { keywords: ['鸡翅', '鸡腿', '鸡胸', '鸡爪', '鸡肉', '鸡'], icon: '🍗' },
  { keywords: ['鱼香肉丝', '肉丝', '肉末', '猪肉', '五花肉', '排骨', '猪蹄', '肘子', '叉烧', '腊肉', '香肠'], icon: '🍖' },
  { keywords: ['牛肉', '牛腩', '牛排', '肥牛'], icon: '🥩' },
  { keywords: ['虾仁', '大虾', '虾'], icon: '🦐' },
  { keywords: ['螃蟹', '蟹'], icon: '🦀' },
  { keywords: ['鱿鱼', '墨鱼', '章鱼'], icon: '🦑' },
  { keywords: ['三文鱼', '鳗鱼', '鳝鱼', '白鱔', '鱼头', '带鱼', '鳕鱼', '鲤鱼', '鲫鱼', '鲈鱼', '鱼'], icon: '🐟' },
  { keywords: ['西红柿', '番茄'], icon: '🍅' },
  { keywords: ['茄子'], icon: '🍆' },
  { keywords: ['土豆', '马铃薯'], icon: '🥔' },
  { keywords: ['胡萝卜'], icon: '🥕' },
  { keywords: ['西兰花', '花菜', '菜花'], icon: '🥦' },
  { keywords: ['青菜', '生菜', '白菜', '菠菜', '包菜', '芹菜'], icon: '🥬' },
  { keywords: ['米饭', '炒饭', '盖饭', '焖饭', '粥'], icon: '🍚' },
  { keywords: ['饺子', '馄饨', '包子'], icon: '🥟' },
  { keywords: ['面条', '拉面', '意大利面', '方便面', '河粉', '米线', '拌面', '面'], icon: '🍜' },
  { keywords: ['面包', '吐司'], icon: '🍞' },
  { keywords: ['汤', '羹'], icon: '🥣' },
  { keywords: ['蛋糕', '甜品', '布丁', '冰淇淋', '蛋挞'], icon: '🍰' },
  { keywords: ['奶茶'], icon: '🧋' },
  { keywords: ['果汁', '茶', '咖啡', '饮料'], icon: '🥤' }
];

const CATEGORY_COVER_MAP = {
  荤菜: '🍖',
  水产: '🐟',
  素菜: '🥬',
  主食: '🍚',
  半成品: '🥘',
  调料: '🧂',
  汤羹: '🥣',
  甜品: '🍰',
  饮品: '🥤',
  早餐: '🥪'
};

function getRecipeCover(recipe = {}) {
  const name = String(recipe.name || '');
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.join(' ') : String(recipe.ingredients || '');
  const nameRule = RECIPE_COVER_RULES.find((rule) => rule.keywords.some((keyword) => name.includes(keyword)));
  if (nameRule) return nameRule.icon;
  const ingredientRule = RECIPE_COVER_RULES.find((rule) => rule.keywords.some((keyword) => ingredients.includes(keyword)));
  if (ingredientRule) return ingredientRule.icon;
  return CATEGORY_COVER_MAP[recipe.category] || recipe.cover || '🍽️';
}

function listRecipeCategories(recipes = RECIPE_LIBRARY) {
  const names = recipes.map((recipe) => recipe.category).filter(Boolean);
  return Array.from(new Set(names));
}

function filterRecipes(recipes = RECIPE_LIBRARY, filters = {}) {
  const keyword = String(filters.keyword || '').trim().toLowerCase();
  const category = filters.category || 'all';
  return recipes.filter((recipe) => {
    const matchesCategory = category === 'all' || recipe.category === category;
    const haystack = [
      recipe.name,
      recipe.summary,
      recipe.category,
      recipe.difficulty,
      ...(recipe.ingredients || []),
      ...(recipe.steps || []),
      ...(recipe.tags || [])
    ].join(' ').toLowerCase();
    return matchesCategory && (!keyword || haystack.includes(keyword));
  });
}

function getRecipeById(id, recipes = RECIPE_LIBRARY) {
  return recipes.find((recipe) => recipe.id === id) || null;
}

function getRecipeMenuName(recipe) {
  return String((recipe && recipe.name) || '新菜品').trim().slice(0, 12);
}

function markAddedRecipes(recipes = RECIPE_LIBRARY, dishes = []) {
  const addedNames = new Set((Array.isArray(dishes) ? dishes : [])
    .filter((dish) => !dish.isDeleted)
    .map((dish) => String(dish.name || '').trim())
    .filter(Boolean));
  return recipes.map((recipe) => ({
    ...recipe,
    added: addedNames.has(getRecipeMenuName(recipe))
  }));
}

function findTargetCategory(recipe, categories = []) {
  const targetName = CATEGORY_NAME_MAP[recipe.category] || recipe.category || '家常菜';
  return categories.find((category) => category.name === targetName)
    || categories.find((category) => category.name === recipe.category)
    || categories.find((category) => category.name === '家常菜')
    || categories[0]
    || null;
}

function recipeToDishPayload(recipe, categories = []) {
  const targetCategory = findTargetCategory(recipe || {}, categories);
  if (!targetCategory) throw new Error('请先创建菜单分类');
  const ingredients = (recipe.ingredients || []).slice(0, 12).join('、');
  const method = (recipe.steps || []).slice(0, 8).map((step, index) => `${index + 1}. ${step}`).join('\n');
  return {
    categoryId: targetCategory._id || targetCategory.id,
    name: getRecipeMenuName(recipe),
    description: String(recipe.summary || `${recipe.name}的做法`).trim().slice(0, 30),
    ingredients: ingredients.slice(0, 200),
    method: method.slice(0, 300),
    tasteOptions: ['少油', '少盐', '不辣'],
    price: CATEGORY_PRICE_MAP[recipe.category] || 18,
    imageUrl: '',
    emoji: getRecipeCover(recipe),
    status: 'online',
    isDeleted: false,
    salesCount: 0
  };
}

module.exports = {
  RECIPE_LIBRARY,
  listRecipeCategories,
  filterRecipes,
  getRecipeById,
  getRecipeMenuName,
  getRecipeCover,
  markAddedRecipes,
  recipeToDishPayload
};
