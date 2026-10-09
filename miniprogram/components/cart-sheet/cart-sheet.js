const { summarizeCart } = require('../../utils/domain/cart');

Component({
  properties: {
    visible: { type: Boolean, value: false },
    cart: { type: Array, value: [] }
  },
  observers: {
    'cart.**': function (cart) {
      this.setData({ summary: summarizeCart(cart) });
    }
  },
  data: {
    summary: { count: 0, totalPrice: 0 }
  },
  methods: {
    close() {
      this.triggerEvent('close');
    },
    decrease(event) {
      this.triggerEvent('decrease', { dishId: event.currentTarget.dataset.id });
    },
    increase(event) {
      this.triggerEvent('increase', { dishId: event.currentTarget.dataset.id });
    },
    clear() {
      this.triggerEvent('clear');
    },
    submit() {
      if (this.data.summary.count === 0) return;
      this.triggerEvent('submit');
    }
  }
});
