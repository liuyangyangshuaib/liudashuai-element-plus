"""
数据库连接与会话管理模块。

用处：
  - 创建 SQLAlchemy 引擎和 Session 工厂，连接本地 SQLite（或后续 PostgreSQL）。
  - 提供 get_db() 依赖注入函数，供 API 路由安全地获取/释放数据库连接。
  - 提供 init_db() 在启动时自动建表。

为什么这么做：
  - SQLAlchemy 是 Python 生态最成熟的 ORM，与 FastAPI 官方文档推荐一致。
  - 每个 HTTP 请求独立 Session，请求结束立即 close，防止连接泄漏。
  - 开发阶段用 create_all 快速建表；表结构复杂后应改用 Alembic 做版本化迁移。
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# SQLite 默认禁止跨线程共享连接；FastAPI 每个请求可能在不同线程/协程处理，
# 必须设置 check_same_thread=False，否则并发请求时会抛 OperationalError。
# PostgreSQL/MySQL 不需要此参数，所以按 database_url 前缀做条件判断。
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,  # debug=True 时在控制台打印 SQL，方便开发调试；生产应关闭
)

# SessionLocal 是会话工厂，不在模块级直接创建 Session，
# 原因：Session 有状态且非线程安全，必须在每个请求内单独创建。
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """
    所有 ORM 模型的基类。

    用处：models/user.py 等表模型继承此类，SQLAlchemy 才能收集元数据并执行建表。
    原因：集中定义 DeclarativeBase，避免每个模型文件各自声明导致 metadata 分裂。
    """


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI 依赖注入：为每个请求提供数据库会话。

    用处：在路由函数中写 `db: Session = Depends(get_db)` 即可操作数据库。
    原因：
      - yield 之前创建 Session，之后（finally）关闭，保证异常时也能释放连接。
      - autocommit=False：由业务代码显式 commit，避免误提交半成品数据。
      - 这是 FastAPI 官方推荐的数据库依赖写法，与前端每次请求独立的状态模型一致。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    根据已注册的 ORM 模型，在数据库中创建缺失的表。

    用处：服务启动时自动确保 users 等表存在，无需手动执行 SQL。
    原因：
      - import app.models 是为了触发模型类注册到 Base.metadata（副作用导入）。
      - create_all 只创建不存在的表，不会删除或修改已有表结构。
      - 生产环境表结构变更应走 Alembic 迁移，避免 create_all 与线上 schema 不一致。
    """
    import app.models  # noqa: F401 — 确保模型已注册到 Base.metadata

    Base.metadata.create_all(bind=engine)
    _seed_default_data()


def _seed_default_data() -> None:
    """
    写入开发环境默认数据（如 admin 账号）。

    用处：首次启动后可直接用 admin / admin123 登录前端。
    原因：在 init_db 建表后执行，与建表逻辑同生命周期，避免单独跑 seed 脚本。
    """
    from app.services.auth_service import seed_default_admin
    from app.services.menu_service import import_production_menus_if_needed

    db = SessionLocal()
    try:
        seed_default_admin(db)
        import_production_menus_if_needed(db)
    finally:
        db.close()
