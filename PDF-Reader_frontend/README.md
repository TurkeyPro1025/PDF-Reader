# PDF-Reader Frontend

## 环境要求

- Node.js: 18 LTS（推荐 18.17+）
- npm: 9.x

## 安装与构建

```bash
npm install
npm run build:mp-weixin
```

开发模式：

```bash
npm run dev:mp-weixin
```

## 常见问题

### 1) 提示“node_modules 缺少编译器模块”

按以下顺序处理：

```bash
nvm use 18.17.0
node -v
npm cache verify
rm -r node_modules
rm package-lock.json
npm install
npm ls @dcloudio/vite-plugin-uni @dcloudio/uni-mp-weixin @dcloudio/uni-mp-compiler @dcloudio/uni-app
```

如果你使用 HBuilderX，还需要在 HBuilderX 的 Node 配置里绑定到当前 Node 18 路径，再重新编译。

### 2) 安装时出现 deprecated 警告

`npm WARN deprecated` 多数是上游依赖链提示，不等于安装失败。只要 `npm install` 成功且 `npm run build:*` 可通过，就可以继续开发。

### 3) H5 构建看到 pdf.js 的 eval 警告

这是 `pdfjs-dist` 的常见提示，当前不会阻止构建。若后续做严格安全审计，再单独评估替代构建或配置策略。