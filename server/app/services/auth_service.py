"""
认证业务逻辑服务。

用处：
  - 封装用户注册、登录校验、登录响应组装等与 HTTP 无关的逻辑。
  - api/auth.py 路由层只负责接收请求、调用本模块、返回统一响应。

为什么单独抽 service：
  - 路由函数保持简短，业务逻辑可独立测试（无需 mock Request）。
  - 注册/登录/seed 默认用户共用同一套密码哈希和用户查询逻辑，避免重复代码。
"""

import time

from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginDataOut, UserInfoOut
from app.services.menu_service import get_login_menu_payload


def get_user_by_username(db: Session, username: str) -> User | None:
    """按用户名查询用户，登录和注册防重复时使用。"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """
    按主键 id 查询用户。

    用处：JWT 鉴权时根据 Token 中的 sub（用户 id）加载用户对象。
    原因：Token 只存 id 不存用户名，避免用户改名后 Token 与库中数据不一致。
    """
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, username: str, plain_password: str) -> User:
    """
    创建新用户并写入数据库。

    用处：注册接口和启动时 seed 默认管理员账号。
    原因：密码哈希在写入前完成，数据库层永远看不到明文密码。
    """
    user = User(
        username=username,
        password_hash=hash_password(plain_password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed_default_admin(db: Session) -> None:
    """
    启动时确保存在默认管理员账号 admin / admin123。

    用处：本地开发开箱即用，无需手动注册即可登录前端。
    原因：仅当 admin 不存在时插入，避免重复启动重复创建。
    """
    if get_user_by_username(db, "admin") is None:
        create_user(db, "admin", "admin123")


def authenticate_user(db: Session, username: str, plain_password: str) -> User | None:
    """
    校验用户名和密码，返回用户对象或 None。

    用处：登录接口核心校验逻辑。
    原因：用户名不存在和密码错误返回相同结果，由调用方统一提示「用户名或密码错误」，
          避免攻击者通过不同错误信息枚举有效用户名。
    """
    user = get_user_by_username(db, username)
    if user is None or not verify_password(plain_password, user.password_hash):
        return None
    return user


def build_user_info(user: User) -> UserInfoOut:
    """
    将 ORM 用户对象转为前端 userInfo 结构。

    用处：登录成功后填充 res.data.userInfo。
    原因：前端字段为 camelCase 且包含 roles、senbei 等扩展字段，
          在 service 层做映射，避免 API 路由里手写 dict。
    """
    return UserInfoOut(
        id=user.id,
        userName=user.username,
        userNickname=user.username,
        avatar="",
        roles=["admin"],
        authBtnList=[],
        senbei=0,
        time=int(time.time() * 1000),
    )


def build_login_data(user: User, db: Session) -> LoginDataOut:
    """
    组装完整的登录成功响应 data。

    用处：login 接口 return success(build_login_data(user, db).model_dump(by_alias=True))。
    原因：Token、userInfo、menuList 一次打包，menuList 从数据库读取，与菜单管理保持一致。
    """
    token = create_access_token(user.id)
    menu_list, permissions = get_login_menu_payload(db)
    return LoginDataOut(
        token=token,
        userInfo=build_user_info(user),
        menuList=menu_list,
        permissions=permissions,
    )
