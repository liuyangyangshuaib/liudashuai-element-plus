"""
角色表 ORM 模型。

用处：
  - 菜单管理页「角色权限」下拉选项的数据来源。
  - 后续用户-角色、菜单-角色关联都基于此表扩展。

为什么单独建表：
  - 菜单与角色是多对多关系，角色作为独立实体便于复用和权限扩展。
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Role(Base):
    """系统角色，对应表 `roles`。"""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="角色显示名")
    role_key: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, comment="角色标识，如 admin")
