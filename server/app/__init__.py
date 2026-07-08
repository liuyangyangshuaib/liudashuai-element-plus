"""
FastAPI 应用根包。

用处：将 `app/` 目录标记为 Python 包，使 `uvicorn app.main:app` 能正确解析模块路径。
原因：Python 要求目录内有 `__init__.py`（或符合 namespace 规范）才能作为包被导入；
      后续所有业务代码（api、core、models 等）都挂在这个包下统一管理。
"""
