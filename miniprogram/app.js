const { getCurrentUser } = require('./services/user-service');

App({
  globalData: {
    user: null,
    envId: 'your-cloud-env-id',
    userReady: null
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      });
    }

    this.globalData.userReady = getCurrentUser({ app: this }).catch((error) => {
      console.warn('用户信息预加载失败', error);
      return null;
    });
  }
});
