const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const INVITE_CLAIM_TIMEOUT = 60 * 1000;

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
  { name: '可乐鸡翅', categoryName: '肉菜', description: '甜咸口，适合下饭', price: 28, emoji: '🍗' },
  { name: '番茄炒蛋', categoryName: '家常菜', description: '家常味，酸甜开胃', price: 16, emoji: '🍅' },
  { name: '土豆炖牛腩', categoryName: '肉菜', description: '软烂入味，适合认真吃饭', price: 38, emoji: '🥩' },
  { name: '青椒肉丝', categoryName: '家常菜', description: '经典家常菜，微微下饭', price: 22, emoji: '🥘' },
  { name: '煎蛋三明治', categoryName: '早餐', description: '简单但很幸福', price: 12, emoji: '🥪' },
  { name: '紫菜蛋花汤', categoryName: '汤', description: '清淡暖胃', price: 10, emoji: '🥣' },
  { name: '水果拼盘', categoryName: '水果', description: '饭后清爽一点', price: 18, emoji: '🍓' },
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

async function getCouple(coupleId) {
  if (!coupleId) return null;
  try {
    const res = await db.collection('couples').doc(coupleId).get();
    return res.data || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

async function getUser(userId) {
  if (!userId) return null;
  try {
    const res = await db.collection('users').doc(userId).get();
    return res.data || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

function canMoveFromCurrentCouple(currentCouple, accepter) {
  const memberIds = currentCouple && Array.isArray(currentCouple.memberIds) ? currentCouple.memberIds : [];
  return memberIds.length <= 1 && (!memberIds[0] || memberIds[0] === accepter._id);
}

function canRestoreCouple(couple, invite, accepter, now) {
  const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
  return couple && couple.status === 'pending_delete' && Number(couple.deleteAt || 0) > now &&
    memberIds.length === 2 && memberIds.includes(invite.creatorUserId) && memberIds.includes(accepter._id);
}

function canRestoreMembers(coupleId, creator, accepter, now) {
  return creator && accepter &&
    !creator.coupleId && creator.pendingCoupleId === coupleId && Number(creator.pendingCoupleDeleteAt || 0) > now &&
    !accepter.coupleId && accepter.pendingCoupleId === coupleId && Number(accepter.pendingCoupleDeleteAt || 0) > now;
}

async function claimInvite(inviteId, accepterId, now) {
  const result = await db.collection('invites').where({ _id: inviteId, status: 'active' }).update({
    data: { status: 'processing', processingBy: accepterId, processingAt: now }
  });
  if (result.stats && result.stats.updated === 1) return;
  const recovered = await db.collection('invites').where({
    _id: inviteId,
    status: 'processing',
    processingAt: _.lt(now - INVITE_CLAIM_TIMEOUT)
  }).update({ data: { status: 'active', processingBy: '', processingAt: 0 } });
  if (recovered.stats && recovered.stats.updated === 1) {
    return claimInvite(inviteId, accepterId, now);
  }
  throw new Error('这封邀请正在被处理，请刷新后再试');
}

async function markInviteAccepted(inviteId, accepterId, coupleId, store = db) {
  const result = await store.collection('invites').where({ _id: inviteId, status: 'processing', processingBy: accepterId }).update({
    data: { status: 'accepted', coupleId, acceptedAt: Date.now(), processingBy: '', processingAt: 0 }
  });
  if (!result.stats || result.stats.updated !== 1) throw new Error('邀请状态已变化，请刷新后再试');
}

async function releaseInviteClaim(inviteId, accepterId) {
  await db.collection('invites').where({ _id: inviteId, status: 'processing', processingBy: accepterId }).update({
    data: { status: 'active', processingBy: '', processingAt: 0 }
  }).catch(() => {});
}

async function restoreCoupleInTransaction(coupleId, invite, accepterId, now) {
  await db.runTransaction(async (transaction) => {
    const [coupleRes, creatorRes, accepterRes] = await Promise.all([
      transaction.collection('couples').doc(coupleId).get(),
      transaction.collection('users').doc(invite.creatorUserId).get(),
      transaction.collection('users').doc(accepterId).get()
    ]);
    const couple = coupleRes.data;
    const creator = creatorRes.data;
    const accepter = accepterRes.data;
    if (!canRestoreCouple(couple, invite, accepter, now) || !canRestoreMembers(coupleId, creator, accepter, now)) {
      throw new Error('这段关系已经不能恢复啦');
    }
    await transaction.collection('couples').doc(coupleId).update({
      data: { status: 'active', deleteAt: 0, restoredAt: Date.now(), updatedAt: Date.now() }
    });
    await Promise.all(couple.memberIds.map((memberId) => transaction.collection('users').doc(memberId).update({
      data: { coupleId, pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() }
    })));
    await markInviteAccepted(invite._id, accepterId, coupleId, transaction);
  });
}

async function bindInviteInTransaction(coupleId, invite, accepterId) {
  await db.runTransaction(async (transaction) => {
    const [coupleRes, creatorRes, accepterRes] = await Promise.all([
      transaction.collection('couples').doc(coupleId).get(),
      transaction.collection('users').doc(invite.creatorUserId).get(),
      transaction.collection('users').doc(accepterId).get()
    ]);
    const couple = coupleRes.data;
    const creator = creatorRes.data;
    const accepter = accepterRes.data;
    const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
    if (!couple || couple.status !== 'active' || !creator || creator.coupleId !== coupleId) {
      throw new Error('这段关系已经不能恢复啦');
    }
    if (memberIds.length >= 2 && !memberIds.includes(accepterId)) throw new Error('这个情侣空间已经绑定两个人啦');
    if (accepter.coupleId && accepter.coupleId !== coupleId) {
      const currentRes = await transaction.collection('couples').doc(accepter.coupleId).get();
      if (!canMoveFromCurrentCouple(currentRes.data, accepter)) throw new Error('你已经有情侣空间啦');
    }
    await transaction.collection('couples').doc(coupleId).update({
      data: { memberIds: _.addToSet(accepterId), updatedAt: Date.now() }
    });
    await Promise.all([
      transaction.collection('users').doc(invite.creatorUserId).update({ data: { coupleId, pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() } }),
      transaction.collection('users').doc(accepterId).update({ data: { coupleId, pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() } })
    ]);
    await markInviteAccepted(invite._id, accepterId, coupleId, transaction);
  });
}

async function createCoupleInTransaction(invite, accepterId) {
  return db.runTransaction(async (transaction) => {
    const [creatorRes, accepterRes] = await Promise.all([
      transaction.collection('users').doc(invite.creatorUserId).get(),
      transaction.collection('users').doc(accepterId).get()
    ]);
    const creator = creatorRes.data;
    const accepter = accepterRes.data;
    if (!creator || creator.coupleId) throw new Error('这封邀请已经失效啦');
    if (accepter.coupleId) {
      const currentRes = await transaction.collection('couples').doc(accepter.coupleId).get();
      if (!canMoveFromCurrentCouple(currentRes.data, accepter)) throw new Error('你已经有情侣空间啦');
    }
    const data = {
      memberIds: [invite.creatorUserId, accepterId],
      status: 'active',
      createdBy: invite.creatorUserId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const coupleRes = await transaction.collection('couples').add({ data });
    const coupleId = coupleRes._id;
    await Promise.all([
      transaction.collection('users').doc(invite.creatorUserId).update({ data: { coupleId, pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() } }),
      transaction.collection('users').doc(accepterId).update({ data: { coupleId, pendingCoupleId: '', pendingCoupleDeleteAt: 0, updatedAt: Date.now() } })
    ]);
    await markInviteAccepted(invite._id, accepterId, coupleId, transaction);
    return coupleId;
  });
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
  const accepter = await getCurrentUser(OPENID);
  const inviteRes = await db.collection('invites').where({ inviteCode: event.inviteCode }).limit(1).get();
  if (!inviteRes.data.length) throw new Error('没找到这封邀请');
  const invite = inviteRes.data[0];
  if (invite.status !== 'active') throw new Error('这封邀请已经不能使用啦');
  if (invite.expireAt <= Date.now()) throw new Error('这封邀请已经过期啦');
  if (invite.creatorUserId === accepter._id) throw new Error('不能接受自己创建的邀请');
  if (invite.recipientUserId && invite.recipientUserId !== accepter._id) {
    throw new Error('这张邀请是发给另一半的');
  }

  const now = Date.now();
  await claimInvite(invite._id, accepter._id, now);
  let claimed = true;
  try {
  let coupleId = invite.coupleId;
  const creator = await getUser(invite.creatorUserId);
  const targetCouple = await getCouple(coupleId);
  const currentCouple = accepter.coupleId ? await getCouple(accepter.coupleId) : null;
  if (coupleId && (!targetCouple || !['active', 'pending_delete'].includes(targetCouple.status))) {
    throw new Error('这段关系已经不能恢复啦');
  }
  const targetMemberIds = targetCouple && Array.isArray(targetCouple.memberIds) ? targetCouple.memberIds : [];
  if (targetCouple && targetCouple.status === 'active' && targetMemberIds.length >= 2 && !targetMemberIds.includes(accepter._id)) {
    throw new Error('这个情侣空间已经绑定两个人啦');
  }
  if (canRestoreCouple(targetCouple, invite, accepter, now) &&
      canRestoreMembers(coupleId, creator, accepter, now) &&
      (!accepter.coupleId || accepter.coupleId === coupleId || (currentCouple && canMoveFromCurrentCouple(currentCouple, accepter)))) {
    await restoreCoupleInTransaction(coupleId, invite, accepter._id, now);
    claimed = false;
    await ensureDefaultMenu(coupleId);
    return { coupleId, restored: true };
  }
  if (targetCouple && targetCouple.status === 'pending_delete') {
    await db.collection('invites').where({ _id: invite._id, status: 'processing', processingBy: accepter._id }).update({
      data: { status: 'expired', processingBy: '', processingAt: 0, invalidatedAt: Date.now() }
    });
    claimed = false;
    throw new Error('这段关系已经不能恢复啦');
  }
  if (coupleId && accepter.coupleId === coupleId) {
    await bindInviteInTransaction(coupleId, invite, accepter._id);
    claimed = false;
    await ensureDefaultMenu(coupleId);
    return { coupleId, alreadyJoined: true };
  }
  if (accepter.coupleId) {
    if (currentCouple && !canMoveFromCurrentCouple(currentCouple, accepter)) {
      throw new Error('你已经有情侣空间啦');
    }
  }

  if (!coupleId) {
    try {
      coupleId = await createCoupleInTransaction(invite, accepter._id);
    } catch (error) {
      if (!isCollectionMissing(error)) throw error;
      await ensureCollection('couples');
      coupleId = await createCoupleInTransaction(invite, accepter._id);
    }
  } else {
    await bindInviteInTransaction(coupleId, invite, accepter._id);
  }
  claimed = false;
  await ensureDefaultMenu(coupleId);
  return { coupleId };
  } catch (error) {
    if (claimed) await releaseInviteClaim(invite._id, accepter._id);
    throw error;
  }
};
