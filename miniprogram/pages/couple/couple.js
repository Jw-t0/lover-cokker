const { getCoupleDetail, dissolveCouple } = require('../../services/couple-service');
const { refreshCurrentUser } = require('../../services/user-service');
const { isProfileComplete } = require('../../utils/domain/profile');

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

Page({
  data: {
    user: null,
    couple: null,
    partner: null,
    pendingCouple: null,
    pendingDeleteAtText: '',
    profileChoiceVisible: false,
    loading: true,
    error: ''
  },

  async onShow() {
    await this.loadCouple();
  },

  async loadCouple() {
    this.setData({ loading: true });
    try {
      const detail = await getCoupleDetail();
      this.setData({
        user: detail.user || null,
        couple: detail.couple || null,
        partner: detail.partner || null,
        pendingCouple: detail.pendingCouple || null,
        pendingDeleteAtText: formatDate(detail.pendingDeleteAt),
        error: ''
      });
    } catch (error) {
      this.setData({ error: error.message || '情侣关系加载失败' });
      wx.showToast({ title: error.message || '情侣关系加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  retry() {
    this.loadCouple();
  },

  async createInvite() {
    if (!isProfileComplete(this.data.user)) {
      this.setData({ profileChoiceVisible: true });
      return;
    }
    this.createInviteCard();
  },

  chooseProfileForInvite() {
    this.setData({ profileChoiceVisible: false });
    wx.navigateTo({ url: '/pages/profile/profile?fromInvite=1' });
  },

  sendInviteDirectly() {
    this.setData({ profileChoiceVisible: false });
    this.createInviteCard();
  },

  closeProfileChoice() {
    this.setData({ profileChoiceVisible: false });
  },

  async createInviteCard() {
    wx.navigateTo({ url: '/pages/invite/invite?pending=1' });
  },

  async dissolveRelationship() {
    const confirmed = await new Promise((resolve) => {
      wx.showModal({
        title: '解除情侣关系',
        content: '解除后，订单记录会保留 30 天。30 天内恢复关系，订单不会被删除。确定要解除吗？',
        success: (res) => resolve(res.confirm)
      });
    });
    if (!confirmed) return;

    try {
      await dissolveCouple();
      await refreshCurrentUser();
      wx.showToast({ title: '已解除关系，订单保留 30 天', icon: 'none' });
      await this.loadCouple();
    } catch (error) {
      wx.showToast({ title: error.message || '解除关系失败', icon: 'none' });
    }
  }
});
