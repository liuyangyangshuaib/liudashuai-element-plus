"""
菜单管理 API。

用处：
  - 对接 client/src/api/system/menu/index.ts 的全部接口。
  - 菜单管理页增删改查，以及表单所需的 roles/menus 参数。

为什么全部接口需要登录：
  - 菜单属于系统核心配置，未授权用户不应查看或修改，统一 Depends(get_current_user)。
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import fail, success
from app.models.user import User
from app.schemas.menu import MenuDeleteRequest, MenuSaveRequest
from app.services.menu_service import (
    create_menu,
    delete_menus,
    get_menu_by_id,
    get_menu_role_ids,
    list_menus,
    list_roles,
    menu_to_rule_dict,
    update_menu,
)

router = APIRouter()


@router.get("/list")
def get_menu_list(
    title: str = Query(default="", description="菜单名称筛选"),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    GET /api/v1/system/menu/list — 菜单列表（扁平）。

    用处：菜单管理表格数据，前端 handleTree 转树形展示。
    返回：{ code: 0, data: { rules: [...] } }
    """
    menus = list_menus(db, title=title)
    return success({"rules": [menu_to_rule_dict(m) for m in menus]})


@router.get("/getParams")
def get_menu_params(
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    GET /api/v1/system/menu/getParams — 菜单表单初始化参数。

    用处：新增/编辑弹窗加载角色下拉、上级菜单树。
    返回：{ code: 0, data: { roles: [...], menus: [...] } }
    """
    roles = [{"id": r.id, "name": r.name} for r in list_roles(db)]
    menus = [menu_to_rule_dict(m) for m in list_menus(db)]
    return success({"roles": roles, "menus": menus})


@router.get("/get")
def get_menu_info(
    id: int = Query(..., description="菜单 id"),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    GET /api/v1/system/menu/get — 菜单详情。

    用处：编辑弹窗回显 ruleForm。
    返回：{ code: 0, data: { rule: {...}, roleIds: [...] } }
    """
    menu = get_menu_by_id(db, id)
    if menu is None:
        return fail(1, "菜单不存在")
    return success({"rule": menu_to_rule_dict(menu), "roleIds": get_menu_role_ids(menu)})


@router.post("/add")
def add_menu(
    body: MenuSaveRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    POST /api/v1/system/menu/add — 新增菜单。

    用处：菜单管理页点击「新增」提交表单。
    """
    create_menu(db, body)
    return success(None, "添加成功")


@router.put("/update")
def update_menu_api(
    body: MenuSaveRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    PUT /api/v1/system/menu/update — 修改菜单。

    用处：菜单管理页点击「修改」提交表单。
    """
    menu = update_menu(db, body)
    if menu is None:
        return fail(1, "菜单不存在")
    return success(None, "修改成功")


@router.delete("/delete")
def delete_menu_api(
    body: MenuDeleteRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """
    DELETE /api/v1/system/menu/delete — 删除菜单。

    请求体：{ ids: [menuId] }
    用处：菜单管理页删除操作。
    """
    ok, message = delete_menus(db, body.ids)
    if not ok:
        return fail(1, message)
    return success(None, "删除成功")
