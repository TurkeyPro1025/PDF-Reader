"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  computed: {
    isLoggedIn() {
      return this.$store.getters.isLoggedIn;
    },
    currentUser() {
      return this.$store.getters.currentUser;
    }
  },
  methods: {
    goToLogin() {
      common_vendor.index.navigateTo({ url: "/pages/login/login" });
    },
    goToUpload() {
      common_vendor.index.navigateTo({ url: "/pages/upload/upload" });
    },
    logout() {
      this.$store.dispatch("logout");
      common_vendor.index.switchTab({ url: "/pages/login/login" });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$options.isLoggedIn
  }, !$options.isLoggedIn ? {
    b: common_vendor.o((...args) => $options.goToLogin && $options.goToLogin(...args), "65")
  } : {
    c: common_vendor.t($options.currentUser.username.charAt(0).toUpperCase()),
    d: common_vendor.t($options.currentUser.username),
    e: common_vendor.t($options.currentUser.email),
    f: common_vendor.o((...args) => $options.goToUpload && $options.goToUpload(...args), "1c"),
    g: common_vendor.o((...args) => $options.logout && $options.logout(...args), "a6")
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-04d37cba"]]);
wx.createPage(MiniProgramPage);
