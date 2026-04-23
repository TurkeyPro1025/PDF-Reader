# Hosted Node Deployment Guide

这份文档用于指导当前后端首次部署到托管 Node 平台。目标不是追求复杂架构，而是先把当前 Express 后端稳定上线。

## 1. 当前项目适合的部署方式

当前后端更适合：

1. 托管 Node 服务
2. MongoDB Atlas
3. 先保留本地 `uploads/` 目录作为 MVP 方案

当前版本暂时**不建议**原样直接迁移到纯 Serverless，因为图书上传仍依赖本地文件系统。

## 2. 部署前你需要确认的事

在真正点击 Deploy 前，先确认：

1. 你已经看过 [backend/.env.example](backend/.env.example)
2. 你已经看过 [backend/DEPLOYMENT_PRECHECK.md](backend/DEPLOYMENT_PRECHECK.md)
3. 你已经准备好 Atlas 连接串，参考 [backend/MONGODB_ATLAS_SETUP.md](backend/MONGODB_ATLAS_SETUP.md)

## 3. 平台需要知道什么

对大多数托管 Node 平台，你至少要提供这几项：

| 配置项 | 建议值 |
| --- | --- |
| Root Directory | `backend` |
| Install Command | `npm install` |
| Start Command | `npm start` |
| Node Version | 使用平台默认稳定 LTS，优先 Node 20 LTS |

说明：

- 这个仓库是前后端分目录结构，不要把整个仓库根目录直接当成后端启动目录。
- 后端真正的 `package.json` 在 [backend/package.json](backend/package.json)。
- 当前依赖链对 Node 20 更友好，部署平台不要继续固定在 Node 18。

## 4. 必填环境变量

部署平台至少要配置：

```env
MONGO_URI=mongodb+srv://pdf_reader_app:your_strong_password@cluster0.xxxxx.mongodb.net/pdf-reader?retryWrites=true&w=majority
JWT_SECRET=替换成强随机字符串
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.example.com
```

重点说明：

1. `MONGO_URI` 使用 Atlas 连接串。
2. `JWT_SECRET` 不要使用示例值。
3. `NODE_ENV` 在平台上应设置为 `production`。
4. `FRONTEND_URL` 必须写成真实前端域名，否则生产环境下 CORS 很容易出错。

## 5. 当前代码已经为部署做了什么适配

当前后端已经具备以下首次部署友好能力：

1. 启动命令直接使用 `npm start`
2. 使用 `PORT` 环境变量决定监听端口
3. 启动时自动创建 `uploads/` 目录
4. 已提供健康检查接口：

- `GET /health`
- `GET /api/health`

5. 已提供基础状态接口：

- `GET /`

## 6. 首次部署推荐步骤

1. 在平台新建服务。
2. 选择当前仓库。
3. 把 Root Directory 设为 `backend`。
4. 填入环境变量。
5. 触发首次部署。
6. 部署成功后先访问：

```text
https://your-backend-domain/health
```

如果返回：

```json
{
  "status": "ok",
  "service": "backend"
}
```

说明服务已经成功启动。

然后再访问：

```text
https://your-backend-domain/api/health
```

如果这里也正常，再去做前后端联调。

## 7. 新手最容易踩的部署坑

### 坑 1：选错根目录

如果你把仓库根目录直接当成后端目录，平台可能找不到正确的 `package.json` 或启动入口。

### 坑 2：忘记设置 `FRONTEND_URL`

当前生产环境下 CORS 不是 `*`，而是读取 `FRONTEND_URL`。如果这里不对，前端会请求失败。

### 坑 3：数据库连不上

常见原因：

1. Atlas 白名单没放行
2. 用户名密码写错
3. 连接串里的数据库名不对

### 坑 4：上传后文件丢失

这是当前版本最需要注意的地方。

因为上传文件还在平台本地磁盘里：

1. 某些平台重启或迁移实例后，文件可能丢失
2. 多实例时，本地文件不会自动同步

所以当前部署方案更适合：

- 小规模 MVP
- 先验证业务流程

不适合长期依赖本地文件做正式存储。

## 8. 第一次上线后要立刻验证什么

1. `GET /health` 正常
2. `GET /api/health` 正常
3. 普通用户注册正常
4. 登录正常
5. 管理员上传图书正常
6. 普通用户兑换和阅读正常

## 9. 下一阶段该做什么

如果首次部署成功，下一阶段最值得做的不是马上切 Serverless，而是：

1. 把图书文件从本地 `uploads/` 迁移到对象存储
2. 再决定是否继续把业务 API 函数化

这是当前项目成本最低、返工最少的路线。