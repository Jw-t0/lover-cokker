const { getMonthlyReport, pushMonthlyReport } = require('../../services/order-service');
const { MONTHLY_REPORT_TEMPLATE_ID } = require('../../utils/constants');

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function canRequestSubscribeMessage() {
  return typeof wx !== 'undefined' && typeof wx.requestSubscribeMessage === 'function';
}

Page({
  data: {
    month: currentMonth(),
    report: null,
    loading: true,
    pushing: false,
    error: '',
    monthlyNotifyReady: Boolean(MONTHLY_REPORT_TEMPLATE_ID && canRequestSubscribeMessage())
  },

  async onLoad() {
    await this.loadReport();
  },

  async loadReport() {
    const reportRequestId = (this.reportRequestId || 0) + 1;
    this.reportRequestId = reportRequestId;
    const month = this.data.month;
    this.setData({ loading: true, error: '' });
    try {
      const report = await getMonthlyReport(month);
      if (reportRequestId !== this.reportRequestId) return;
      this.setData({ report, error: '' });
    } catch (error) {
      if (reportRequestId !== this.reportRequestId) return;
      this.setData({ report: null, error: error.message || '月报加载失败' });
      wx.showToast({ title: error.message || '月报加载失败', icon: 'none' });
    } finally {
      if (reportRequestId === this.reportRequestId) this.setData({ loading: false });
    }
  },

  onMonthChange(event) {
    const month = event.detail.value;
    this.setData({ month });
    this.loadReport();
  },

  goHome() {
    wx.reLaunch({ url: '/pages/home/home' });
  },

  async pushReport() {
    if (this.data.pushing) return;
    const month = this.data.month;
    this.setData({ pushing: true });
    try {
      if (!this.data.monthlyNotifyReady) {
        const report = await getMonthlyReport(month);
        if (this.data.month === month) this.setData({ report });
        wx.showToast({ title: '月报已刷新，推送功能尚未配置', icon: 'none' });
        return;
      }

      const accepted = await new Promise((resolve) => {
        wx.requestSubscribeMessage({
          tmplIds: [MONTHLY_REPORT_TEMPLATE_ID],
          success: (result) => resolve(result[MONTHLY_REPORT_TEMPLATE_ID] === 'accept'),
          fail: () => resolve(false)
        });
      });
      if (!accepted) {
        const report = await getMonthlyReport(month);
        if (this.data.month === month) this.setData({ report });
        wx.showToast({ title: '月报已生成，但没有开启推送', icon: 'none' });
        return;
      }

      const result = await pushMonthlyReport(month);
      if (this.data.month === month) this.setData({ report: result.report });
      wx.showToast({ title: result.pushed ? '月报已推送' : '月报已生成', icon: 'none' });
    } catch (error) {
      wx.showToast({ title: error.message || '月报生成失败', icon: 'none' });
    } finally {
      this.setData({ pushing: false });
    }
  }
});
