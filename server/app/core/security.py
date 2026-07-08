"""
JWT 签发与密码安全模块。

用处：
  - 密码 bcrypt 哈希/校验，注册和登录时使用。
  - JWT Token 的创建与解析，登录成功后签发、后续接口校验身份。

为什么这么做：
  - 密码绝不能明文存储或传输后原样入库，bcrypt 是业界标准的慢哈希算法。
  - JWT 无状态：服务端不需要存 Session，前端每次请求带 Bearer Token 即可，
    与 Vue 前端 request.ts 的 Authorization 头约定一致。
  - 使用 python-jose 而非手写 JWT，避免算法/过期时间等安全细节出错。
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

# CryptContext 统一管理哈希算法，后续若要升级算法可在此配置 deprecated 迁移策略
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    """
    将明文密码转为 bcrypt 哈希。

    用处：用户注册、修改密码时调用，只把 hash 写入数据库。
    原因：即使数据库泄露，攻击者也无法直接拿到原始密码。
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """
    校验明文密码是否与数据库中的哈希匹配。

    用处：登录时验证用户输入的密码是否正确。
    原因：bcrypt 校验是单向对比，不需要（也不能）从 hash 反推明文。
    """
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str | int, expires_minutes: int | None = None) -> str:
    """
    签发 JWT 访问令牌。

    用处：登录成功后返回给前端，前端存入 Session 并在后续请求中携带。
    参数 subject：通常为用户 id，写入 Token 的 sub 字段，第 4 步解析身份时使用。
    原因：Token 自带过期时间，服务端无需维护登录态表（Redis 黑名单可后续扩展）。
    """
    expire_delta = timedelta(minutes=expires_minutes or settings.jwt_access_token_expire_minutes)
    expire_at = datetime.now(timezone.utc) + expire_delta
    payload = {"sub": str(subject), "exp": expire_at}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    解析并验证 JWT Token。

    用处：第 4 步鉴权中间件 get_current_user 将调用此函数提取用户 id。
    返回 None 表示 Token 无效或过期，调用方应返回 401。
    原因：集中处理 JWTError，避免每个接口重复 try/except。
    """
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
