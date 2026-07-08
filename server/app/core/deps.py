"""
FastAPI 依赖注入：当前登录用户。

用处：
  - 提供 get_current_user 依赖，供需要登录的接口通过 Depends(get_current_user) 获取用户。
  - 自动从 Authorization: Bearer <token> 请求头解析 JWT。

为什么用 HTTPBearer(auto_error=False)：
  - auto_error=True 时，无 Token 会直接返回 HTTP 403，前端无法识别 code: 401。
  - auto_error=False 让我们自行判断并抛出 AuthError，走统一异常处理返回约定格式。
"""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthError
from app.core.security import decode_access_token
from app.models.user import User
from app.services.auth_service import get_user_by_id

# 与前端 request.ts 中 Authorization: Bearer ${token} 对齐
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    解析 Token 并返回当前登录用户 ORM 对象。

    用处：在路由中声明 `user: User = Depends(get_current_user)` 即可保护接口。
    校验流程：
      1. 请求头是否带 Bearer Token
      2. JWT 是否有效、未过期
      3. Token 中的用户 id 是否仍存在于数据库且账号启用
    失败时抛出 AuthError，全局 handler 返回 { code: 401, message }。
    """
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthError("未登录，请先登录")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise AuthError()

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthError()

    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise AuthError("用户不存在或已被删除")
    if not user.is_active:
        raise AuthError("账号已禁用，请联系管理员")

    return user
