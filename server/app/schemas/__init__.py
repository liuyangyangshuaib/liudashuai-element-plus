"""
Pydantic 请求/响应模型包（schemas）。

用处：
  - 定义 API 入参和出参的数据结构（类似前端 TypeScript 的 interface）。
  - 第 3 步起会在此放 LoginRequest、UserOut 等模型，做自动校验和文档生成。

为什么与 models/ 分开：
  - models/ 是数据库表结构（持久化层）；schemas/ 是 API 传输结构（接口层）。
  - 二者字段往往不同，例如 API 返回不含 password_hash，注册入参是明文 password 而非 hash。
  - 分层后修改数据库不会直接影响 API 契约，符合前后端分离的边界设计。
"""
