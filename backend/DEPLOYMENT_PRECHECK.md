# Backend Deployment Precheck

这份清单用于后端首次部署前的最小检查，目标是先把 Express + MongoDB Atlas 方案稳定上线，再考虑对象存储或 Serverless。

## 1. 环境变量

部署前必须在平台环境变量中配置以下字段，不要把真实值提交到仓库：

| 变量名 | 必填 | 说明 |
| --- | --- | --- |
| `MONGO_URI` | 是 | MongoDB 连接串，建议使用 Atlas 专用应用账号 |
| `JWT_SECRET` | 是 | JWT 签名密钥，必须使用强随机字符串 |
| `PORT` | 否 | 平台若自动注入端口，可不手填；默认 `5000` |
| `NODE_ENV` | 是 | 生产环境应为 `production` |
| `FRONTEND_URL` | 是 | 生产前端域名，用于 CORS 白名单 |

## 2. 数据库

1. 已创建 MongoDB Atlas 集群。
2. 已创建应用专用数据库用户，而不是使用管理员账号。
3. 应用用户只拥有 `pdf-reader` 数据库的最小读写权限。
4. Atlas 已开启自动备份或至少有手工快照方案。
5. 已确认 MongoDB 网络访问策略只允许需要的来源。

## 3. 后端配置

1. 当前入口文件仍是 [index.js](index.js)，部署平台应直接运行 `npm start`。
2. 生产环境必须配置 `FRONTEND_URL`，否则 [index.js](index.js) 会回退到 `http://localhost:3000`。
3. 当前文件上传仍写入本地 `uploads/` 目录，仅适合单实例或短期 MVP。
4. 若平台使用临时文件系统或多实例，必须尽快把上传迁移到对象存储。

## 4. 安全基线

1. `JWT_SECRET` 已替换为强随机值。
2. `.env` 不在仓库中，且平台变量页面权限已收紧。
3. 后端日志中不打印密码、token、完整 Authorization 头。
4. 数据库不对公网匿名开放。
5. 平台已开启 HTTPS。

## 5. 上线前联调

1. 普通用户可注册。
2. 普通用户可用手机号或邮箱登录。
3. 数据库可手工把某个用户提权为 `admin`。
4. 管理员可上传图书。
5. 管理员可生成兑换码。
6. 普通用户可兑换图书并加入书架。
7. 阅读页可打开图书并同步进度。

## 6. 上线后验证

1. 平台日志中看到 `MongoDB connected`。
2. Atlas 中已创建 `users`、`books`、`redeemcodes`、`bookshelfitems` 集合与索引。
3. 前端请求未出现 CORS 错误。
4. 重启服务后，登录、上传、兑换、阅读流程仍正常。

## 7. 明确限制

1. 当前版本还没有对象存储，PDF 仍依赖本地 `uploads/`。
2. 当前版本更适合托管 Node 服务，不适合直接原样迁移到纯 Serverless。
3. 若后续要走 Serverless，应优先完成文件存储迁移。