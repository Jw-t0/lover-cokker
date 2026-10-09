const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

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
  const res = await db.collection('couples').doc(coupleId).get();
  return res.data || null;
}

async function invalidateActiveInvites(coupleId, now) {
  try {
    await db.collection('invites').where({ coupleId, status: 'active' }).update({
      data: { status: 'expired', invalidatedAt: now, updatedAt: now }
    });
  } catch (error) {
    if (!isCollectionMissing(error)) throw error;
  }
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const user = await getCurrentUser(OPENID);
  if (!user.coupleId) throw new Error('当前没有可解除的情侣关系');

  const couple = await getCouple(user.coupleId);
  const memberIds = couple && Array.isArray(couple.memberIds) ? couple.memberIds : [];
  if (!couple || couple.status !== 'active' || !memberIds.includes(user._id) || memberIds.length !== 2) {
    throw new Error('当前没有完整的情侣关系');
  }

  const now = Date.now();
  const deleteAt = now + RETENTION_MS;
  await Promise.all([
    db.collection('couples').doc(couple._id).update({
      data: {
        status: 'pending_delete',
        deleteAt,
        dissolvedAt: now,
        dissolvedBy: user._id,
        updatedAt: now
      }
    }),
    ...memberIds.map((memberId) => db.collection('users').doc(memberId).update({
      data: { coupleId: '', pendingCoupleId: couple._id, pendingCoupleDeleteAt: deleteAt, updatedAt: now }
    })),
    invalidateActiveInvites(couple._id, now)
  ]);

  return { ok: true, coupleId: couple._id, deleteAt };
};
