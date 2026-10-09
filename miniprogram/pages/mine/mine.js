const { getCurrentUser } = require('../../services/user-service');
const { getCoupleDetail } = require('../../services/couple-service');
const { isProfileComplete } = require('../../utils/domain/profile');

Page({
  data: {
    user: null,
    relationState: 'none',
    profileChoiceVisible: false,
    loading: true,
    error: '',
    features: [
      { icon: '♡', text: '情侣关系', url: '/pages/couple/couple' },
      { icon: '👤', text: '我的资料', url: '/pages/profile/profile' },
      { icon: '🧾', text: '我的订单', url: '/pages/my-order/my-order' },
      { icon: '🍳', text: '厨师工作台', url: '/pages/chef/chef' },
      { icon: '📋', text: '菜单管理', url: '/pages/menu-manage/menu-manage' },
      { icon: '📈', text: '月度汇报', url: '/pages/monthly-report/monthly-report' }
    ]
  },

  async onShow() {
    this.setData({ loading: true, error: '', relationState: 'none' });
    try {
      const user = await getCurrentUser();
      let relationState = user.coupleId ? 'solo' : 'none';
      try {
        const detail = await getCoupleDetail();
        if (detail.couple && detail.partner) relationState = 'active';
        else if (detail.pendingCouple) relationState = 'pending_delete';
        else if (detail.couple) relationState = 'solo';
        else relationState = 'none';
      } catch (error) {
        relationState = 'unknown';
      }
      this.setData({ user, relationState, loading: false, error: '' });
    } catch (error) {
      this.setData({ loading: false, error: error.message || '资料加载失败' });
      wx.showToast({ title: '资料加载失败', icon: 'none' });
    }
  },

  retry() {
    this.onShow();
  },

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goFeature(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      const chefUrls = [
        '/pages/chef/chef',
        '/pages/menu-manage/menu-manage',
        '/pages/recipes/recipes',
        '/pages/monthly-report/monthly-report'
      ];
      if (chefUrls.includes(url)) wx.setStorageSync('activeRole', 'chef');
      if (url === '/pages/my-order/my-order') wx.setStorageSync('activeRole', 'guest');
      wx.navigateTo({ url });
      return;
    }
    wx.showToast({ title: '这个入口还在准备中', icon: 'none' });
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
  }
});
