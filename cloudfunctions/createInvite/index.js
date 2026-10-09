const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const INVITE_DURATION = 24 * 60 * 60 * 1000;

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

async function resolveInviteCoupleId(user, now) {
  if (user.coupleId) return user.coupleId;
  if (!user.pendingCoupleId || Number(user.pendingCoupleDeleteAt || 0) <= now) return '';
  const couple = await getCouple(user.pendingCoupleId);
  const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
  if (couple && couple.status === 'pending_delete' && Number(couple.deleteAt || 0) > now && memberIds.includes(user._id)) {
    return couple._id;
  }
  return '';
}

async function resolveRecipientUserId(user, coupleId) {
  if (!coupleId) return '';
  const couple = await getCouple(coupleId);
  const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
  return memberIds.find((memberId) => memberId && memberId !== user._id) || '';
}

async function addInvite(invite) {
  try {
    return await db.collection('invites').add({ data: invite });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
    await ensureCollection('invites');
    return db.collection('invites').add({ data: invite });
  }
}

function createCode() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  const now = Date.now();
  const coupleId = await resolveInviteCoupleId(user, now);
  const invite = {
    inviteCode: createCode(),
    creatorUserId: user._id,
    coupleId,
    recipientUserId: await resolveRecipientUserId(user, coupleId),
    status: 'active',
    expireAt: now + INVITE_DURATION,
    createdAt: now
  };
  const res = await addInvite(invite);
  return { invite: { ...invite, _id: res._id, id: res._id } };
};
