const test = require('node:test');
const assert = require('node:assert/strict');
const { RECIPE_LIBRARY, listRecipeCategories, filterRecipes, markAddedRecipes, recipeToDishPayload, getRecipeCover } = require('../miniprogram/utils/recipe-library');

test('recipe library ships usable recipes with ingredients and cooking steps', () => {
  assert.equal(RECIPE_LIBRARY.length >= 100, true);
  for (const recipe of RECIPE_LIBRARY) {
    assert.equal(Boolean(recipe.name), true);
    assert.equal(Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0, true);
    assert.equal(Array.isArray(recipe.steps) && recipe.steps.length > 1, true);
    assert.equal(Boolean(recipe.sourceName), true);
  }
  assert.equal(RECIPE_LIBRARY.some((recipe) => recipe.sourceType === 'howtocook'), true);
});

test('recipe library supports category and keyword filtering', () => {
  const categories = listRecipeCategories(RECIPE_LIBRARY);
  assert.equal(categories.includes('荤菜'), true);
  assert.equal(categories.includes('素菜'), true);

  const chickenRecipes = filterRecipes(RECIPE_LIBRARY, { keyword: '鸡翅', category: 'all' });
  assert.equal(chickenRecipes.some((recipe) => recipe.name.includes('鸡翅')), true);

  const breakfastRecipes = filterRecipes(RECIPE_LIBRARY, { keyword: '', category: '早餐' });
  assert.equal(breakfastRecipes.every((recipe) => recipe.category === '早餐'), true);
});

test('selects recipe icons from specific names, ingredients, and category fallbacks', () => {
  assert.equal(getRecipeCover({ name: '可乐鸡翅', category: '荤菜', cover: '🍖' }), '🍗');
  assert.equal(getRecipeCover({ name: '鱼香肉丝', category: '水产', cover: '🐟' }), '🍖');
  assert.equal(getRecipeCover({ name: '家常小炒', ingredients: ['虾仁 100g'], category: '素菜' }), '🦐');
  assert.equal(getRecipeCover({ name: '家常小炒', category: '汤羹', cover: '🧂' }), '🥣');
  assert.equal(getRecipeCover({ name: '家常小炒', cover: '🫕' }), '🫕');
  assert.equal(getRecipeCover({ name: '家常小炒' }), '🍽️');
});

test('converts a recipe into a chef menu dish payload using existing categories', () => {
  const recipe = {
    id: 'howtocook-meat-dish-cola-chicken',
    name: '可乐鸡翅',
    category: '荤菜',
    cover: '🍖',
    summary: '可乐鸡翅色泽红亮、口感嫩滑。',
    ingredients: ['鸡翅 10 只', '可乐 500ml'],
    steps: ['鸡翅焯水。', '倒入可乐收汁。']
  };
  const categories = [
    { _id: 'c-meat', name: '肉菜' },
    { _id: 'c-home', name: '家常菜' }
  ];

  const payload = recipeToDishPayload(recipe, categories);

  assert.equal(payload.name, '可乐鸡翅');
  assert.equal(payload.categoryId, 'c-meat');
  assert.equal(payload.description, '可乐鸡翅色泽红亮、口感嫩滑。');
  assert.equal(payload.ingredients, '鸡翅 10 只、可乐 500ml');
  assert.equal(payload.method, '1. 鸡翅焯水。\n2. 倒入可乐收汁。');
  assert.equal(payload.emoji, '🍗');
  assert.equal(payload.price, 28);
  assert.equal(payload.status, 'online');
});

test('marks recipes already added to the chef menu by dish name', () => {
  const recipes = [
    { id: 'r1', name: '可乐鸡翅' },
    { id: 'r2', name: '番茄炒蛋' }
  ];
  const dishes = [
    { _id: 'd1', name: '可乐鸡翅', isDeleted: false },
    { _id: 'd2', name: '番茄炒蛋', isDeleted: true }
  ];

  const marked = markAddedRecipes(recipes, dishes);

  assert.equal(marked[0].added, true);
  assert.equal(marked[1].added, false);
});

test('recipe library sends new recipes through the dish editor for review before publishing', () => {
  const page = require('node:fs').readFileSync(require('node:path').join(__dirname, '../miniprogram/pages/recipes/recipes.js'), 'utf8');

  assert.match(page, /pendingRecipePayload/);
  assert.match(page, /pages\/dish-edit\/dish-edit\?fromRecipe=1/);
  assert.doesNotMatch(page, /await saveDish\(payload\)/);
});
