# API 文档

## 认证相关接口

### 注册用户
- **URL**: `/api/auth/register`
- **方法**: POST
- **请求体**:
  ```json
  {
    "username": "用户名",
    "email": "邮箱地址",
    "password": "密码"
  }
  ```
- **成功响应**:
  ```json
  {
    "message": "User registered successfully"
  }
  ```

### 用户登录
- **URL**: `/api/auth/login`
- **方法**: POST
- **请求体**:
  ```json
  {
    "email": "邮箱地址",
    "password": "密码"
  }
  ```
- **成功响应**:
  ```json
  {
    "user": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱地址"
    },
    "token": "JWT令牌"
  }
  ```

## PDF 相关接口

### 上传 PDF
- **URL**: `/api/pdf/upload`
- **方法**: POST
- **请求头**:
  ```
  Authorization: Bearer JWT令牌
  ```
- **请求体**: 表单数据，包含名为 `pdf` 的文件字段
- **成功响应**:
  ```json
  {
    "pdf": {
      "_id": "PDF文件ID",
      "filename": "存储的文件名",
      "originalname": "原始文件名",
      "path": "文件路径",
      "size": 文件大小,
      "userId": "用户ID",
      "createdAt": "创建时间"
    }
  }
  ```

### 获取 PDF 列表
- **URL**: `/api/pdf/list`
- **方法**: GET
- **请求头**:
  ```
  Authorization: Bearer JWT令牌
  ```
- **成功响应**:
  ```json
  {
    "pdfs": [
      {
        "_id": "PDF文件ID",
        "filename": "存储的文件名",
        "originalname": "原始文件名",
        "path": "文件路径",
        "size": 文件大小,
        "userId": "用户ID",
        "createdAt": "创建时间"
      },
      ...
    ]
  }
  ```

### 获取单个 PDF
- **URL**: `/api/pdf/:id`
- **方法**: GET
- **请求头**:
  ```
  Authorization: Bearer JWT令牌
  ```
- **成功响应**:
  ```json
  {
    "pdf": {
      "_id": "PDF文件ID",
      "filename": "存储的文件名",
      "originalname": "原始文件名",
      "path": "文件路径",
      "size": 文件大小,
      "userId": "用户ID",
      "createdAt": "创建时间"
    }
  }
  ```

### 删除 PDF
- **URL**: `/api/pdf/:id`
- **方法**: DELETE
- **请求头**:
  ```
  Authorization: Bearer JWT令牌
  ```
- **成功响应**:
  ```json
  {
    "message": "PDF deleted successfully"
  }
  ```
