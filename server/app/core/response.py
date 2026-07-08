"""
统一 API 响应格式模块。

用处：
  - 定义与 Vue 前端 request.ts 一致的响应结构：{ code, data, message }。
  - 提供 success() / fail() 快捷函数，所有接口返回相同格式，前端拦截器才能统一处理。

为什么这么做：
  - 前端 request.ts 约定 code === 0 为成功、code === 401 跳转登录；
    后端若各接口返回格式不一致，前端拦截器无法复用。
  - 用函数而非直接拼 dict，减少字段拼写错误，也方便后续加日志、国际化等。
  - ApiResponse 泛型模型可用于 OpenAPI 文档生成，让 Swagger 展示准确的响应结构。
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """
    标准 API 响应模型（用于类型标注和文档生成）。

    用处：在需要严格类型检查或生成 OpenAPI schema 时使用。
    字段说明：
      - code: 业务状态码，0 成功，非 0 失败（401 表示未登录，与前端约定一致）
      - data: 实际业务数据，可以是对象、列表或 null
      - message: 给人看的提示信息，失败时前端会弹窗展示
    """

    code: int = 0
    data: T | None = None
    message: str = "success"


def success(data: Any = None, message: str = "success") -> dict[str, Any]:
    """
    构造成功响应。

    用处：接口正常返回时调用，例如 `return success(user_dict)`。
    原因：统一 code=0，前端无需判断多种成功格式。
    """
    return {"code": 0, "data": data, "message": message}


def fail(code: int, message: str, data: Any = None) -> dict[str, Any]:
    """
    构造失败响应。

    用处：业务校验失败、权限不足等场景，例如 `return fail(401, "未登录")`。
    原因：显式传入 code，与前端拦截器的分支逻辑（401 跳登录、其他弹错误）对齐。
    """
    return {"code": code, "data": data, "message": message}
