# 开发说明手册

这份手册写给长期维护这个项目的人，但默认你更熟前端，不熟后端和数据库。

它不追求把系统讲全，而是优先帮你做成 4 件事：

1. 把项目跑起来
2. 把联调问题分层定位
3. 知道改某个功能时先看哪里
4. 理解几个会影响判断的最小原理

如果你现在卡在具体问题上，不要从头顺读，直接按下面的任务入口跳。

## 1. 任务入口

- 我要先把项目跑起来，看“2. 启动与最小联调闭环”
- 我要判断为什么接口不通，看“3. 联调排障故障树”
- 我要把普通用户改成管理员，看“4.1 提权管理员”
- 我要改上传图书，看“4.2 上传图书”
- 我要改兑换码流程，看“4.3 生成兑换码”和“4.4 用户兑换”
- 我要查阅读进度为什么没保存，看“4.5 阅读进度排查”
- 我要知道这个系统本身怎么分，看“5. 模块索引”
- 我要手工查 MongoDB 数据，看“6. MongoDB 最少操作”
- 我要知道为什么系统这样设计，看“7. 最小原理说明”

## 2. 启动与最小联调闭环

### 2.1 本地开发需要什么

必须安装：

- Node.js 18.17+
- npm 9+
- MongoDB Community Server
- mongosh

本地开发不需要：

- MongoDB Atlas
- Atlas CLI
- Docker Desktop

当前项目默认连本地 MongoDB：

```env
mongodb://localhost:27017/pdf-reader
```

### 2.2 先启动 MongoDB

先不要急着跑后端。先确认数据库真的能连上：

```powershell
mongosh
```

预期结果：

- 能进入 Mongo Shell
- 没有连接拒绝错误

如果这里都失败，这不是代码问题，先回去处理本地 MongoDB 安装或服务启动。

### 2.3 再启动后端

```powershell
cd g:\PDF-Reader\backend
npm install
npm start
```

预期结果：

- 出现 `MongoDB connected`
- 服务开始监听端口

最关键的环境变量在 [backend/.env.example](../backend/.env.example)，核心是：

```env
MONGO_URI=mongodb://localhost:27017/pdf-reader
```

### 2.4 再启动前端

```powershell
cd g:\PDF-Reader\PDF-Reader_frontend
npm install
npm run dev:mp-weixin
```

如果你只想确认依赖和构建是否正常：

```powershell
npm run build:mp-weixin
```

### 2.5 最小联调闭环

第一次接手时，不要先改代码。先跑通这条闭环：

1. 启动 MongoDB
2. 启动后端
3. 启动前端
4. 注册一个普通用户
5. 把这个用户提权成管理员
6. 管理员重新登录
7. 上传一本 PDF
8. 生成兑换码
9. 用另一个普通用户兑换图书
10. 打开阅读器，确认能看到图书并保存进度

你只要把这条链路跑通，认证、权限、图书、兑换码、书架、阅读进度这几条主线就都验证到了。

## 3. 联调排障故障树

这一节统一按“现象 -> 先判断 -> 立即执行 -> 预期结果 -> 异常分支”来写。

### 3.1 mongosh 连不上 MongoDB

现象：

- 执行 `mongosh` 就失败
- 报连接拒绝、超时、找不到本地服务

先判断：

- 这是数据库自身没启动，或者 MongoDB 没装好
- 这不是后端代码问题

立即执行：

```powershell
mongosh
```

预期结果：

- 正常进入 Shell

异常分支：

- 如果命令不存在，说明 `mongosh` 没安装或没进 PATH
- 如果命令存在但连不上，优先检查 MongoDB Community Server 是否已安装并作为服务启动
- 只有 `mongosh` 连通后，才继续查后端

### 3.2 后端启动了，但没有出现 MongoDB connected

现象：

- `npm start` 能跑，但没有出现 `MongoDB connected`
- 或者直接抛数据库连接错误

先判断：

- 大概率是 `.env` 配错，或者 MongoDB 根本没启动
- 先别怀疑控制器和业务逻辑

立即执行：

```powershell
cd g:\PDF-Reader\backend
type .env
```

重点看：

```env
MONGO_URI=mongodb://localhost:27017/pdf-reader
```

然后再执行：

```powershell
mongosh
```

预期结果：

- `.env` 指向本地 MongoDB
- `mongosh` 可连接
- 重启后端后出现 `MongoDB connected`

异常分支：

- 如果 `.env` 不存在，参考 [backend/.env.example](../backend/.env.example) 新建
- 如果 `.env` 指向 Atlas，先改回本地地址
- 如果两者都正常但还是连不上，再看 [backend/config/db.js](../backend/config/db.js)

### 3.3 前端接口返回 401

现象：

- 登录后仍提示未登录
- 某些接口直接返回 401

先判断：

- 先查 token 有没有写进去、带出去
- 先别急着怀疑后端权限逻辑

立即执行：

- 看统一请求层 [PDF-Reader_frontend/src/utils/http.js](../PDF-Reader_frontend/src/utils/http.js)
- 看登录态存储 [PDF-Reader_frontend/src/store/index.js](../PDF-Reader_frontend/src/store/index.js)

预期结果：

- 登录后 token 被写入 store 和本地存储
- 发请求时 token 被自动带上

异常分支：

- 如果登录接口本身失败，先查 [backend/controllers/auth.js](../backend/controllers/auth.js)
- 如果只有个别页面 401，优先看该页面是不是绕过了统一请求层

### 3.4 前端接口返回 403

现象：

- 已登录，但管理员页面或管理员接口返回 403

先判断：

- 403 先查角色，不要先改前端菜单显示
- 管理员接口本来就应该被后端挡住

立即执行：

```javascript
use pdf-reader
db.users.find({ phone: "13800138000" }, { phone: 1, role: 1 })
```

再看：

- [backend/routes/books.js](../backend/routes/books.js)
- [backend/routes/redeemCodes.js](../backend/routes/redeemCodes.js)
- [backend/middleware/requireRole.js](../backend/middleware/requireRole.js)

预期结果：

- 用户角色是 `admin`
- 管理员接口挂了 `requireRole('admin')`

异常分支：

- 如果角色不是 `admin`，直接做“4.1 提权管理员”
- 如果角色已经对了，重新登录一次，让前端拿到新 token

### 3.5 上传 PDF 失败

现象：

- 管理员上传图书时报文件类型错误、大小超限、保存失败

先判断：

- 先区分是前端表单没发对，还是后端存储配置有问题
- 不要一上来就改数据库模型

立即执行：

- 看前端上传页 [PDF-Reader_frontend/src/pages/upload/upload.vue](../PDF-Reader_frontend/src/pages/upload/upload.vue)
- 看存储配置 [backend/config/storage.js](../backend/config/storage.js)
- 看上传控制器 [backend/controllers/books.js](../backend/controllers/books.js)

预期结果：

- 只允许 PDF
- 文件大小限制正常
- 上传后文件进入 `backend/uploads/`

异常分支：

- 如果前端根本没发 multipart 请求，先修上传页
- 如果后端收到文件但保存失败，优先看 [backend/config/storage.js](../backend/config/storage.js)

### 3.6 兑换失败

现象：

- 管理员能生成兑换码
- 普通用户输入后提示兑换失败、兑换码无效或已使用

先判断：

- 先查兑换码状态
- 再查书架记录有没有创建
- 先别改前端提示文案

立即执行：

```javascript
use pdf-reader
db.redeemcodes.find({}, { code: 1, bookId: 1, usedBy: 1, usedAt: 1, expiresAt: 1 }).sort({ createdAt: -1 }).limit(5)
```

必要时再查：

```javascript
db.bookshelfitems.find({}, { userId: 1, bookId: 1, currentPage: 1, lastReadAt: 1 }).sort({ updatedAt: -1 }).limit(5)
```

预期结果：

- 兑换码存在且可用
- 兑换成功后出现对应 `bookshelfitems`

异常分支：

- 生成逻辑看 [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)
- 兑换入书架逻辑看 [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)

### 3.7 阅读进度没有保存

现象：

- 页面能翻页，但重新进入后进度丢失

先判断：

- 先区分是前端没发同步请求，还是后端没写入 `bookshelfitems`
- 先不要去看 `books`，阅读进度不在那里

立即执行：

- 看阅读器页面 [PDF-Reader_frontend/src/pages/reader/reader.vue](../PDF-Reader_frontend/src/pages/reader/reader.vue)
- 看后端进度接口 [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)

然后用 MongoDB 核对：

```javascript
use pdf-reader
db.bookshelfitems.find({}, { userId: 1, bookId: 1, currentPage: 1, totalPages: 1, lastReadAt: 1 }).sort({ updatedAt: -1 }).limit(10)
```

预期结果：

- 阅读器翻页后会发同步请求
- `bookshelfitems.currentPage` 和 `lastReadAt` 会变化

异常分支：

- 如果前端没发请求，先修阅读器页面
- 如果请求发了但数据库没更新，查 [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)

## 4. 常见任务流

这一节不是讲模块，而是回答“我现在要做这件事，该从哪下手”。

### 4.1 提权管理员

你现在要做什么：

- 把一个普通用户改成管理员，拿到上传图书和生成兑换码的权限

先判断：

- 管理员不能通过注册接口直接创建
- 所以这一步必须走数据库，不是前端页面

立即执行：

```powershell
mongosh
```

```javascript
use pdf-reader
db.users.updateOne(
  { phone: "13800138000" },
  { $set: { role: "admin" } }
)
```

预期结果：

- `matchedCount: 1`
- `modifiedCount: 1` 或 `0`

然后做：

- 让这个账号重新登录一次

联动文件：

- [backend/controllers/auth.js](../backend/controllers/auth.js)
- [backend/middleware/auth.js](../backend/middleware/auth.js)
- [backend/middleware/requireRole.js](../backend/middleware/requireRole.js)

### 4.2 上传图书

你现在要做什么：

- 管理员上传一本 PDF，并把书保存到图书库

先判断：

- 上传链路至少涉及前端页面、后端存储配置、上传控制器
- 不要只改页面就以为链路完整了

立即执行：

- 先看上传页 [PDF-Reader_frontend/src/pages/upload/upload.vue](../PDF-Reader_frontend/src/pages/upload/upload.vue)
- 再看存储配置 [backend/config/storage.js](../backend/config/storage.js)
- 最后看控制器 [backend/controllers/books.js](../backend/controllers/books.js)

预期结果：

- 前端发的是 multipart 请求
- 后端只接收 PDF
- 成功后 `books` 有记录，`backend/uploads/` 有文件

短提醒：

- 不要先改 `Book` 模型来修上传问题，上传失败多数不在模型层

联动文件：

- [PDF-Reader_frontend/src/pages/upload/upload.vue](../PDF-Reader_frontend/src/pages/upload/upload.vue)
- [backend/controllers/books.js](../backend/controllers/books.js)
- [backend/routes/books.js](../backend/routes/books.js)
- [backend/config/storage.js](../backend/config/storage.js)

### 4.3 生成兑换码

你现在要做什么：

- 给某本图书生成一批可用兑换码

先判断：

- 这是管理员动作
- 先确认当前图书状态允许生成兑换码

立即执行：

- 看生成逻辑 [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)
- 看路由权限 [backend/routes/redeemCodes.js](../backend/routes/redeemCodes.js)

然后核对数据库：

```javascript
use pdf-reader
db.redeemcodes.find({}, { code: 1, bookId: 1, usedBy: 1, usedAt: 1, expiresAt: 1 }).sort({ createdAt: -1 }).limit(10)
```

预期结果：

- 新兑换码写入 `redeemcodes`
- 状态可用

短提醒：

- 403 先查角色，不要先改页面按钮显示

联动文件：

- [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)
- [backend/routes/redeemCodes.js](../backend/routes/redeemCodes.js)
- [backend/middleware/requireRole.js](../backend/middleware/requireRole.js)

### 4.4 用户兑换

你现在要做什么：

- 让普通用户用兑换码把书加入书架

先判断：

- 兑换成功不只意味着兑换码被消费
- 还意味着用户应该得到一条 `bookshelfitems`

立即执行：

- 看兑换逻辑 [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)
- 看兑换码状态 [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)

然后核对：

```javascript
use pdf-reader
db.bookshelfitems.find({}, { userId: 1, bookId: 1, currentPage: 1, lastReadAt: 1 }).sort({ updatedAt: -1 }).limit(10)
```

预期结果：

- 兑换码被使用
- 用户书架新增记录

短提醒：

- 不要把“兑换”理解成给用户改 `books`，持有关系在 `bookshelfitems`

联动文件：

- [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)
- [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)
- [backend/routes/bookshelf.js](../backend/routes/bookshelf.js)

### 4.5 阅读进度排查

你现在要做什么：

- 确认阅读器为什么没同步页码、最近阅读时间或书签

先判断：

- 进度同步链路是“阅读器页面 -> 书架控制器 -> bookshelfitems”
- 不要先去看 `books`

立即执行：

- 看阅读器页面 [PDF-Reader_frontend/src/pages/reader/reader.vue](../PDF-Reader_frontend/src/pages/reader/reader.vue)
- 看进度同步控制器 [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)

然后核对数据库：

```javascript
use pdf-reader
db.bookshelfitems.find({}, { userId: 1, bookId: 1, currentPage: 1, totalPages: 1, lastReadAt: 1 }).sort({ updatedAt: -1 }).limit(10)
```

预期结果：

- 前端发了同步请求
- `bookshelfitems` 的进度字段变化

短提醒：

- 阅读进度问题先看 `bookshelfitems`，不要先改图书元数据

联动文件：

- [PDF-Reader_frontend/src/pages/reader/reader.vue](../PDF-Reader_frontend/src/pages/reader/reader.vue)
- [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)
- [backend/routes/bookshelf.js](../backend/routes/bookshelf.js)

## 5. 模块索引

前面是任务流，这一节是稳定的系统索引。你要长期维护，还是得知道各模块各自负责什么。

### 5.1 认证模块

看这些文件：

- [backend/controllers/auth.js](../backend/controllers/auth.js)
- [backend/routes/auth.js](../backend/routes/auth.js)
- [backend/middleware/auth.js](../backend/middleware/auth.js)
- [PDF-Reader_frontend/src/pages/login/login.vue](../PDF-Reader_frontend/src/pages/login/login.vue)

你会在这里处理：

- 注册
- 登录
- token 鉴权
- 当前用户身份识别

### 5.2 图书模块

看这些文件：

- [backend/controllers/books.js](../backend/controllers/books.js)
- [backend/routes/books.js](../backend/routes/books.js)
- [backend/config/storage.js](../backend/config/storage.js)
- [PDF-Reader_frontend/src/pages/upload/upload.vue](../PDF-Reader_frontend/src/pages/upload/upload.vue)

你会在这里处理：

- 上传图书
- 图书状态
- PDF 文件保存路径

### 5.3 兑换码模块

看这些文件：

- [backend/controllers/redeemCodes.js](../backend/controllers/redeemCodes.js)
- [backend/routes/redeemCodes.js](../backend/routes/redeemCodes.js)
- [backend/middleware/requireRole.js](../backend/middleware/requireRole.js)

你会在这里处理：

- 生成兑换码
- 查询最近兑换记录
- 管理员权限限制

### 5.4 书架模块

看这些文件：

- [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)
- [backend/routes/bookshelf.js](../backend/routes/bookshelf.js)
- [PDF-Reader_frontend/src/pages/index/index.vue](../PDF-Reader_frontend/src/pages/index/index.vue)

你会在这里处理：

- 用户兑换
- 书架列表
- 阅读进度同步
- 最近阅读信息

### 5.5 阅读器模块

看这些文件：

- [PDF-Reader_frontend/src/pages/reader/reader.vue](../PDF-Reader_frontend/src/pages/reader/reader.vue)
- [backend/controllers/bookshelf.js](../backend/controllers/bookshelf.js)

你会在这里处理：

- PDF 打开
- 翻页
- 进度同步
- 书签或最近阅读状态

### 5.6 请求层和状态层

看这些文件：

- [PDF-Reader_frontend/src/utils/http.js](../PDF-Reader_frontend/src/utils/http.js)
- [PDF-Reader_frontend/src/store/index.js](../PDF-Reader_frontend/src/store/index.js)
- [PDF-Reader_frontend/src/pages.json](../PDF-Reader_frontend/src/pages.json)

你会在这里处理：

- 统一请求入口
- token 自动携带
- 登录态保存
- 页面注册

短提醒：

- 不要先在页面里手搓请求，先看有没有必要走统一请求层

## 6. MongoDB 最少操作

这里只保留你最常会用到的数据库命令，不讲 MongoDB 理论。

### 6.1 进入数据库

```powershell
mongosh
```

```javascript
use pdf-reader
```

### 6.2 看集合

```javascript
show collections
```

你最常看到的是：

- `users`
- `books`
- `redeemcodes`
- `bookshelfitems`

### 6.3 查用户

```javascript
db.users.find({}, { phone: 1, email: 1, role: 1 }).limit(20)
```

### 6.4 提权管理员

```javascript
db.users.updateOne(
  { phone: "13800138000" },
  { $set: { role: "admin" } }
)
```

### 6.5 查图书

```javascript
db.books.find({}, { title: 1, author: 1, status: 1, removedAt: 1 }).limit(20)
```

### 6.6 查兑换码

```javascript
db.redeemcodes.find({}, { code: 1, bookId: 1, usedBy: 1, usedAt: 1, expiresAt: 1 }).limit(20)
```

### 6.7 查书架和阅读进度

```javascript
db.bookshelfitems.find({}, { userId: 1, bookId: 1, currentPage: 1, totalPages: 1, lastReadAt: 1 }).limit(20)
```

## 7. 最小原理说明

这一节只解释会影响你判断的问题，不讲课程式背景。

### 7.1 为什么管理员要手工提权

因为系统默认不允许通过公开注册接口直接创建管理员。

这不是缺功能，而是权限边界设计。正确流程是：

1. 先注册普通用户
2. 再在数据库中把 `role` 改成 `admin`

所以如果你想修管理员问题，先确认是不是账号角色没到位，而不是先改前端菜单。

### 7.2 为什么阅读进度写在 bookshelfitems

因为阅读进度属于“某个用户持有某本书后的状态”，不是图书本身的元数据。

所以：

- `books` 存图书信息
- `bookshelfitems` 存用户和图书的关系，以及进度、最近阅读、书签

这也是为什么阅读进度丢失时，你先查 `bookshelfitems`，不是先查 `books`。

### 7.3 为什么删除图书不等于已兑换用户失去阅读权限

因为这个系统的业务规则不是公开书城，而是“兑换后进入个人书架”。

因此删除或归档图书的语义更接近：

- 停止新兑换
- 停止继续发新兑换码
- 但不自动抹掉已有用户的持有关系

所以如果你改图书状态逻辑，要先确认是否破坏了已有用户的阅读权。

## 8. 开发约定

这一节只保留会直接影响你改代码的约定。

### 8.1 后端约定

- 所有接口统一以 `/api/` 开头
- 管理员权限通过 [backend/middleware/requireRole.js](../backend/middleware/requireRole.js) 控制
- 统一错误处理入口是 [backend/middleware/errorHandler.js](../backend/middleware/errorHandler.js)
- 分页逻辑在 [backend/middleware/pagination.js](../backend/middleware/pagination.js)
- 文件上传配置在 [backend/config/storage.js](../backend/config/storage.js)

### 8.2 前端约定

- 统一请求层在 [PDF-Reader_frontend/src/utils/http.js](../PDF-Reader_frontend/src/utils/http.js)
- 登录态和用户信息统一放在 [PDF-Reader_frontend/src/store/index.js](../PDF-Reader_frontend/src/store/index.js)
- 页面要先在 [PDF-Reader_frontend/src/pages.json](../PDF-Reader_frontend/src/pages.json) 注册

### 8.3 遇到字段或接口细节不确定时看哪里

直接看：

- [docs/api/API_SPEC.md](./api/API_SPEC.md)

这份文件是接口事实来源。

## 9. 当前保留文档

项目当前只保留两份面向人的主手册：

1. [docs/developer_manual.md](./developer_manual.md)
2. [docs/user/user_manual.md](./user/user_manual.md)

接口细节以 [docs/api/API_SPEC.md](./api/API_SPEC.md) 为准。
