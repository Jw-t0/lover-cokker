const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

function isCollectionMissing(error) {
  const message = error && (error.message || error.errMsg || String(error));
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function ensureCollection(name) {
  await db.createCollection(name).catch((error) => {
    const message = error && (error.message || error.errMsg || String(error));
    if (!message.includes('exist') && !message.includes('already')) throw error;
  });
}

const DEFAULT_CATEGORIES = [
  { name: '肉菜', sort: 1 },
  { name: '家常菜', sort: 2 },
  { name: '主食', sort: 3 },
  { name: '早餐', sort: 4 },
  { name: '汤', sort: 5 },
  { name: '凉菜', sort: 6 },
  { name: '甜品', sort: 7 },
  { name: '饮料', sort: 8 },
  { name: '水果', sort: 9 }
];

const DEFAULT_DISHES = [
  { name: '可乐鸡翅', categoryName: '肉菜', description: '甜咸口，适合下饭', price: 28, emoji: '🍗', ingredients: '鸡翅、可乐、姜片', method: '鸡翅煎香后倒入可乐和调味料，小火收汁。', tasteOptions: ['少甜', '多汁', '微辣'] },
  { name: '番茄炒蛋', categoryName: '家常菜', description: '家常味，酸甜开胃', price: 16, emoji: '🍅', ingredients: '番茄、鸡蛋、葱花', method: '鸡蛋先炒嫩，番茄炒出汁后回锅拌匀。', tasteOptions: ['少油', '多汁', '不葱'] },
  { name: '土豆炖牛腩', categoryName: '肉菜', description: '软烂入味，适合认真吃饭', price: 38, emoji: '🥩', ingredients: '牛腩、土豆、胡萝卜', method: '牛腩焯水后慢炖，土豆最后加入保持绵软。', tasteOptions: ['少辣', '多汤', '软烂'] },
  { name: '青椒肉丝', categoryName: '家常菜', description: '经典家常菜，微微下饭', price: 22, emoji: '🥘', ingredients: '青椒、猪肉丝、蒜', method: '肉丝滑炒后加入青椒大火快炒。', tasteOptions: ['不辣', '少蒜', '多肉'] },
  { name: '煎蛋三明治', categoryName: '早餐', description: '简单但很幸福', price: 12, emoji: '🥪', ingredients: '吐司、鸡蛋、生菜', method: '吐司烘热，夹入煎蛋和生菜。', tasteOptions: ['不酱', '加蛋', '少菜'] },
  { name: '紫菜蛋花汤', categoryName: '汤', description: '清淡暖胃', price: 10, emoji: '🥣', ingredients: '紫菜、鸡蛋、虾皮', method: '清汤烧开后淋入蛋液，撒紫菜虾皮。', tasteOptions: ['少盐', '多蛋', '不虾皮'] },
  { name: '水果拼盘', categoryName: '水果', description: '饭后清爽一点', price: 18, emoji: '🍓', ingredients: '草莓、苹果、蓝莓', method: '水果洗净切块，冷藏后装盘。', tasteOptions: ['不要苹果', '多草莓', '常温'] },
  { name: '红烧鸡翅', categoryName: '肉菜', description: '酱香浓郁，家常下饭', price: 28, emoji: '🍗' },
  { name: '黄焖鸡', categoryName: '肉菜', description: '鸡肉软嫩，汤汁拌饭', price: 32, emoji: '🍲' },
  { name: '宫保鸡丁', categoryName: '肉菜', description: '酸甜微辣，花生香脆', price: 28, emoji: '🥜' },
  { name: '回锅肉', categoryName: '肉菜', description: '咸香下饭，肥而不腻', price: 32, emoji: '🥓' },
  { name: '糖醋排骨', categoryName: '肉菜', description: '酸甜入味，大人小孩都爱吃', price: 38, emoji: '🍖' },
  { name: '红烧肉', categoryName: '肉菜', description: '软糯浓香，配米饭刚好', price: 36, emoji: '🍖' },
  { name: '水煮肉片', categoryName: '肉菜', description: '麻辣鲜香，特别下饭', price: 36, emoji: '🌶️' },
  { name: '鱼香肉丝', categoryName: '肉菜', description: '酸甜咸香，经典家常味', price: 24, emoji: '🥢' },
  { name: '麻婆豆腐', categoryName: '家常菜', description: '麻辣鲜香，拌饭很满足', price: 18, emoji: '🍲' },
  { name: '鱼香茄子', categoryName: '家常菜', description: '茄子软糯，鱼香浓郁', price: 20, emoji: '🍆' },
  { name: '手撕包菜', categoryName: '家常菜', description: '爽脆清香，简单下饭', price: 16, emoji: '🥬' },
  { name: '地三鲜', categoryName: '家常菜', description: '土豆茄子青椒的家常组合', price: 20, emoji: '🥔' },
  { name: '青椒土豆炒肉', categoryName: '家常菜', description: '食材简单，香辣下饭', price: 22, emoji: '🥔' },
  { name: '蒜苔炒肉末', categoryName: '家常菜', description: '咸香脆嫩，配饭很香', price: 22, emoji: '🥢' },
  { name: '酸辣土豆丝', categoryName: '家常菜', description: '爽脆开胃，百吃不腻', price: 14, emoji: '🥔' },
  { name: '清炒时蔬', categoryName: '家常菜', description: '清爽简单，搭配正餐', price: 14, emoji: '🥦' },
  { name: '蛋炒饭', categoryName: '主食', description: '剩饭也能炒出香气', price: 16, emoji: '🍳' },
  { name: '扬州炒饭', categoryName: '主食', description: '颗粒分明，配料丰富', price: 22, emoji: '🍚' },
  { name: '速冻水饺', categoryName: '早餐', description: '方便快速的一餐', price: 18, emoji: '🥟' },
  { name: '冬瓜排骨汤', categoryName: '汤', description: '清淡鲜美，适合日常喝', price: 24, emoji: '🥣' },
  { name: '番茄牛腩汤', categoryName: '汤', description: '酸香开胃，汤汁浓郁', price: 32, emoji: '🍅' },
  { name: '凉拌黄瓜', categoryName: '凉菜', description: '清爽脆口，开胃解腻', price: 12, emoji: '🥒' },
  { name: '凉拌鸡丝', categoryName: '凉菜', description: '鲜嫩爽口，低负担', price: 22, emoji: '🥗' },
  { name: '银耳羹', categoryName: '甜品', description: '清甜软糯，饭后小甜品', price: 12, emoji: '🍵' },
  { name: '懒人蛋挞', categoryName: '甜品', description: '外酥里嫩，简单满足', price: 16, emoji: '🥧' },
  { name: '柠檬水', categoryName: '饮料', description: '清新解腻，冷热皆可', price: 8, emoji: '🍋' },
  { name: '蜂蜜水', categoryName: '饮料', description: '清甜顺口，日常饮品', price: 8, emoji: '🍯' }
];

async function getCurrentUser(openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get();
  if (!res.data.length) throw new Error('USER_NOT_FOUND');
  return res.data[0];
}

async function ensureCouple(user) {
  if (user.coupleId) return user.coupleId;
  const data = {
    memberIds: [user._id],
    status: 'active',
    createdBy: user._id,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  let res;
  try {
    res = await db.collection('couples').add({ data });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('couples');
    res = await db.collection('couples').add({ data });
  }
  await db.collection('users').doc(user._id).update({ data: { coupleId: res._id, updatedAt: Date.now() } });
  return res._id;
}

async function ensureDefaultMenu(coupleId) {
  let existingCategories;
  let existingDishes;
  try {
    [existingCategories, existingDishes] = await Promise.all([
      db.collection('categories').where({ coupleId }).get(),
      db.collection('dishes').where({ coupleId }).get()
    ]);
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('categories');
    await ensureCollection('dishes');
    existingCategories = { data: [] };
    existingDishes = { data: [] };
  }

  const categoryEntries = await Promise.all(DEFAULT_CATEGORIES.map(async (category) => {
    const current = existingCategories.data.find((item) => item.name === category.name);
    if (current) {
      if (current.sort !== category.sort) {
        await db.collection('categories').doc(current._id).update({ data: { sort: category.sort, updatedAt: Date.now() } });
      }
      return [category.name, current._id];
    }
    const res = await db.collection('categories').add({ data: { ...category, coupleId, createdAt: Date.now(), updatedAt: Date.now() } });
    return [category.name, res._id];
  }));
  const categoryMap = Object.fromEntries(categoryEntries);

  const existingDishMap = new Map(existingDishes.data.map((item) => [item.name, item]));
  await Promise.all(DEFAULT_DISHES.map(async (dish) => {
    const current = existingDishMap.get(dish.name);
    if (current) {
      if (current.isDeleted) return;
      const updates = {};
      if (current.categoryId !== categoryMap[dish.categoryName]) updates.categoryId = categoryMap[dish.categoryName];
      if (current.categoryName !== dish.categoryName) updates.categoryName = dish.categoryName;
      if (Object.keys(updates).length) {
        updates.updatedAt = Date.now();
        await db.collection('dishes').doc(current._id).update({ data: updates });
      }
      return;
    }
    await db.collection('dishes').add({
      data: {
        coupleId,
        categoryId: categoryMap[dish.categoryName],
        categoryName: dish.categoryName,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        imageUrl: '',
        emoji: dish.emoji,
        ingredients: dish.ingredients || '',
        method: dish.method || '',
        tasteOptions: dish.tasteOptions || [],
        status: 'online',
        salesCount: 0,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  }));
}

exports.main = async (event = {}) => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const coupleId = await ensureCouple(user);
  if (event.mode === 'solo' && user.pendingCoupleId) {
    await db.collection('users').doc(user._id).update({
      data: { pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() }
    });
  }
  await ensureDefaultMenu(coupleId);
  return { ok: true, coupleId, mode: event.mode || 'ensure' };
};
