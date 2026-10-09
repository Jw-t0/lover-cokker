const ROLE_TABS = {
  guest: [
    { text: '餐桌', icon: '⌂', url: '/pages/home/home' },
    { text: '点菜', icon: '🍽️', url: '/pages/order/order' },
    { text: '订单', icon: '🧾', url: '/pages/my-order/my-order' },
    { text: '我的', icon: '☺', url: '/pages/mine/mine' }
  ],
  chef: [
    { text: '餐桌', icon: '⌂', url: '/pages/home/home' },
    { text: '厨房', icon: '🍳', url: '/pages/chef/chef' },
    { text: '订单', icon: '🧾', url: '/pages/history/history' },
    { text: '我的', icon: '☺', url: '/pages/mine/mine' }
  ]
};

Component({
  properties: {
    current: {
      type: String,
      value: ''
    }
  },

  data: {
    role: 'guest',
    tabs: ROLE_TABS.guest
  },

  lifetimes: {
    attached() {
      this.refreshTabs();
    }
  },

  pageLifetimes: {
    show() {
      this.refreshTabs();
    }
  },

  methods: {
    refreshTabs() {
      const role = wx.getStorageSync('activeRole') === 'chef' ? 'chef' : 'guest';
      this.setData({ role, tabs: ROLE_TABS[role] });
    },

    goTab(event) {
      const url = event.currentTarget.dataset.url;
      if (!url || url === this.properties.current) return;
      wx.redirectTo({ url });
    }
  }
});
