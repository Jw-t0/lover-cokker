function formatOrderDate(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

Component({
  data: {
    createdAtText: ''
  },
  properties: {
    order: { type: Object, value: null },
    title: { type: String, value: '我点了这些菜' }
  },
  observers: {
    order(order) {
      this.setData({ createdAtText: formatOrderDate(order && (order.createdAt || order.updatedAt)) });
    }
  },
  methods: {
    statusText(status) {
      const map = {
        pending: '待接单',
        accepted: '制作中',
        completed: '已完成',
        reviewed: '已评价',
        cancelled: '已取消'
      };
      return map[status] || '未知';
    }
  }
});
