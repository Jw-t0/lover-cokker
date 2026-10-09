const { getInviteDetail, createInvite, acceptInvite } = require('../../services/couple-service');
const { getCurrentUser, refreshCurrentUser } = require('../../services/user-service');
const { isSelfInvite } = require('../../utils/domain/invite');

async function resolveCreatorAvatar(creator) {
  if (!creator || !String(creator.avatarUrl || '').startsWith('cloud://')) return creator;

  try {
    const result = await wx.cloud.getTempFileURL({ fileList: [creator.avatarUrl] });
    const file = result.fileList && result.fileList[0];
    return file && file.tempFileURL ? { ...creator, avatarUrl: file.tempFileURL } : creator;
  } catch (error) {
    return creator;
  }
}

Page({
  data: {
    code: '',
    invite: null,
    creator: null,
    user: null,
    selfInvite: false,
    expiredText: '',
    loading: true,
    inviteError: '',
    unavailableReason: '',
    targetCoupleStatus: '',
    canAccept: false,
    accepting: false
  },

  async onLoad(options = {}) {
    if (options.pending === '1') {
      await this.prepareInvite();
      return;
    }

    const code = decodeURIComponent(options.code || options.scene || '');
    this.setData({ code });
    if (!code) {
      this.setData({ loading: false, inviteError: '邀请链接无效或已损坏' });
      return;
    }
    await this.loadInvite(code);
  },

  async prepareInvite() {
    this.setData({ loading: true, inviteError: '', invite: null, creator: null });
    try {
      const result = await createInvite();
      const code = result.invite.inviteCode;
      this.setData({ code });
      await this.loadInvite(code);
    } catch (error) {
      this.setData({ loading: false, inviteError: error.message || '邀请创建失败' });
      wx.showToast({ title: error.message || '邀请创建失败', icon: 'none' });
    }
  },

  async loadInvite(code) {
    try {
      const [detail, user] = await Promise.all([getInviteDetail(code), getCurrentUser()]);
      const invite = detail.invite || null;
      if (!invite) throw new Error('没找到这封邀请');
      const creator = await resolveCreatorAvatar(detail.creator || null);
      const expiredText = invite ? this.formatTime(invite.expireAt) : '';
      const selfInvite = isSelfInvite(user, invite);
      const userId = user && (user.id || user._id);
      const recipientMismatch = !selfInvite && invite.recipientUserId && invite.recipientUserId !== userId;
      const targetCoupleStatus = detail.targetCoupleStatus || '';
      const targetUnavailable = !selfInvite && invite.coupleId && !['active', 'pending_delete'].includes(targetCoupleStatus);
      const expired = invite.status !== 'active' || Number(invite.expireAt) <= Date.now();
      this.setData({
        invite,
        creator,
        user,
        expiredText,
        selfInvite,
        targetCoupleStatus,
        canAccept: !selfInvite && !recipientMismatch && !targetUnavailable && !expired,
        unavailableReason: targetUnavailable
          ? '这段关系已经不能恢复啦'
          : (recipientMismatch
            ? '这张邀请是发给另一半的，请让邀请人转给指定的 TA。'
            : (expired ? (invite.status === 'active' ? '这张邀请已经过期啦' : '这张邀请已经不能使用啦') : '')),
        inviteError: ''
      });
    } catch (error) {
      this.setData({ inviteError: error.message || '邀请加载失败', canAccept: false });
      wx.showToast({ title: error.message || '邀请加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async retryLoad() {
    if (this.data.code) {
      await this.loadInvite(this.data.code);
      return;
    }
    await this.prepareInvite();
  },

  formatTime(value) {
    const date = new Date(value);
    const pad = (num) => String(num).padStart(2, '0');
    return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  async accept() {
    if (!this.data.canAccept || this.data.accepting) {
      wx.showToast({ title: this.data.selfInvite ? '不能接受自己创建的邀请' : (this.data.unavailableReason || '邀请暂时不能接受'), icon: 'none' });
      return;
    }
    this.setData({ accepting: true });
    try {
      await acceptInvite(this.data.code);
      await refreshCurrentUser();
      wx.showToast({ title: '情侣小饭桌开启啦', icon: 'none' });
      wx.redirectTo({ url: '/pages/mine/mine' });
    } catch (error) {
      wx.showToast({ title: error.message || '暂时不能接受邀请', icon: 'none' });
    } finally {
      this.setData({ accepting: false });
    }
  },

  recreateInvite() {
    this.prepareInvite();
  },

  later() {
    wx.navigateBack();
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  onShareAppMessage() {
    const nickname = this.data.user && this.data.user.nickname;
    const name = nickname && nickname !== '还没有昵称' ? nickname : '你的另一半';
    return {
      title: `${name}邀请你加入情侣小饭桌`,
      path: `/pages/invite/invite?code=${this.data.code}`
    };
  }
});
