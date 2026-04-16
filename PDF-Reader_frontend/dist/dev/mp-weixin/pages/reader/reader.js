"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      pdfId: "",
      pdfName: "",
      pdfDoc: null,
      pages: [],
      currentPage: 1,
      totalPages: 0,
      showMenu: false,
      // 字体设置
      fonts: ["默认", "宋体", "黑体"],
      currentFont: "默认",
      fontSize: 16,
      // 背景设置
      backgroundColors: [
        { name: "默认", value: "#ffffff" },
        { name: "护眼", value: "#e6e6fa" },
        { name: "夜间", value: "#1a1a1a" },
        { name: " sepia", value: "#f5f5dc" }
      ],
      currentBackground: 0,
      // 书签
      bookmarks: [],
      // 朗读功能
      isPlaying: false,
      speechRate: 1,
      speechVolume: 1,
      speechInstance: null
    };
  },
  computed: {
    backgroundColor() {
      return this.backgroundColors[this.currentBackground].value;
    },
    menuBackgroundColor() {
      return this.currentBackground === 2 ? "#2a2a2a" : "#ffffff";
    }
  },
  onLoad(options) {
    this.pdfId = options.id;
    this.pdfName = options.name;
    this.loadPDF();
  },
  methods: {
    async loadPDF() {
      common_vendor.index.showToast({ title: "小程序端暂不支持PDF渲染，请使用H5访问", icon: "none" });
      return;
    },
    async renderPage(pageNum) {
      try {
        return;
        const page = await this.pdfDoc.getPage(pageNum);
        const canvas = document.getElementById(`page-${pageNum}`);
        if (!canvas)
          return;
        const ctx = canvas.getContext("2d");
        const viewport = page.getViewport({ scale: 1.5 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderContext = {
          canvasContext: ctx,
          viewport
        };
        await page.render(renderContext).promise;
        const progress = pageNum / this.totalPages;
        this.$store.dispatch("saveReadingProgress", { pdfId: this.pdfId, progress });
      } catch (error) {
        console.error("渲染页面失败:", error);
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderPage(this.currentPage);
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.renderPage(this.currentPage);
      }
    },
    goToPage(pageNum) {
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        this.currentPage = pageNum;
        this.renderPage(this.currentPage);
        this.showMenu = false;
      }
    },
    setFont(font) {
      this.currentFont = font;
    },
    increaseFontSize() {
      if (this.fontSize < 24) {
        this.fontSize++;
      }
    },
    decreaseFontSize() {
      if (this.fontSize > 12) {
        this.fontSize--;
      }
    },
    setBackground(index) {
      this.currentBackground = index;
    },
    addBookmark() {
      const bookmark = {
        id: Date.now(),
        page: this.currentPage,
        pdfId: this.pdfId
      };
      this.bookmarks.push(bookmark);
      this.$store.commit("addBookmark", bookmark);
      common_vendor.index.showToast({ title: "书签添加成功", icon: "success" });
    },
    goBack() {
      common_vendor.index.navigateBack();
    },
    // 朗读功能
    async toggleTTS() {
      common_vendor.index.showToast({ title: "小程序端暂不支持语音朗读", icon: "none" });
      return;
    },
    stopTTS() {
      this.isPlaying = false;
      return;
    },
    setSpeechRate(e) {
      this.speechRate = e.detail.value;
      if (this.speechInstance) {
        this.speechInstance.rate = this.speechRate;
      }
    },
    setSpeechVolume(e) {
      this.speechVolume = e.detail.value;
      if (this.speechInstance) {
        this.speechInstance.volume = this.speechVolume;
      }
    },
    async getPageText(pageNum) {
      try {
        const page = await this.pdfDoc.getPage(pageNum);
        const content = await page.getTextContent();
        const text = content.items.map((item) => item.str).join(" ");
        return text;
      } catch (error) {
        console.error("获取页面文本失败:", error);
        return "";
      }
    },
    speakText(text) {
      common_vendor.index.showToast({ title: "当前设备不支持语音朗读", icon: "none" });
      return;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args), "7d"),
    b: common_vendor.t($data.pdfName),
    c: common_vendor.o(($event) => $data.showMenu = !$data.showMenu, "a1"),
    d: common_vendor.f($data.pages, (page, k0, i0) => {
      return {
        a: "page-" + page,
        b: page
      };
    }),
    e: $data.showMenu
  }, $data.showMenu ? common_vendor.e({
    f: common_vendor.f($data.fonts, (font, k0, i0) => {
      return {
        a: common_vendor.t(font),
        b: font,
        c: common_vendor.o(($event) => $options.setFont(font), font),
        d: $data.currentFont === font ? 1 : ""
      };
    }),
    g: common_vendor.o((...args) => $options.decreaseFontSize && $options.decreaseFontSize(...args), "4a"),
    h: common_vendor.t($data.fontSize),
    i: common_vendor.o((...args) => $options.increaseFontSize && $options.increaseFontSize(...args), "8d"),
    j: common_vendor.f($data.backgroundColors, (color, index, i0) => {
      return {
        a: index,
        b: common_vendor.o(($event) => $options.setBackground(index), index),
        c: $data.currentBackground === index ? 1 : "",
        d: color.value
      };
    }),
    k: common_vendor.o((...args) => $options.addBookmark && $options.addBookmark(...args), "34"),
    l: $data.bookmarks.length > 0
  }, $data.bookmarks.length > 0 ? {
    m: common_vendor.f($data.bookmarks, (bookmark, k0, i0) => {
      return {
        a: common_vendor.t(bookmark.page),
        b: common_vendor.o(($event) => $options.goToPage(bookmark.page), bookmark.id),
        c: bookmark.id
      };
    })
  } : {}, {
    n: common_vendor.t($data.isPlaying ? "暂停" : "开始朗读"),
    o: common_vendor.o((...args) => $options.toggleTTS && $options.toggleTTS(...args), "15"),
    p: common_vendor.o((...args) => $options.stopTTS && $options.stopTTS(...args), "70"),
    q: common_vendor.t($data.speechRate.toFixed(1)),
    r: common_vendor.o((...args) => $options.setSpeechRate && $options.setSpeechRate(...args), "69"),
    s: $data.speechRate,
    t: common_vendor.t($data.speechVolume.toFixed(1)),
    v: common_vendor.o((...args) => $options.setSpeechVolume && $options.setSpeechVolume(...args), "9f"),
    w: $data.speechVolume,
    x: common_vendor.o(($event) => $data.showMenu = false, "9b"),
    y: $options.menuBackgroundColor
  }) : {}, {
    z: common_vendor.o((...args) => $options.prevPage && $options.prevPage(...args), "5d"),
    A: common_vendor.t($data.currentPage),
    B: common_vendor.t($data.totalPages),
    C: common_vendor.o((...args) => $options.nextPage && $options.nextPage(...args), "e3"),
    D: $options.backgroundColor
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-8a2796c0"]]);
wx.createPage(MiniProgramPage);
