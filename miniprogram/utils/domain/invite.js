const { INVITE_STATUS } = require('../constants');

function validateInviteAcceptance({ invite, accepter, targetCouple, now }) {
  if (!invite) return { ok: false, reason: 'INVITE_NOT_FOUND' };
  if (!accepter) return { ok: false, reason: 'USER_NOT_FOUND' };
  if (invite.status !== INVITE_STATUS.ACTIVE) return { ok: false, reason: 'INVITE_INACTIVE' };
  if (Number(invite.expireAt) <= Number(now)) return { ok: false, reason: 'INVITE_EXPIRED' };
  if (isSelfInvite(accepter, invite)) return { ok: false, reason: 'SELF_INVITE' };
  if (accepter.coupleId) return { ok: false, reason: 'ALREADY_BOUND' };
  const memberIds = targetCouple && targetCouple.memberIds;
  if (Array.isArray(memberIds) && memberIds.length >= 2 && !memberIds.includes(accepter.id || accepter._id)) {
    return { ok: false, reason: 'COUPLE_FULL' };
  }
  return { ok: true };
}

function isSelfInvite(user, invite) {
  return !!(user && invite && user.id && invite.creatorUserId === user.id);
}

function inviteErrorMessage(reason) {
  const messages = {
    INVITE_NOT_FOUND: '没找到这封邀请',
    USER_NOT_FOUND: '先登录一下，才能接受邀请',
    INVITE_INACTIVE: '这封邀请已经不能使用啦',
    INVITE_EXPIRED: '这封邀请已经过期啦',
    SELF_INVITE: '不能接受自己创建的邀请',
    ALREADY_BOUND: '你已经有情侣空间啦',
    COUPLE_FULL: '这个情侣空间已经绑定两个人啦'
  };
  return messages[reason] || '邀请暂时不能接受';
}

module.exports = {
  isSelfInvite,
  validateInviteAcceptance,
  inviteErrorMessage
};
