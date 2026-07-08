"""
菜单管理相关 Pydantic 模型。

用处：
  - 校验菜单新增/修改请求体，字段名与前端 editMenu.vue 的 ruleForm 对齐。
  - alias 用于兼容前端 camelCase 字段（menuName、menuSort 等）。
"""

from pydantic import BaseModel, Field


class MenuSaveRequest(BaseModel):
    """
    新增/修改菜单请求体。

    用处：POST /menu/add 与 PUT /menu/update 共用。
    原因：前端 addMenu/updateMenu 提交同一套 ruleForm 结构，后端统一接收再映射到 ORM。
    """

    id: int | None = None
    pid: int = 0
    menu_type: str = Field(default="0", alias="menuType")
    menu_name: str = Field(default="", alias="menuName")
    name: str = ""
    component: str = ""
    is_link: int = Field(default=0, alias="isLink")
    menu_sort: int = Field(default=0, alias="menuSort")
    path: str = ""
    redirect: str = ""
    icon: str = ""
    roles: list[int] = Field(default_factory=list)
    is_hide: str | int = Field(default="0", alias="isHide")
    is_keep_alive: int = Field(default=1, alias="isKeepAlive")
    is_affix: int = Field(default=0, alias="isAffix")
    link_url: str = Field(default="", alias="linkUrl")
    is_iframe: int = Field(default=0, alias="isIframe")

    model_config = {"populate_by_name": True}


class MenuDeleteRequest(BaseModel):
    """DELETE /menu/delete 请求体，前端传 { ids: [menuId] }。"""

    ids: list[int]
