# MongoDB Atlas Setup

这份文档用于给当前后端创建可上线的 MongoDB Atlas 配置，目标是满足“个人项目可用、权限最小化、便于托管 Node 服务接入”。

## 1. 创建 Atlas 项目与集群

1. 登录 MongoDB Atlas。
2. 创建一个新的 Project，建议名称使用 `PDF-Reader`。
3. 创建一个 Cluster。
4. 个人项目优先选择最低成本方案即可，但要确保所在区域尽量靠近你的主要用户。

建议：

- 开发和生产可以先共用一个 Atlas Project。
- 若后续用户量增加，再拆分不同环境。

## 2. 创建数据库应用账号

不要直接使用 Atlas 管理员账号给应用连接数据库。

建议创建专用应用账号，例如：

- Username: `pdf_reader_app`
- Password: 使用密码管理器生成的强随机密码

权限建议：

- Database User Privileges: `readWrite` on database `pdf-reader`

如果你只部署当前这个后端，这个权限已经够用。

不要授予：

- `atlasAdmin`
- `readWriteAnyDatabase`
- `dbAdminAnyDatabase`

## 3. 配置网络访问

Atlas 的 Network Access 至少要做以下选择之一：

### 方案 A：部署平台出口 IP 固定

如果你的托管 Node 平台能提供固定出口 IP，就只把这些 IP 加入白名单。

### 方案 B：部署平台出口 IP 不固定

如果平台不给固定 IP，个人项目可以先临时允许：

```text
0.0.0.0/0
```

但必须同时保证：

1. 数据库账号是专用账号。
2. 密码足够强。
3. 权限只有 `pdf-reader` 这一库的 `readWrite`。

这不是最理想的网络策略，但对个人 MVP 是常见折中。

## 4. 获取连接串

在 Atlas 中选择 Connect，然后拿到 Node.js 连接串，替换为真实用户名、密码和数据库名。

连接串示例：

```env
MONGO_URI=mongodb+srv://pdf_reader_app:your_strong_password@cluster0.xxxxx.mongodb.net/pdf-reader?retryWrites=true&w=majority
```

注意点：

1. 数据库名要写成 `pdf-reader`。
2. 如果密码里包含特殊字符，需要 URL encode。
3. 这个值只应放到部署平台环境变量，不要写进仓库。

## 5. 自动建库与建索引

当前后端会在启动时自动连接数据库，并执行索引创建逻辑。

对应文件：

- [config/db.js](config/db.js)
- [config/indexes.js](config/indexes.js)

所以你不需要在 Atlas 里手工建表。

第一次完成以下任意动作后，集合就会逐步出现：

1. 注册用户
2. 管理员上传图书
3. 用户兑换图书

## 6. 备份建议

个人项目也建议至少启用以下任一种：

1. Atlas 自动备份
2. 定期手工导出快照

最低要求：

- 能在误删用户、图书或兑换码后恢复最近一份数据

## 7. 最小验收

连接串配置完成后，至少验证以下结果：

1. 启动后端时日志出现 `MongoDB connected`
2. 注册一个普通用户后，Atlas 中出现 `users` 集合
3. 管理员上传图书后，Atlas 中出现 `books` 集合
4. 生成兑换码后，Atlas 中出现 `redeemcodes` 集合
5. 用户兑换后，Atlas 中出现 `bookshelfitems` 集合

## 8. 当前最推荐的 Atlas 使用方式

对你这个项目，当前最合理的配置是：

1. 一个 Atlas Cluster
2. 一个应用账号 `pdf_reader_app`
3. 一个业务数据库 `pdf-reader`
4. 托管 Node 服务通过环境变量注入 `MONGO_URI`

这样已经足够支撑当前 MVP 上线。