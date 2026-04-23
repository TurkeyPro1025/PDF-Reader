# PDF Reader Backend

Node.js + Express + MongoDB 后端，当前实现已经从“个人 PDF 上传器”切换为“管理员图书库 + 普通用户兑换入书架”的模式。

## 当前业务模型

- 管理员和普通用户共用一套前后端
- 普通用户可注册，只能通过兑换码获得图书
- 管理员不能通过注册接口创建，必须在数据库里把账号角色改成 `admin`
- 只有管理员可以上传图书、上下架图书、生成兑换码、查看最近兑换记录
- 普通用户兑换成功后，图书会进入自己的书架并永久持有
- 图书下架后不能继续生成新兑换码，也不能继续兑换，但已持有用户仍可阅读

## 技术栈

- Node.js 14+
- Express 5
- MongoDB 4+
- Mongoose
- JWT
- bcrypt
- multer

## 目录对应的核心能力

- `models/User.js`：用户模型，手机号为主身份键
- `models/Book.js`：图书模型，保存 PDF 元数据和图书信息
- `models/RedeemCode.js`：兑换码模型，一书一码，一次性使用
- `models/BookshelfItem.js`：书架模型，保存持有关系、阅读进度、最后阅读、书签
- `controllers/auth.js`：注册、登录
- `controllers/books.js`：管理员图书管理、用户阅读授权
- `controllers/redeemCodes.js`：管理员生成兑换码、查看最近兑换记录
- `controllers/bookshelf.js`：普通用户兑换、书架列表、阅读进度同步、移除书架

## 部署前先看

- 环境变量模板： [backend/.env.example](backend/.env.example)
- 部署前检查清单： [backend/DEPLOYMENT_PRECHECK.md](backend/DEPLOYMENT_PRECHECK.md)
- MongoDB Atlas 配置： [backend/MONGODB_ATLAS_SETUP.md](backend/MONGODB_ATLAS_SETUP.md)
- 托管 Node 首次部署： [backend/HOSTED_NODE_DEPLOYMENT.md](backend/HOSTED_NODE_DEPLOYMENT.md)
- 生产域名与 HTTPS： [backend/DOMAIN_AND_HTTPS_SETUP.md](backend/DOMAIN_AND_HTTPS_SETUP.md)
- 最小安全基线： [backend/SECURITY_BASELINE.md](backend/SECURITY_BASELINE.md)
- 业务验收清单： [backend/BUSINESS_ACCEPTANCE_CHECKLIST.md](backend/BUSINESS_ACCEPTANCE_CHECKLIST.md)
- 运行维护手册： [backend/OPERATIONS_RUNBOOK.md](backend/OPERATIONS_RUNBOOK.md)
- 对象存储迁移方案： [backend/OBJECT_STORAGE_MIGRATION_PLAN.md](backend/OBJECT_STORAGE_MIGRATION_PLAN.md)
- Serverless 评估指南： [backend/SERVERLESS_EVALUATION.md](backend/SERVERLESS_EVALUATION.md)

## 从数据库角度先理解系统

本项目默认数据库名是 `pdf-reader`。

MongoDB 不要求你像 MySQL 一样先手工建表。只要：

1. MongoDB 服务能连通
2. 后端成功启动
3. 你完成一次注册、上传图书或兑换操作

数据库、集合和索引就会自动创建。

### 当前会创建哪些集合

| 集合名 | 模型 | 用途 |
| --- | --- | --- |
| `users` | `User` | 保存用户账号、手机号、邮箱、角色 |
| `books` | `Book` | 保存图书元数据和 PDF 文件定位信息 |
| `redeemcodes` | `RedeemCode` | 保存兑换码、状态、使用人、使用时间 |
| `bookshelfitems` | `BookshelfItem` | 保存用户持有的图书和阅读状态 |

说明：

- MongoDB 实际集合名由 Mongoose 自动复数化
- PDF 文件本体仍保存在后端 `uploads/` 目录，不直接存入 MongoDB

## 集合字段说明

### 1. `users`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | String | 是 | 展示名，注册时填写 |
| `phone` | String | 是 | 手机号，唯一，当前主身份键 |
| `email` | String | 否 | 邮箱，可为空，唯一稀疏索引，可用于登录 |
| `password` | String | 是 | bcrypt 哈希后的密码 |
| `role` | String | 否 | `admin` 或 `user`，默认 `user` |
| `createdAt` | Date | 否 | 创建时间 |
| `_id` | ObjectId | 自动生成 | 主键 |

示例文档：

```json
{
  "_id": "661f3e7f7d9c9f1b2c345678",
  "username": "张三",
  "phone": "13800138000",
  "email": "zhangsan@example.com",
  "password": "$2b$10$abc...hashed-password...xyz",
  "role": "user",
  "createdAt": "2026-04-21T08:30:00.000Z"
}
```

### 2. `books`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `title` | String | 是 | 书名 |
| `author` | String | 是 | 作者 |
| `publisher` | String | 否 | 出版社 |
| `isbn` | String | 否 | ISBN |
| `category` | String | 是 | 分类 |
| `coverUrl` | String | 否 | 封面图 URL |
| `description` | String | 否 | 简介 |
| `filename` | String | 是 | 后端保存后的 PDF 文件名 |
| `originalname` | String | 是 | 原始上传文件名 |
| `path` | String | 是 | 文件路径，通常形如 `uploads/xxx.pdf` |
| `size` | Number | 是 | 文件大小，字节 |
| `status` | String | 否 | `active`、`inactive`、`archived`，默认 `active` |
| `createdBy` | ObjectId | 是 | 上传管理员 |
| `createdAt` | Date | 否 | 创建时间 |
| `updatedAt` | Date | 否 | 更新时间 |
| `_id` | ObjectId | 自动生成 | 主键 |

示例文档：

```json
{
  "_id": "661f40257d9c9f1b2c345679",
  "title": "JavaScript 高级程序设计",
  "author": "Nicholas C. Zakas",
  "publisher": "人民邮电出版社",
  "isbn": "9787115545381",
  "category": "前端",
  "coverUrl": "https://example.com/book-cover.jpg",
  "description": "经典前端基础书籍",
  "filename": "book-1710000000000-123456789.pdf",
  "originalname": "JavaScript高级程序设计.pdf",
  "path": "uploads/book-1710000000000-123456789.pdf",
  "size": 2456789,
  "status": "active",
  "createdBy": "661f3e7f7d9c9f1b2c345677",
  "createdAt": "2026-04-21T08:35:00.000Z",
  "updatedAt": "2026-04-21T08:35:00.000Z"
}
```

### 3. `redeemcodes`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `code` | String | 是 | 兑换码，唯一，大写 |
| `bookId` | ObjectId | 是 | 关联图书 |
| `status` | String | 否 | `unused`、`used`、`expired` |
| `expiresAt` | Date | 否 | 过期时间，可为空 |
| `usedBy` | ObjectId | 否 | 使用该兑换码的用户 |
| `usedAt` | Date | 否 | 使用时间 |
| `createdBy` | ObjectId | 是 | 生成兑换码的管理员 |
| `createdAt` | Date | 否 | 创建时间 |
| `_id` | ObjectId | 自动生成 | 主键 |

示例文档：

```json
{
  "_id": "661f41267d9c9f1b2c345680",
  "code": "A1B2C3D4",
  "bookId": "661f40257d9c9f1b2c345679",
  "status": "used",
  "usedBy": "661f3e7f7d9c9f1b2c345678",
  "usedAt": "2026-04-21T09:00:00.000Z",
  "createdBy": "661f3e7f7d9c9f1b2c345677",
  "createdAt": "2026-04-21T08:50:00.000Z"
}
```

### 4. `bookshelfitems`

| 字段名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `userId` | ObjectId | 是 | 所属用户 |
| `bookId` | ObjectId | 是 | 所属图书 |
| `addedAt` | Date | 否 | 加入书架时间 |
| `removedAt` | Date | 否 | 移出书架时间，未移除时为 `null` |
| `lastReadAt` | Date | 否 | 最近阅读时间 |
| `progress` | Number | 否 | 阅读进度，0 到 100 |
| `lastPage` | Number | 否 | 最近阅读页码 |
| `bookmarks` | Array | 否 | 书签数组 |

书签数组元素结构：

| 字段名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | String | 书签唯一标识 |
| `page` | Number | 对应页码 |
| `label` | String | 书签名称 |
| `createdAt` | Date | 创建时间 |

示例文档：

```json
{
  "_id": "661f42017d9c9f1b2c345681",
  "userId": "661f3e7f7d9c9f1b2c345678",
  "bookId": "661f40257d9c9f1b2c345679",
  "addedAt": "2026-04-21T09:01:00.000Z",
  "removedAt": null,
  "lastReadAt": "2026-04-21T10:12:00.000Z",
  "progress": 27.4,
  "lastPage": 32,
  "bookmarks": [
    {
      "id": "1713684780000",
      "page": 20,
      "label": "第 20 页",
      "createdAt": "2026-04-21T10:10:00.000Z"
    }
  ]
}
```

## 启动时会自动创建的索引

后端连接 MongoDB 后会自动创建如下索引：

| 集合 | 索引 | 作用 |
| --- | --- | --- |
| `users` | `{ phone: 1 }` 唯一索引 | 保证手机号唯一，并提升手机号登录查询速度 |
| `users` | `{ email: 1 }` 唯一稀疏索引 | 邮箱可为空，但填写后必须唯一 |
| `books` | `{ status: 1, category: 1, createdAt: -1 }` | 提升图书筛选与排序 |
| `books` | `{ createdBy: 1, createdAt: -1 }` | 提升管理员查看自己上传图书的效率 |
| `redeemcodes` | `{ code: 1 }` 唯一索引 | 保证兑换码唯一 |
| `redeemcodes` | `{ bookId: 1, status: 1, createdAt: -1 }` | 提升按图书和状态统计兑换码效率 |
| `redeemcodes` | `{ usedAt: -1 }` | 提升最近兑换记录查询效率 |
| `bookshelfitems` | `{ userId: 1, bookId: 1 }` 唯一索引 | 保证用户同一本书只有一条持有记录 |
| `bookshelfitems` | `{ userId: 1, removedAt: 1, lastReadAt: -1 }` | 提升书架与最近阅读查询效率 |

## 从 0 开始搭建

### 第 1 步：启动 MongoDB

Windows PowerShell：

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

默认本地地址：

```text
mongodb://localhost:27017
```

### 第 2 步：进入后端目录

```powershell
cd g:\PDF-Reader\backend
```

### 第 3 步：创建 `.env`

当前仓库没有现成的 `.env.example` 时，可以手工创建 `.env`，内容如下：

```env
MONGO_URI=mongodb://localhost:27017/pdf-reader
JWT_SECRET=替换成你自己生成的安全随机字符串
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 新手一定要先理解：本地 Mongo 和 Atlas 不冲突

如果你是后端新手，这里最容易搞混。

你可以把它理解成：

- 本地 MongoDB：给你自己在电脑上开发、联调、试错用
- MongoDB Atlas：给以后部署到线上时用

这两个不是“二选一后就永远不能换”，而是你在不同阶段可以切换使用。

当前项目**仍然完全支持本地 MongoDB 联调**，你现在不需要为了本地开发强行切到 Atlas。

### 后端到底会连接哪个数据库

后端启动时，会优先读取 `.env` 里的 `MONGO_URI`。

所以规则非常简单：

- 如果你的 `.env` 里写的是本地地址，就连接本地 MongoDB
- 如果你的 `.env` 里写的是 Atlas 地址，就连接 Atlas

对新手来说，你不需要去理解复杂的“连接池”或“运行时注入”逻辑，先记住一句话就够了：

**`MONGO_URI` 写谁，后端就连谁。**

### 你现在本地开发时最推荐的写法

如果你只是想在自己电脑上把项目跑起来，请先用本地 MongoDB：

```env
MONGO_URI=mongodb://localhost:27017/pdf-reader
JWT_SECRET=替换成你自己生成的安全随机字符串
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

这样做的好处是：

- 你不用担心网络问题
- 你不用先注册 Atlas 账号才能调试
- 你上传的 PDF 文件和本地数据库都在自己电脑上，更容易排查问题

### 为什么当前版本本地联调反而更方便

因为当前版本的 PDF 上传，还是保存到后端本地 `uploads/` 目录。

这意味着：

- 你在本地启动后端时，上传文件会直接保存在你电脑里的 `backend/uploads/`
- 你本地打开阅读页时，也更容易确认“数据库记录”和“文件是否真的存在”是不是一致

所以对当前版本来说：

- 本地开发、联调：优先本地 MongoDB
- 线上部署：优先 Atlas

这样的分工最适合新手，也最省事。

### 什么时候你会以为“项目连不上本地 Mongo”

最常见的原因不是代码坏了，而是下面这几种情况：

1. 你的 MongoDB 服务根本没有启动。
2. 你的 `.env` 里其实写的是 Atlas 地址，不是本地地址。
3. 你的本地 MongoDB 端口不是 `27017`。
4. 你修改了 `.env`，但没有重新启动后端。

### 一个最实用的排查方法

如果你怀疑后端没有连到你想要的数据库，可以按这个思路排查：

1. 先打开 `.env`，确认 `MONGO_URI` 到底写的是本地还是 Atlas。
2. 再启动后端。
3. 注册一个测试用户。
4. 去对应的数据库里看 `users` 集合有没有新数据。

如果本地库里出现了新用户，说明你现在连接的就是本地 MongoDB。

### 给新手的直接建议

你现在先不要同时折腾“本地 MongoDB”和“Atlas”。

最稳妥的顺序是：

1. 先用本地 MongoDB 把注册、登录、上传、兑换、阅读全部跑通。
2. 确认业务没有问题后，再把 `.env` 里的 `MONGO_URI` 切到 Atlas 做部署测试。

这样你更容易分清：

- 现在遇到的是“代码逻辑问题”
- 还是“部署环境问题”

生成 JWT 密钥：

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 第 4 步：安装依赖

```powershell
npm install
```

### 第 5 步：启动后端

```powershell
npm start
```

理想日志类似：

```text
MongoDB connected
✓ Created unique index on User.phone
✓ Created unique sparse index on User.email
✓ Created index on Book.status + category + createdAt
✓ Created index on Book.createdBy + createdAt
✓ Created unique index on RedeemCode.code
✓ Created index on RedeemCode.bookId + status + createdAt
✓ Created index on RedeemCode.usedAt
✓ Created unique index on BookshelfItem.userId + bookId
✓ Created index on BookshelfItem.userId + removedAt + lastReadAt
All indexes created successfully
Server running on port 5000
```

### 第 6 步：注册一个普通用户

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "phone": "13800138000",
  "email": "test@example.com",
  "password": "123456"
}
```

这一步完成后，至少会出现 `users` 集合和首条用户数据。

### 第 7 步：登录获取 token

登录时 `account` 可以是手机号，也可以是邮箱。

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "account": "13800138000",
  "password": "123456"
}
```

### 第 8 步：把一个用户提升为管理员

当前规则是管理员不能通过注册接口直接创建。你先注册一个普通用户，再在数据库中把它改成管理员。

进入 `mongosh` 后执行：

```javascript
use pdf-reader
db.users.updateOne(
  { phone: '13800138000' },
  { $set: { role: 'admin' } }
)
```

### 第 9 步：管理员上传第一本书

上传字段名必须是 `pdf`，同时可携带图书元数据。

```http
POST http://localhost:5000/api/books
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

pdf: <PDF 文件>
title: JavaScript 高级程序设计
author: Nicholas C. Zakas
category: 前端
publisher: 人民邮电出版社
isbn: 9787115545381
coverUrl: https://example.com/cover.jpg
description: 经典前端基础书籍
```

成功后：

- `uploads/` 会保存 PDF 文件
- `books` 集合会新增图书记录

### 第 10 步：管理员生成兑换码

```http
POST http://localhost:5000/api/redeem-codes
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "bookId": "图书ID",
  "count": 5
}
```

成功后：

- `redeemcodes` 集合会新增兑换码记录

### 第 11 步：普通用户兑换图书

```http
POST http://localhost:5000/api/bookshelf/redeem
Authorization: Bearer <user-token>
Content-Type: application/json

{
  "code": "A1B2C3D4"
}
```

成功后：

- `bookshelfitems` 集合会新增一条持有记录
- 兑换码会变成 `used`

## 如何查看数据库里的真实数据

```javascript
use pdf-reader
show collections
db.users.find().pretty()
db.books.find().pretty()
db.redeemcodes.find().pretty()
db.bookshelfitems.find().pretty()
```

如果你只想快速看一条示例数据：

```javascript
db.users.findOne()
db.books.findOne()
db.redeemcodes.findOne()
db.bookshelfitems.findOne()
```

## 你最容易困惑的几个点

### 1. 为什么我看不到“表结构”

MongoDB 是文档数据库，不会像关系型数据库那样单独展示表字段定义。

在这个项目里：

- 字段规则写在 Mongoose Schema 里
- 真正的数据结构体现在每条文档里
- 所以你要看字段，一是看模型代码，二是看真实文档

### 2. 为什么数据库没显示出来

MongoDB 对空数据库通常不显示。你至少要完成一次写入，比如注册一个用户，数据库才会稳定出现。

### 3. 为什么管理员注册不了

这是业务规则，不是 bug。管理员必须通过数据库授权，不走公开注册接口。

### 4. 为什么图书下架后用户还能读

当前实现把“下架”理解为：

- 不允许继续生成新兑换码
- 不允许继续兑换
- 已经持有的用户仍然可以阅读

这样才能和“永久持有”这个业务要求不冲突。

### 5. 为什么上传成功后数据库有记录，但访问不到 PDF

重点检查：

- 后端是否从 `backend/` 目录启动
- `uploads/` 目录是否存在且可写
- 前端访问的后端地址是否正确
- 浏览器是否被 CORS 或端口配置拦截

## 常见问题排查

### 连接 MongoDB 失败

优先检查：

- MongoDB 服务是否已启动
- `.env` 中 `MONGO_URI` 是否正确
- 本地端口是否真的是 `27017`

### 登录时报 `Server configuration error`

说明后端没有读取到 `JWT_SECRET`。

### 上传时报 `Only PDF files are allowed`

说明上传内容不是标准 PDF，或者表单字段名不是 `pdf`。

### 兑换时报 `Book cannot be redeemed`

通常表示：

- 图书不存在
- 图书已经下架或归档
- 兑换码对应了一本当前不可兑换的书

### 兑换时报 `Redeem code has already been used`

说明该兑换码是一书一码一次性兑换码，已经被消费。

## 推荐你本地验证的最小闭环

1. 启动 MongoDB
2. 启动后端
3. 注册普通用户 A
4. 把用户 A 改成管理员
5. 用管理员上传一本书
6. 生成一个兑换码
7. 再注册普通用户 B
8. 用普通用户 B 兑换该书
9. 打开书架并进入阅读页
10. 翻页后检查 `bookshelfitems` 中的 `progress`、`lastPage`、`bookmarks` 是否变化
