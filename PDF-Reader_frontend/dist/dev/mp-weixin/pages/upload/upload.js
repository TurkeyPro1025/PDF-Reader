"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      file: null,
      uploading: false,
      progress: 0,
      pdfList: [],
      currentUploadTask: null
    };
  },
  onLoad() {
    this.getPDFList();
  },
  methods: {
    selectFile() {
      common_vendor.index.chooseFile({
        count: 1,
        type: "file",
        extension: [".pdf"],
        success: (res) => {
          const file = res.tempFiles[0];
          if (file.size > 100 * 1024 * 1024) {
            common_vendor.index.showToast({ title: "文件大小不能超过100MB", icon: "none" });
            return;
          }
          this.file = file;
        }
      });
    },
    async uploadFile() {
      if (!this.file)
        return;
      this.uploading = true;
      this.progress = 0;
      try {
        const uploadRes = await new Promise((resolve, reject) => {
          const uploadTask = common_vendor.index.uploadFile({
            url: "/api/pdf/upload",
            filePath: this.file.path || this.file.tempFilePath,
            name: "pdf",
            headers: {
              "Authorization": `Bearer ${this.$store.state.token}`
            },
            success: (res) => resolve(res),
            fail: (err) => reject(err)
          });
          this.currentUploadTask = uploadTask;
          uploadTask.onProgressUpdate((res) => {
            this.progress = res.progress;
          });
        });
        if (uploadRes.statusCode >= 200 && uploadRes.statusCode < 300) {
          common_vendor.index.showToast({ title: "上传成功", icon: "success" });
          this.file = null;
          this.getPDFList();
        } else {
          common_vendor.index.showToast({ title: "上传失败", icon: "none" });
        }
      } catch (error) {
        common_vendor.index.showToast({ title: "上传失败", icon: "none" });
      } finally {
        this.currentUploadTask = null;
        this.uploading = false;
        this.progress = 0;
      }
    },
    cancelUpload() {
      if (this.currentUploadTask) {
        this.currentUploadTask.abort();
      }
      this.uploading = false;
      this.progress = 0;
      this.currentUploadTask = null;
    },
    async getPDFList() {
      try {
        const response = await common_vendor.axios.get("/api/pdf/list", {
          headers: {
            "Authorization": `Bearer ${this.$store.state.token}`
          }
        });
        this.pdfList = response.data.pdfs;
      } catch (error) {
        console.error("获取PDF列表失败:", error);
      }
    },
    openPDF(pdf) {
      common_vendor.index.navigateTo({
        url: `/pages/reader/reader?id=${pdf._id}&name=${pdf.originalname}`
      });
    },
    formatFileSize(size) {
      if (size < 1024) {
        return size + " B";
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + " KB";
      } else {
        return (size / (1024 * 1024)).toFixed(2) + " MB";
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.selectFile && $options.selectFile(...args), "b8"),
    b: $data.file
  }, $data.file ? {
    c: common_vendor.t($data.file.name),
    d: common_vendor.t($options.formatFileSize($data.file.size))
  } : {}, {
    e: $data.uploading
  }, $data.uploading ? {
    f: $data.progress,
    g: common_vendor.t($data.progress)
  } : {}, {
    h: $data.file && !$data.uploading
  }, $data.file && !$data.uploading ? {
    i: common_vendor.o((...args) => $options.uploadFile && $options.uploadFile(...args), "42")
  } : {}, {
    j: $data.uploading
  }, $data.uploading ? {
    k: common_vendor.o((...args) => $options.cancelUpload && $options.cancelUpload(...args), "ba")
  } : {}, {
    l: common_vendor.f($data.pdfList, (pdf, k0, i0) => {
      return {
        a: common_vendor.t(pdf.originalname),
        b: common_vendor.o(($event) => $options.openPDF(pdf), pdf._id),
        c: pdf._id
      };
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-0ba35d33"]]);
wx.createPage(MiniProgramPage);
