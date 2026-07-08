"""
ORM 数据库模型包。

用处：
  - 集中导出所有表模型，供 init_db() 导入时触发注册到 SQLAlchemy metadata。
  - 外部代码可通过 `from app.models import User` 统一引用。

为什么这么做：
  - init_db() 需要 import 本包才能让 create_all 发现所有表定义。
  - __all__ 明确公开 API，避免 from app.models import * 时引入无关符号。
  - 类比前端 TypeScript 的 types/ 目录，但这里是「数据库表结构」而非接口类型。
"""

from app.models.menu import Menu
from app.models.role import Role
from app.models.user import User

__all__ = ["User", "Menu", "Role"]
