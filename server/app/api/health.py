"""
健康检查相关 API。

用处：
  - 提供服务存活探测接口，供运维、Docker、负载均衡器或开发者确认后端是否正常运行。
  - 提供数据库连通性探测，快速判断 DB 配置是否正确。

为什么单独放一个文件：
  - 健康检查与业务无关，独立维护更清晰。
  - 部署时常用 /health 做探针，不应耦合在业务路由里。
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.response import success

router = APIRouter()


@router.get("/health")
def health_check():
    """
    GET /health — 服务健康检查。

    用处：确认 FastAPI 进程已启动且能正常响应，不依赖数据库。
    返回：{ "code": 0, "data": "ok", "message": "success" }
    原因：最轻量的探针，CI/CD 或手动 curl 时先用它确认服务活着。
    """
    return success("ok")


@router.get("/health/db")
def health_db_check(db: Session = Depends(get_db)):
    """
    GET /health/db — 数据库连接健康检查。

    用处：验证 DATABASE_URL 配置正确、数据库文件/服务可达、连接池正常。
    返回：{ "code": 0, "data": { "database": "connected" }, "message": "success" }
    原因：
      - 执行 SELECT 1 是业界通用的 DB 探活语句，开销极小。
      - 通过 Depends(get_db) 走与业务接口相同的连接路径，能发现真实的连接问题。
      - 若此处失败，说明问题在数据库层，而非业务代码逻辑。
    """
    db.execute(text("SELECT 1"))
    return success({"database": "connected"})
