Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    chooseProfile() {
      this.triggerEvent('complete');
    },

    chooseDirect() {
      this.triggerEvent('direct');
    },

    close() {
      this.triggerEvent('close');
    },

    stopTap() {}
  }
});
