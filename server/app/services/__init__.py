"""
业务逻辑服务包（services）。

用处：
  - 存放与 HTTP 无关的业务处理函数，如用户注册、密码校验、Token 签发等。
  - 第 3 步起 auth_service.py 会放这里，api 层只负责接收请求和返回响应。

为什么与 api/ 分开：
  - 路由层应薄：解析参数、调用 service、返回结果；复杂逻辑不应堆在路由函数里。
  - service 可独立单元测试，无需启动 HTTP 服务或 mock Request 对象。
  - 类比前端 composables/ 或 services/，把可复用业务逻辑从「页面/路由」中抽离。
"""
