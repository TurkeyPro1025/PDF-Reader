# PDF Reader API 规范

**版本**: 2.0  
**最后更新**: 2026-04-21

---

## 基础信息

- API 基础地址：`http://localhost:5000/api`
- 认证方式：Bearer Token（JWT）
- Token 有效期：7 天
- 默认内容类型：`application/json`
- 文件上传内容类型：`multipart/form-data`

请求头格式：

```http
Authorization: Bearer <jwt_token>
```

---

## 权限模型

| 角色 | 说明 |
| --- | --- |
| `user` | 普通用户，可注册、登录、兑换图书、管理自己的书架和阅读状态 |
| `admin` | 管理员，不能通过注册接口创建，只能由数据库授权；可上传图书、上下架、生成兑换码、查看最近兑换记录 |

---

## 状态码

| 状态码 | 含义 | 说明 |
| --- | --- | --- |
| 200 | OK | 请求成功 |
| 201 | Created | 创建成功 |
| 400 | Bad Request | 参数错误、业务状态不允许 |
| 401 | Unauthorized | 未登录、token 无效或过期 |
| 403 | Forbidden | 角色权限不足 |
| 429 | Too Many Requests | 请求过于频繁，被限流 |
| 404 | Not Found | 资源不存在 |
| 500 | Server Error | 服务器内部错误 |

---

## 系统检查模块

### GET /api/health

用于部署后检查后端服务是否正常启动。

这个接口：

- 不需要登录
- 不检查业务权限
- 主要用于托管平台首次部署、自检和排查服务是否真的启动成功

成功响应：

```json
{
  "status": "ok",
  "service": "backend",
  "environment": "production",
  "timestamp": "2026-04-21T12:00:00.000Z"
}
```

---

## 认证模块

### POST /api/auth/register

普通用户注册。

请求体：

```json
{
  "username": "testuser",
  "phone": "13800138000",
  "email": "test@example.com",
  "password": "123456"
}
```

字段规则：

- `username`：必填，长度至少 2
- `phone`：必填，必须符合中国大陆手机号格式
- `email`：可选，提供时必须是合法邮箱
- `password`：必填，长度至少 6

成功响应：

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "phone": "13800138000",
    "email": "test@example.com",
    "role": "user"
  }
}
```

常见错误：

```json
{
  "message": "Phone number already exists"
}
```

```json
{
  "message": "Email already exists"
}
```

### POST /api/auth/login

使用手机号或邮箱登录。

请求体：

```json
{
  "account": "13800138000",
  "password": "123456"
}
```

或者：

```json
{
  "account": "test@example.com",
  "password": "123456"
}
```

成功响应：

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "phone": "13800138000",
    "email": "test@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

失败响应：

```json
{
  "message": "Invalid credentials"
}
```

如果短时间内重复请求过多，也可能收到：

```json
{
  "message": "Too many authentication requests, please try again later"
}
```

---

## 图书管理模块

以下接口仅管理员可用，除 `/api/books/:bookId/read` 外。

### GET /api/books

获取图书列表，支持分页、状态筛选、分类筛选。

查询参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `page` | number | 1 | 页码 |
| `limit` | number | 10 | 每页数量，最大 100 |
| `status` | string | 无 | `active`、`inactive`、`archived` |
| `category` | string | 无 | 分类筛选 |

成功响应：

```json
{
  "books": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "JavaScript 高级程序设计",
      "author": "Nicholas C. Zakas",
      "publisher": "人民邮电出版社",
      "isbn": "9787115545381",
      "category": "前端",
      "coverUrl": "https://example.com/cover.jpg",
      "description": "经典前端基础书籍",
      "filename": "book-1234567890-123456789.pdf",
      "originalname": "JavaScript高级程序设计.pdf",
      "path": "uploads/book-1234567890-123456789.pdf",
      "size": 2048576,
      "status": "active",
      "createdBy": "507f1f77bcf86cd799439001",
      "createdAt": "2026-04-21T10:30:00Z",
      "updatedAt": "2026-04-21T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### POST /api/books

上传新图书。

请求类型：`multipart/form-data`

表单字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `pdf` | 是 | PDF 文件，最大 100MB |
| `title` | 是 | 书名 |
| `author` | 是 | 作者 |
| `category` | 是 | 分类 |
| `publisher` | 否 | 出版社 |
| `isbn` | 否 | ISBN |
| `coverUrl` | 否 | 封面图 URL |
| `description` | 否 | 简介 |

成功响应：

```json
{
  "book": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "JavaScript 高级程序设计",
    "author": "Nicholas C. Zakas",
    "category": "前端",
    "filename": "book-1234567890-123456789.pdf",
    "status": "active"
  }
}
```

### PATCH /api/books/:id

更新图书信息或状态。

可更新字段：

- `title`
- `author`
- `publisher`
- `isbn`
- `category`
- `coverUrl`
- `description`
- `status`

请求示例：

```json
{
  "status": "inactive",
  "description": "临时下架维护"
}
```

成功响应：

```json
{
  "book": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "inactive",
    "updatedAt": "2026-04-21T10:45:00Z"
  }
}
```

### DELETE /api/books/:id

安全归档图书。

说明：

- 如果该书仍有用户持有，则只会把图书状态改为 `archived`
- 已存在但未使用的兑换码会被批量作废
- 已持有用户仍可继续阅读
- 如果没有任何持有人，服务端会额外清理源 PDF 文件

成功响应：

```json
{
  "message": "Book archived successfully",
  "book": {
    "id": "507f1f77bcf86cd799439012",
    "status": "archived"
  }
}
```

### GET /api/books/:bookId/read

获取当前登录用户对某本书的阅读访问权限和阅读状态。

前提：

- 该书必须已经在用户书架中
- 图书记录必须仍然存在

成功响应：

```json
{
  "book": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "JavaScript 高级程序设计",
    "filename": "book-1234567890-123456789.pdf",
    "status": "inactive"
  },
  "readingState": {
    "progress": 27.4,
    "lastPage": 32,
    "lastReadAt": "2026-04-21T10:12:00Z",
    "bookmarks": [
      {
        "id": "1713684780000",
        "page": 20,
        "label": "第 20 页",
        "createdAt": "2026-04-21T10:10:00Z"
      }
    ]
  }
}
```

错误响应：

```json
{
  "message": "Book not found in your bookshelf"
}
```

```json
{
  "message": "Book is unavailable"
}
```

---

## 兑换码模块

### POST /api/redeem-codes

管理员为某本图书批量生成兑换码。

请求体：

```json
{
  "bookId": "507f1f77bcf86cd799439012",
  "count": 5,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

说明：

- `count` 最小 1，最大 100
- `expiresAt` 可选
- 图书必须是 `active` 才能生成兑换码

成功响应：

```json
{
  "redeemCodes": [
    {
      "id": "507f1f77bcf86cd799439021",
      "code": "A1B2C3D4",
      "status": "unused",
      "expiresAt": "2026-12-31T23:59:59.000Z"
    }
  ]
}
```

### GET /api/redeem-codes/records

管理员查看最近兑换记录。

查询参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `limit` | number | 50 | 最大 200 |

成功响应：

```json
{
  "records": [
    {
      "id": "507f1f77bcf86cd799439021",
      "code": "A1B2C3D4",
      "status": "used",
      "usedAt": "2026-04-21T11:00:00Z",
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "book": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "JavaScript 高级程序设计",
        "author": "Nicholas C. Zakas",
        "category": "前端"
      },
      "user": {
        "_id": "507f1f77bcf86cd799439011",
        "username": "testuser",
        "phone": "13800138000",
        "email": "test@example.com"
      }
    }
  ]
}
```

---

## 书架模块

### POST /api/bookshelf/redeem

普通用户使用兑换码把图书加入书架。

请求体：

```json
{
  "code": "A1B2C3D4"
}
```

成功响应：

```json
{
  "message": "Redeemed successfully",
  "book": {
    "id": "507f1f77bcf86cd799439012",
    "title": "JavaScript 高级程序设计",
    "author": "Nicholas C. Zakas",
    "category": "前端",
    "coverUrl": "https://example.com/cover.jpg",
    "status": "active"
  }
}
```

常见错误：

```json
{
  "message": "Redeem code not found"
}
```

```json
{
  "message": "Redeem code has already been used"
}
```

```json
{
  "message": "Book cannot be redeemed"
}
```

```json
{
  "message": "Book is already in your bookshelf"
}
```

### GET /api/bookshelf

获取当前用户书架、分类统计和最近阅读。

成功响应：

```json
{
  "bookshelf": [
    {
      "id": "507f1f77bcf86cd799439012",
      "shelfId": "507f1f77bcf86cd799439099",
      "title": "JavaScript 高级程序设计",
      "author": "Nicholas C. Zakas",
      "category": "前端",
      "coverUrl": "https://example.com/cover.jpg",
      "description": "经典前端基础书籍",
      "status": "active",
      "progress": 27.4,
      "lastPage": 32,
      "lastReadAt": "2026-04-21T10:12:00Z",
      "addedAt": "2026-04-21T09:01:00Z",
      "bookmarks": []
    }
  ],
  "categories": [
    {
      "name": "前端",
      "count": 1
    }
  ],
  "recentReads": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "JavaScript 高级程序设计",
      "lastReadAt": "2026-04-21T10:12:00Z"
    }
  ]
}
```

### PUT /api/bookshelf/:bookId/progress

同步阅读状态。

请求体：

```json
{
  "progress": 27.4,
  "lastPage": 32,
  "bookmarks": [
    {
      "id": "1713684780000",
      "page": 20,
      "label": "第 20 页",
      "createdAt": "2026-04-21T10:10:00Z"
    }
  ]
}
```

说明：

- `progress` 会被限制在 0 到 100
- `lastPage` 最小为 1
- `bookmarks` 必须是数组
- 成功调用后会自动更新 `lastReadAt`

成功响应：

```json
{
  "message": "Reading state updated successfully"
}
```

### DELETE /api/bookshelf/:bookId

当前版本不支持把已兑换图书从书架移除。

说明：

- 兑换成功后视为永久持有
- 如需隐藏书架项目，应在后续版本引入“隐藏”能力，而不是删除持有关系

当前响应：

```json
{
  "message": "Redeemed books are permanently owned and cannot be removed"
}
```

---

## 统一错误格式

```json
{
  "message": "错误描述信息"
}
```

---

## 常见错误汇总

| message | 状态码 | 场景 |
| --- | --- | --- |
| `Phone number already exists` | 400 | 注册时手机号重复 |
| `Email already exists` | 400 | 注册时邮箱重复 |
| `Invalid credentials` | 400 | 登录账号或密码错误 |
| `Missing authorization header` | 401 | 缺少 token |
| `Invalid token` | 401 | token 非法 |
| `Token expired` | 401 | token 过期 |
| `Forbidden` | 403 | 非管理员调用管理员接口 |
| `Too many authentication requests, please try again later` | 429 | 注册或登录请求过于频繁 |
| `Title, author and category are required` | 400 | 上传图书缺少必填字段 |
| `PDF file is required` | 400 | 未上传 PDF 文件 |
| `Only PDF files are allowed` | 400 | 上传文件不是 PDF |
| `Book not found` | 404 | 图书不存在 |
| `Inactive books cannot generate redeem codes` | 400 | 图书不是 `active` 却尝试生成兑换码 |
| `Redeem code not found` | 404 | 兑换码不存在 |
| `Redeem code has expired` | 400 | 兑换码已过期 |
| `Redeem code has already been used` | 400 | 兑换码已使用 |
| `Book cannot be redeemed` | 400 | 图书不可兑换 |
| `Book is already in your bookshelf` | 400 | 已持有该书 |
| `Book not found in your bookshelf` | 404 | 未持有该书却尝试阅读或同步进度 |
| `Book is unavailable` | 404 | 图书已归档不可读 |
| `Server configuration error` | 500 | 未配置 `JWT_SECRET` |

---

## 最小调用顺序建议

1. `POST /api/auth/register` 注册普通用户
2. 数据库里把某个用户改成 `admin`
3. `POST /api/auth/login` 管理员登录
4. `POST /api/books` 上传图书
5. `POST /api/redeem-codes` 生成兑换码
6. `POST /api/auth/register` 再注册一个普通用户
7. `POST /api/auth/login` 普通用户登录
8. `POST /api/bookshelf/redeem` 兑换图书
9. `GET /api/bookshelf` 查看书架
10. `GET /api/books/:bookId/read` 进入阅读页
11. `PUT /api/bookshelf/:bookId/progress` 同步阅读状态

