"""
认证相关 API：登录、注册、退出。

用处：
  - POST /api/v1/system/login  — 对接前端 account.vue 登录表单
  - POST /api/v1/system/register — 本地开发注册新用户
  - GET  /api/v1/system/logout — 前端退出登录调用（当前为无状态 JWT，服务端仅返回成功）

为什么路径带 /api/v1/system 前缀：
  - 与 client/src/api/login/index.ts 中 url 完全一致，前端改 VITE_API_URL 即可联调。
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import fail, success
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import (
    authenticate_user,
    build_login_data,
    create_user,
    get_user_by_username,
)

router = APIRouter()


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    POST /api/v1/system/login — 用户登录。

    请求体：{ username, password, verifyCode?, verifyKey? }
    成功返回：{ code: 0, data: { token, userInfo, menuList, permissions }, message }
    失败返回：{ code: 1, message: "用户名或密码错误" }（HTTP 200，与前端拦截器约定一致）

    原因：前端 request.ts 只看 response.data.code，不看 HTTP 状态码，
          所以业务错误也返回 200 + 非 0 code。
    """
    user = authenticate_user(db, body.username, body.password)
    if user is None:
        return fail(1, "用户名或密码错误")
    if not user.is_active:
        return fail(1, "账号已禁用，请联系管理员")

    login_data = build_login_data(user, db)
    return success(login_data.model_dump(by_alias=True))


@router.post("/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    POST /api/v1/system/register — 用户注册（本地开发用）。

    请求体：{ username, password }
    成功返回：{ code: 0, data: { id, username }, message: "注册成功" }

    原因：第 3 步需要能创建测试账号；生产环境可关闭或加验证码/邀请码。
    """
    if get_user_by_username(db, body.username):
        return fail(1, "用户名已存在")

    user = create_user(db, body.username, body.password)
    return success({"id": user.id, "username": user.username}, "注册成功")


@router.get("/logout")
def logout():
    """
    GET /api/v1/system/logout — 退出登录。

    用处：前端 logout() 调用此接口；当前 JWT 无状态，服务端不维护 Token 黑名单。
    原因：前端退出主要靠 Session.clear() 清除本地 Token；
          第 5 步可接入 Redis 实现 Token 黑名单，使已退出 Token 立即失效。
    """
    return success(None, "退出成功")
