const { getCurrentUser, saveProfile } = require('../../services/user-service');
const { isProfileComplete } = require('../../utils/domain/profile');

function isTemporaryAvatar(url) {
  return /^(wxfile|file|https?:\/\/tmp)/i.test(String(url || ''));
}

async function uploadAvatarIfNeeded(url) {
  if (!url || !isTemporaryAvatar(url)) return url || '';
  const suffix = String(url).toLowerCase().includes('.png') ? 'png' : 'jpg';
  const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${suffix}`;
  const result = await wx.cloud.uploadFile({ cloudPath, filePath: url });
  return result.fileID;
}

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    count: 0,
    fromInvite: false,
    loading: true,
    error: '',
    saving: false
  },

  async onLoad(options = {}) {
    this.setData({ fromInvite: options.fromInvite === '1' });
    await this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true, error: '' });
    try {
      const user = await getCurrentUser();
      this.setData({
        avatarUrl: user.avatarUrl || '',
        nickname: user.nickname || '',
        count: (user.nickname || '').length,
        loading: false,
        error: ''
      });
    } catch (error) {
      this.setData({ loading: false, error: error.message || '资料加载失败' });
      wx.showToast({ title: '资料加载失败', icon: 'none' });
    }
  },

  retry() {
    this.loadProfile();
  },

  onNicknameInput(event) {
    const nickname = event.detail.value.slice(0, 12);
    this.setData({ nickname, count: nickname.length });
  },

  chooseAvatar(event) {
    this.setData({ avatarUrl: event.detail.avatarUrl });
  },

  async save() {
    if (this.data.saving || this.data.loading || this.data.error) return;
    if (!this.data.nickname.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    if (this.data.fromInvite && !isProfileComplete({ nickname: this.data.nickname, avatarUrl: this.data.avatarUrl })) {
      wx.showToast({ title: '请设置头像和昵称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    let avatarUrl;
    try {
      avatarUrl = await uploadAvatarIfNeeded(this.data.avatarUrl);
      await saveProfile({
        nickname: this.data.nickname.trim(),
        avatarUrl
      });
    } catch (error) {
      wx.showToast({ title: error.message || '资料保存失败', icon: 'none' });
      this.setData({ saving: false });
      return;
    }

    this.setData({ saving: false });

    if (this.data.fromInvite) {
      wx.redirectTo({ url: '/pages/invite/invite?pending=1' });
      return;
    }

    wx.showToast({ title: '资料保存好啦', icon: 'none' });
    wx.navigateBack();
  }
});
