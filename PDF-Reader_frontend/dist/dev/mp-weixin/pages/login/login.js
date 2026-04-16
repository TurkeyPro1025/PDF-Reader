"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      form: {
        username: "",
        password: ""
      }
    };
  },
  methods: {
    async login() {
      try {
        const response = await common_vendor.axios.post("/api/auth/login", this.form);
        const { user, token } = response.data;
        this.$store.dispatch("login", { user, token });
        common_vendor.index.switchTab({ url: "/pages/profile/profile" });
      } catch (error) {
        common_vendor.index.showToast({ title: "登录失败", icon: "none" });
      }
    },
    async register() {
      try {
        const response = await common_vendor.axios.post("/api/auth/register", this.form);
        common_vendor.index.showToast({ title: "注册成功", icon: "success" });
      } catch (error) {
        common_vendor.index.showToast({ title: "注册失败", icon: "none" });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.form.username,
    b: common_vendor.o(($event) => $data.form.username = $event.detail.value, "9d"),
    c: $data.form.password,
    d: common_vendor.o(($event) => $data.form.password = $event.detail.value, "f8"),
    e: common_vendor.o((...args) => $options.login && $options.login(...args), "c9"),
    f: common_vendor.o((...args) => $options.register && $options.register(...args), "b5")
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-cdfe2409"]]);
wx.createPage(MiniProgramPage);
