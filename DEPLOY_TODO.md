# 部署与安全待办

以最小改造成本完成个人项目上线：优先采用托管 Node 服务 + MongoDB Atlas，保留当前 Express 架构；先完成环境变量、数据库、域名与安全基线，再评估是否把本地 uploads 迁移到对象存储。当前不直接推进纯 Serverless，避免在文件存储和上传链路上增加额外复杂度。

## Steps

1. [已完成] 准备生产环境变量：已补充 [backend/.env.example](backend/.env.example) 并明确 `MONGO_URI`、`JWT_SECRET`、`PORT`、`NODE_ENV`、`FRONTEND_URL` 的生产用法，要求只通过平台环境变量注入，禁止写入仓库。
2. [已完成] 创建 MongoDB Atlas 实例并启用自动备份；为应用创建最小权限数据库账号，只授予 `pdf-reader` 数据库读写权限。仓库内已新增 [backend/MONGODB_ATLAS_SETUP.md](backend/MONGODB_ATLAS_SETUP.md) 作为执行手册。
3. [已完成] 选择托管 Node 平台并完成后端首次部署的代码与文档适配：已新增健康检查入口与更稳的上传目录处理，并新增 [backend/HOSTED_NODE_DEPLOYMENT.md](backend/HOSTED_NODE_DEPLOYMENT.md) 说明首次部署步骤。
4. [已完成] 配置生产域名与 HTTPS 的文档适配已补充：已新增 [backend/DOMAIN_AND_HTTPS_SETUP.md](backend/DOMAIN_AND_HTTPS_SETUP.md)，明确前端域名、后端域名、HTTPS 和 `FRONTEND_URL` 的配置关系。
5. [已完成] 做最小安全加固的代码与文档适配：已启用基础安全响应头、认证接口限流、请求体大小限制，并新增 [backend/SECURITY_BASELINE.md](backend/SECURITY_BASELINE.md) 说明仍需在部署侧继续完成 `JWT_SECRET`、数据库权限和 HTTPS 配置。
6. [已完成] 进行一次完整业务验收的文档适配：已新增 [backend/BUSINESS_ACCEPTANCE_CHECKLIST.md](backend/BUSINESS_ACCEPTANCE_CHECKLIST.md)，覆盖普通用户注册登录、管理员提权、图书上传、生成兑换码、用户兑换、阅读进度同步和权限边界验证。
7. [已完成] 补充运行维护能力的文档适配：已新增 [backend/OPERATIONS_RUNBOOK.md](backend/OPERATIONS_RUNBOOK.md)，覆盖平台日志查看、健康检查、异常重启、基础告警和数据库备份恢复说明。
8. [已完成] 第二阶段对象存储迁移的文档适配已补充：已新增 [backend/OBJECT_STORAGE_MIGRATION_PLAN.md](backend/OBJECT_STORAGE_MIGRATION_PLAN.md)，明确当前本地 `uploads` 与未来对象存储的迁移边界、步骤和风险。
9. [已完成] Serverless 评估文档已补充：已新增 [backend/SERVERLESS_EVALUATION.md](backend/SERVERLESS_EVALUATION.md)，明确对象存储迁移完成后再评估函数化的判断标准、维度和推荐顺序。

## Relevant Files

- [backend/index.js](backend/index.js) — 当前服务入口、CORS 策略、`uploads` 静态目录暴露点。
- [backend/config/db.js](backend/config/db.js) — MongoDB 连接与索引初始化入口。
- [backend/controllers/books.js](backend/controllers/books.js) — 当前 PDF 上传写本地磁盘的核心逻辑，后续对象存储迁移从这里切入。
- [backend/middleware/auth.js](backend/middleware/auth.js) — JWT 密钥依赖点，部署时必须确保环境变量配置正确。
- [backend/MONGODB_ATLAS_SETUP.md](backend/MONGODB_ATLAS_SETUP.md) — Atlas 集群、应用账号、白名单和连接串配置手册。
- [backend/HOSTED_NODE_DEPLOYMENT.md](backend/HOSTED_NODE_DEPLOYMENT.md) — 托管 Node 平台首次部署步骤与常见坑说明。
- [backend/DOMAIN_AND_HTTPS_SETUP.md](backend/DOMAIN_AND_HTTPS_SETUP.md) — 生产域名、HTTPS 和 `FRONTEND_URL` 配置关系说明。
- [backend/SECURITY_BASELINE.md](backend/SECURITY_BASELINE.md) — 当前已落地的最小安全基线和后续增强方向。
- [backend/BUSINESS_ACCEPTANCE_CHECKLIST.md](backend/BUSINESS_ACCEPTANCE_CHECKLIST.md) — 从 0 到完整业务闭环的手动验收步骤。
- [backend/OPERATIONS_RUNBOOK.md](backend/OPERATIONS_RUNBOOK.md) — 上线后日志、重启、告警和恢复的运行维护手册。
- [backend/OBJECT_STORAGE_MIGRATION_PLAN.md](backend/OBJECT_STORAGE_MIGRATION_PLAN.md) — 从本地 `uploads` 迁移到对象存储的阶段性方案。
- [backend/SERVERLESS_EVALUATION.md](backend/SERVERLESS_EVALUATION.md) — 在什么前提下再评估 Serverless 的判断指南。
- [PDF-Reader_frontend/src/utils/http.js](PDF-Reader_frontend/src/utils/http.js) — 前端 API 与资源地址入口，后续切对象存储时需要同步调整。
- [docs/api/API_SPEC.md](docs/api/API_SPEC.md) — 上线联调用的接口基准文档。

## Verification

1. 平台部署后，访问健康接口或基础路由时后端可正常返回，不出现 MongoDB 连接失败。
2. Atlas 中可看到 `users`、`books`、`redeemcodes`、`bookshelfitems` 集合和预期索引。
3. 生产环境下前端能正常跨域访问后端，且非授权来源不会被放行。
4. 管理员和普通用户完整业务闭环可跑通一次。
5. 重启服务后，数据库、认证、图书上传与阅读流程仍然正常。
6. 备份恢复流程至少有文字说明，确保误删数据时知道如何回滚。

## Decisions

- 当前阶段优先“托管 Node 服务 + MongoDB Atlas”，不先做纯 Serverless。
- 当前阶段允许继续使用本地 `uploads` 以降低改造成本，但把对象存储迁移明确为第二阶段事项。
- 安全重点优先级高于架构时髦度，先解决环境变量、数据库权限、HTTPS、备份和日志问题。

## Further Considerations

1. 托管平台选择建议：优先选对 Node/Express 直接支持、环境变量和日志能力完整的平台；不要先按最便宜选，先看部署心智成本。
2. 对象存储迁移建议：若后续准备切 Serverless，应先做对象存储，再谈函数化，否则上传和文件访问会反复返工。