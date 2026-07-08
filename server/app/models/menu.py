"""
系统菜单表 ORM 模型。

用处：
  - 存储后台菜单树（目录/菜单/按钮），供菜单管理 CRUD 和动态路由下发。
  - 字段命名与前端 editMenu.vue、index.vue 展示字段对齐。

为什么 menu_type 用整型 0/1/2：
  - 与前端表格、表单约定一致：0 目录、1 菜单、2 按钮（权限点）。
  - 按钮类型菜单的 name 字段即 v-auth 权限标识，如 api/v1/system/menu/add。
"""

from sqlalchemy import ForeignKey, Integer, String, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# 菜单-角色多对多关联表；按钮权限也可挂角色，控制不同角色可见的操作
menu_role_table = Table(
    "menu_roles",
    Base.metadata,
    Column("menu_id", Integer, ForeignKey("menus.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class Menu(Base):
    """系统菜单，对应表 `menus`。"""

    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    pid: Mapped[int] = mapped_column(Integer, default=0, index=True, comment="父菜单 id，0 表示顶级")
    menu_type: Mapped[int] = mapped_column(Integer, default=0, comment="0 目录 1 菜单 2 按钮")
    title: Mapped[str] = mapped_column(String(100), nullable=False, comment="菜单名称")
    name: Mapped[str] = mapped_column(String(100), default="", comment="路由 name 或按钮权限标识")
    path: Mapped[str] = mapped_column(String(200), default="", comment="路由 path")
    component: Mapped[str] = mapped_column(String(200), default="", comment="Vue 组件路径")
    redirect: Mapped[str] = mapped_column(String(200), default="", comment="重定向地址")
    icon: Mapped[str] = mapped_column(String(100), default="", comment="菜单图标")
    weigh: Mapped[int] = mapped_column(Integer, default=0, comment="排序，越小越靠前")
    is_hide: Mapped[int] = mapped_column(Integer, default=0, comment="0 显示 1 隐藏")
    is_cached: Mapped[int] = mapped_column(Integer, default=1, comment="是否缓存页面")
    is_affix: Mapped[int] = mapped_column(Integer, default=0, comment="是否固定 tags")
    is_link: Mapped[int] = mapped_column(Integer, default=0, comment="是否外链")
    is_iframe: Mapped[int] = mapped_column(Integer, default=0, comment="是否内嵌 iframe")
    link_url: Mapped[str] = mapped_column(String(500), default="", comment="外链/内嵌地址")

    roles: Mapped[list["Role"]] = relationship(secondary=menu_role_table, lazy="selectin")
