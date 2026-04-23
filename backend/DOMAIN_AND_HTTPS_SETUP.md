# Domain and HTTPS Setup

这份文档专门解释“前端域名、后端域名、HTTPS、`FRONTEND_URL`”之间的关系，尽量用后端新手也能直接照着配的方式来写。

## 1. 先理解这几个地址分别是什么

对于你这个项目，通常会有两个地址：

1. 前端地址：用户在浏览器里真正打开的页面地址
2. 后端地址：前端发送 API 请求的服务地址

举例：

- 前端：`https://reader.example.com`
- 后端：`https://api.example.com`

你可以把它理解成：

- 前端负责显示页面
- 后端负责注册、登录、上传、兑换、阅读数据接口

## 2. `FRONTEND_URL` 到底应该写谁

在当前后端代码里，生产环境下 CORS 会读取 `FRONTEND_URL`。

所以这里要写的是：

**前端页面实际访问的域名**

不是后端域名，也不是 MongoDB 地址。

正确示例：

```env
FRONTEND_URL=https://reader.example.com
```

错误示例：

```env
FRONTEND_URL=https://api.example.com
```

如果你写错了，最直接的结果通常是：

- 前端页面打开了
- 但调用后端接口时报跨域错误

## 3. 为什么生产环境一定要用 HTTPS

HTTPS 的作用，你可以先简单理解成：

1. 浏览器和服务器之间的数据会加密
2. token、登录请求、用户数据不会明文在网络里传输
3. 浏览器对 HTTPS 站点的信任更高

对于当前项目，登录和鉴权都依赖 token，所以生产环境必须优先使用 HTTPS。

## 4. 当前项目推荐的域名结构

最容易理解的方式是前后端分两个子域名：

- 前端：`https://reader.example.com`
- 后端：`https://api.example.com`

优点是：

1. 前后端职责清晰
2. 配 CORS 更直观
3. 以后如果要接 CDN、对象存储、独立监控，也更容易拆分

## 5. 生产环境最小配置示例

后端平台环境变量建议至少这样写：

```env
MONGO_URI=mongodb+srv://pdf_reader_app:your_strong_password@cluster0.xxxxx.mongodb.net/pdf-reader?retryWrites=true&w=majority
JWT_SECRET=替换成强随机字符串
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://reader.example.com
```

这里要特别注意：

- `NODE_ENV=production`
- `FRONTEND_URL` 必须是前端域名
- 后端真实访问地址由部署平台分配或你绑定的 API 域名决定

## 6. 前端需要知道什么

前端请求后端时，需要把 API 基础地址改成线上后端域名。

也就是说，前端最终请求的目标应该是类似：

```text
https://api.example.com/api/auth/login
```

而不是本地开发时的：

```text
http://127.0.0.1:5000/api/auth/login
```

如果前端还是请求本地地址，线上页面当然不会成功。

## 7. 新手最容易搞错的 4 件事

### 1. 把 `FRONTEND_URL` 写成后端域名

这是最常见错误。

记忆方式：

- `FRONTEND_URL` = 浏览器地址栏里用户真正打开的前端页面地址

### 2. 前端是 HTTPS，后端却还是 HTTP

这种情况下浏览器很容易拦截请求，或者产生混合内容问题。

所以推荐：

- 前端 HTTPS
- 后端 HTTPS

不要一个加密、一个不加密。

### 3. 以为域名能替代 CORS 配置

不是。

即使你有正式域名，后端仍然要正确配置 `FRONTEND_URL`，否则浏览器照样会拦。

### 4. 忘记部署后重新联调前端 API 地址

后端部署成功，不代表前端就自动知道新的 API 域名。

上线后一定要检查前端最终请求是不是已经指向线上后端。

## 8. 最简单的上线后验证顺序

1. 先访问后端健康检查：

```text
https://api.example.com/health
```

2. 再打开前端页面：

```text
https://reader.example.com
```

3. 打开浏览器开发者工具，确认登录请求真正发到了：

```text
https://api.example.com/api/auth/login
```

4. 如果页面能打开但接口失败，优先检查：

- `FRONTEND_URL` 是否写对
- 前端 API 地址是否改成线上域名
- 前后端是否都用了 HTTPS

## 9. 给你当前项目的直接建议

如果你是第一次做上线，最稳妥的方案是：

1. 先让后端拿到一个稳定的 HTTPS 域名
2. 再让前端拿到一个稳定的 HTTPS 域名
3. 把后端的 `FRONTEND_URL` 写成前端域名
4. 再做登录、上传、兑换、阅读联调

这样排查问题最简单，也最不容易把“代码问题”和“域名配置问题”混在一起。