"""
用户表 ORM 模型。

用处：
  - 映射数据库 users 表，存储系统登录账号信息。
  - 第 3 步登录/注册接口将对此表进行增删改查。

为什么这样设计字段：
  - password_hash 而非 password：密码必须 bcrypt 哈希后存储，明文入库是严重安全漏洞。
  - username 唯一 + 索引：登录时按用户名查询频繁，索引加速；唯一约束防止重复注册。
  - is_active：支持禁用账号而不删除数据，保留审计记录。
  - created_at / updated_at：记录账号生命周期，便于排查问题和运营统计。
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    """
    系统用户表模型，对应数据库表 `users`。

    用处：定义用户数据的表结构，供 SQLAlchemy 建表和 ORM 查询使用。
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,   # 用户名全局唯一，注册时数据库层兜底防重复
        index=True,    # 登录按 username 查询，索引避免全表扫描
        nullable=False,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),   # bcrypt 哈希约 60 字符，255 留足扩展空间
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,  # 新用户默认启用
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),  # 由数据库写入创建时间，避免应用服务器时钟不一致
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),  # 每次 UPDATE 自动刷新，无需业务代码手动维护
        nullable=False,
    )
