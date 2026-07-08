"""
用户相关 API（需登录）。

用处：
  - GET /api/v1/system/get/info       — 获取当前用户信息（前端 getUserInfo）
  - GET /api/v1/system/user/getUserMenus — 刷新菜单与权限（页面刷新时 backEnd.ts 调用）

为什么这些接口需要鉴权：
  - 返回的是「当前登录用户」的私有数据，必须校验 Token 防止越权访问他人信息。
  - 无 Token 或 Token 过期时返回 code: 401，触发前端跳转登录页。
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import success
from app.models.user import User
from app.services.auth_service import build_user_info
from app.services.menu_service import get_login_menu_payload

router = APIRouter()


@router.get("/get/info")
def get_current_user_info(user: User = Depends(get_current_user)):
    """
    GET /api/v1/system/get/info — 获取当前登录用户信息。

    用处：前端 stores/userInfo 或页面刷新后拉取最新用户资料。
    需 Header：Authorization: Bearer <token>
    成功返回：{ code: 0, data: { id, userName, userNickname, ... } }
    """
    user_info = build_user_info(user)
    return success(user_info.model_dump(by_alias=True))


@router.get("/user/getUserMenus")
def get_user_menus(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    GET /api/v1/system/user/getUserMenus — 获取当前用户的菜单与按钮权限。

    用处：前端 backEnd.ts 在页面刷新时调用，重建动态路由和 permissions。
    需 Header：Authorization: Bearer <token>
    成功返回：{ code: 0, data: { menuList, permissions } }

    原因：登录时虽返回过 menuList，但刷新后 Session 里可能有 menu，
          若缺失则调此接口补全；数据从 menus 表读取，与菜单管理页一致。
    """
    menu_list, permissions = get_login_menu_payload(db)
    return success({
        "menuList": menu_list,
        "permissions": permissions,
    })
