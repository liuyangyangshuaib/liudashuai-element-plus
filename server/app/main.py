"""
FastAPI 应用入口文件。

用处：
  - 创建 FastAPI 实例，是整个后端服务的启动入口（uvicorn app.main:app）。
  - 注册全局中间件（CORS）、路由、生命周期钩子。

为什么这么做：
  - 入口与业务逻辑分离：main.py 只负责「组装」，具体接口写在 api/ 目录。
  - 使用 lifespan 在启动时初始化数据库，避免在模块导入阶段就连接 DB（导入副作用难测试）。
  - CORS 必须显式配置，否则 Vue 前端（localhost:5173）跨域请求会被浏览器拦截。
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.core.config import get_settings
from app.core.database import init_db
from app.core.exceptions import AuthError
from app.core.response import fail

# 启动时读取一次配置；get_settings 带 lru_cache，进程内复用同一份配置对象
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    应用生命周期管理。

    用处：在服务真正接受请求之前，执行一次性的启动初始化（建表等）。
    原因：FastAPI 推荐用 lifespan 替代已废弃的 @app.on_event("startup")，
          语义更清晰，且能在 yield 之后做关闭清理（后续可在这里关闭连接池）。
    """
    init_db()
    yield  # 服务运行期间挂起；关闭时 yield 之后的代码会执行（当前暂无清理逻辑）


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)


@app.exception_handler(AuthError)
async def auth_error_handler(_request, exc: AuthError):
    """
    将 AuthError 转为前端可识别的 401 业务响应。

    用处：鉴权失败时统一返回 { code: 401, message }，HTTP 状态仍为 200。
    原因：与 request.ts 拦截器逻辑对齐，触发「登录状态已过期」弹窗并跳转登录页。
    """
    return JSONResponse(status_code=200, content=fail(exc.code, exc.message))

# CORS 中间件：允许前端域名跨域访问 API
# 原因：前后端分离时，Vue 跑在 5173 端口，API 跑在 8000 端口，属于不同源，必须放行
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,  # 只允许 .env 里配置的前端地址，比 allow_origins=["*"] 更安全
    allow_credentials=True,  # 允许携带 Cookie / Authorization 头，登录后前端需要传 Token
    allow_methods=["*"],     # 允许 GET/POST/PUT/DELETE 等所有方法
    allow_headers=["*"],     # 允许自定义请求头（如 Authorization: Bearer xxx）
)

# 挂载所有 API 路由；后续新增 auth、业务模块时，在 api/__init__.py 里统一注册即可
app.include_router(api_router)
