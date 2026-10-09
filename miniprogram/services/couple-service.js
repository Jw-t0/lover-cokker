const { call, db, isCollectionMissingError } = require('./cloud');

async function createInvite() {
  return call('createInvite');
}

async function acceptInvite(inviteCode) {
  return call('acceptInvite', { inviteCode });
}

async function getInvite(inviteCode) {
  const result = await call('getInviteData', { inviteCode });
  return result.invite || null;
}

async function getInviteDetail(inviteCode) {
  return call('getInviteData', { inviteCode });
}

async function getCoupleDetail() {
  return call('getCoupleData', {});
}

async function dissolveCouple() {
  return call('dissolveCouple', {});
}

async function getCouple(coupleId) {
  if (!coupleId) return null;
  try {
    const res = await db().collection('couples').doc(coupleId).get();
    return res.data;
  } catch (error) {
    if (isCollectionMissingError(error)) return null;
    throw error;
  }
}

module.exports = {
  createInvite,
  acceptInvite,
  getInvite,
  getInviteDetail,
  getCoupleDetail,
  dissolveCouple,
  getCouple
};
