Component({
  properties: {
    value: { type: Number, value: 5 }
  },
  data: {
    stars: [1, 2, 3, 4, 5]
  },
  methods: {
    choose(event) {
      const value = Number(event.currentTarget.dataset.value);
      this.triggerEvent('change', { value });
    }
  }
});
