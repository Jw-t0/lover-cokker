Component({
  properties: {
    dish: { type: Object, value: {} },
    quantity: { type: Number, value: 0 },
    manage: { type: Boolean, value: false }
  },
  methods: {
    onDetail() {
      this.triggerEvent('detail', { dish: this.properties.dish });
    },
    onAdd() {
      this.triggerEvent('add', { dish: this.properties.dish });
    },
    onDecrease() {
      this.triggerEvent('decrease', { dish: this.properties.dish });
    },
    onEdit() {
      this.triggerEvent('edit', { dish: this.properties.dish });
    },
    onToggle() {
      this.triggerEvent('toggle', { dish: this.properties.dish });
    },
    onDelete() {
      this.triggerEvent('delete', { dish: this.properties.dish });
    }
  }
});
