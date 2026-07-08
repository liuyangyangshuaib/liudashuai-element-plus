"""
API 路由聚合模块。

用处：
  - 汇总所有子路由（health、auth、业务 CRUD 等），在 main.py 中一次性挂载。
  - 作为路由注册的「总入口」，新增模块时只需在这里 include_router。

为什么这么做：
  - main.py 保持精简，只关心应用级配置（CORS、lifespan）。
  - 各业务路由按文件拆分（health.py、auth.py…），避免单个文件膨胀。
  - 类比前端 Vue Router 的 routes 汇总文件。
"""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.menu import router as menu_router
from app.api.user import router as user_router

# 健康检查不带业务前缀，便于运维探针直接访问 /health
api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])

# 认证接口前缀与前端 login/index.ts 中 /api/v1/system/login 对齐
api_router.include_router(auth_router, prefix="/api/v1/system", tags=["auth"])

# 需登录的用户接口，与前端 api/system/user/index.ts 路径对齐
api_router.include_router(user_router, prefix="/api/v1/system", tags=["user"])

# 菜单管理接口，与前端 api/system/menu/index.ts 路径对齐
api_router.include_router(menu_router, prefix="/api/v1/system/menu", tags=["menu"])
