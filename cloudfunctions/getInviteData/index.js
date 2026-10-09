const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function isCollectionMissing(error) {
  const message = String((error && (error.message || error.errMsg)) || error || '');
  return message.includes('-502005') || message.includes('collection not exists') || message.includes('Db or Table not exist');
}

async function getInvite(inviteCode) {
  if (!inviteCode) return null;
  try {
    const res = await db.collection('invites').where({ inviteCode }).limit(1).get();
    return res.data[0] || null;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

async function getUser(userId) {
  if (!userId) return null;
  try {
    const res = await db.collection('users').doc(userId).get();
    return res.data;
  } catch (error) {
    if (isCollectionMissing(error)) return null;
    throw error;
  }
}

function publicUser(user) {
  if (!user) return null;
  return {
    nickname: user.nickname || '还没有昵称',
    avatarUrl: user.avatarUrl || ''
  };
}

function publicInvite(invite) {
  if (!invite) return null;
  return {
    inviteCode: invite.inviteCode,
    creatorUserId: invite.creatorUserId,
    recipientUserId: invite.recipientUserId || '',
    coupleId: invite.coupleId || '',
    status: invite.status,
    expireAt: invite.expireAt
  };
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

exports.main = async (event = {}) => {
  const invite = await getInvite(event.inviteCode);
  const creator = invite ? await getUser(invite.creatorUserId) : null;
  const targetCouple = invite && invite.coupleId ? await getCouple(invite.coupleId) : null;
  return {
    invite: publicInvite(invite),
    creator: publicUser(creator),
    targetCoupleStatus: invite && invite.coupleId ? (targetCouple ? targetCouple.status : 'missing') : ''
  };
};
