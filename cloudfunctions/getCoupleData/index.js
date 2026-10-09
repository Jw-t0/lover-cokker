const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

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

function publicUser(user, activeCouple) {
  if (!user) return null;
  return {
    _id: user._id,
    id: user._id,
    uid: user.uid || '',
    coupleId: activeCouple ? activeCouple._id : '',
    nickname: user.nickname || '还没有昵称',
    avatarUrl: user.avatarUrl || ''
  };
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const currentCouple = await getCouple(user.coupleId);
  const currentMemberIds = currentCouple && Array.isArray(currentCouple.memberIds) ? currentCouple.memberIds : [];
  const couple = currentCouple && currentCouple.status === 'active' && currentMemberIds.includes(user._id)
    ? currentCouple
    : null;
  const pendingId = user.pendingCoupleId || (currentCouple && currentCouple.status === 'pending_delete' ? currentCouple._id : '');
  const pendingCandidate = pendingId && (!couple || pendingId !== couple._id) ? await getCouple(pendingId) : null;
  const pendingDeleteAt = Number(user.pendingCoupleDeleteAt || (pendingCandidate && pendingCandidate.deleteAt) || 0);
  const pendingMemberIds = pendingCandidate && Array.isArray(pendingCandidate.memberIds) ? pendingCandidate.memberIds : [];
  const pendingCouple = pendingCandidate && pendingCandidate.status === 'pending_delete' && pendingDeleteAt > Date.now() && pendingMemberIds.includes(user._id)
    ? pendingCandidate
    : null;
  const relation = couple || pendingCouple;
  const memberIds = relation && Array.isArray(relation.memberIds) ? relation.memberIds : [];
  const partnerId = memberIds.find((id) => id && id !== user._id);
  const partner = await getUser(partnerId);

  return {
    user: publicUser(user, couple),
    couple,
    partner: publicUser(partner),
    pendingCouple,
    pendingDeleteAt: pendingCouple ? pendingDeleteAt : 0
  };
};
