"""
自定义业务异常。

用处：
  - 鉴权失败等场景抛出语义化异常，由全局 handler 转为前端约定的 JSON 格式。
  - 避免在 deps.py 里直接拼 fail() 响应，保持依赖注入层职责单一。

为什么不用 FastAPI 默认 HTTPException(401)：
  - 前端 request.ts 在响应拦截器里判断的是 response.data.code === 401，
    而非 HTTP 状态码 401；若返回 HTTP 401，会走 error 分支弹「Network Error」类提示。
  - 因此鉴权失败需返回 HTTP 200 + { code: 401, message: "..." }。
"""


class AuthError(Exception):
    """
    未登录或 Token 无效时抛出。

    用处：get_current_user 依赖在 Token 缺失/过期/用户不存在时 raise AuthError()。
    原因：集中定义默认文案，与前端 ElMessageBox「登录状态已过期，请重新登录」一致。
    """

    def __init__(self, message: str = "登录状态已过期，请重新登录"):
        self.code = 401
        self.message = message
