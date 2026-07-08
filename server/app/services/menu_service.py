"""
菜单业务逻辑服务。

用处：
  - 菜单 CRUD、树形结构组装、默认种子数据。
  - 登录/刷新时把数据库菜单转为前端路由所需的 menuList 与 permissions。

为什么集中在一个 service：
  - 菜单管理页（扁平 rules）与动态路由（嵌套 menuList）共用同一份数据源，
    避免两处各写一套转换逻辑导致不一致。
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.menu import Menu, menu_role_table
from app.models.role import Role
from app.schemas.menu import MenuSaveRequest

# 路由菜单只包含目录和页面菜单，按钮类型用于 permissions
ROUTE_MENU_TYPES = (0, 1)

# 生产环境菜单 JSON 路径；存在则启动时自动导入（仅当库中尚无 id=148 时）
PRODUCTION_MENU_JSON = Path(__file__).resolve().parent.parent / "data" / "menu_list.json"
PRODUCTION_MENU_MARKER_ID = 148


def menu_to_rule_dict(menu: Menu) -> dict:
    """
    转为菜单管理列表/详情使用的扁平结构。

    用处：GET /menu/list、/menu/getParams、/menu/get 的 data.rules / data.rule。
    原因：前端 index.vue 用 handleTree(rules, 'id', 'pid') 自行组树，后端返回扁平数组即可。
    """
    return {
        "id": menu.id,
        "pid": menu.pid,
        "menuType": menu.menu_type,
        "title": menu.title,
        "name": menu.name,
        "path": menu.path,
        "component": menu.component,
        "redirect": menu.redirect,
        "icon": menu.icon,
        "weigh": menu.weigh,
        "isHide": menu.is_hide,
        "isCached": menu.is_cached,
        "isAffix": menu.is_affix,
        "isLink": menu.is_link,
        "isIframe": menu.is_iframe,
        "linkUrl": menu.link_url,
    }


def _role_keys(menu: Menu) -> list[str]:
    """取菜单关联角色的 role_key，填入路由 meta.roles。"""
    return [role.role_key for role in menu.roles] or ["admin", "common"]


def menu_to_route_node(menu: Menu) -> dict:
    """
    转为动态路由节点（嵌套结构中的单项）。

    用处：登录、getUserMenus 时组装 menuList。
    原因：backEnd.ts 的 backEndComponent 需要 component、meta 等字段加载 Vue 页面。
    """
    node: dict = {
        "id": menu.id,
        "pid": menu.pid,
        "path": menu.path,
        "name": menu.name or menu.path.strip("/").replace("/", "") or f"menu{menu.id}",
        "meta": {
            "title": menu.title,
            "icon": menu.icon,
            "isLink": menu.link_url if menu.is_link else "",
            "isHide": bool(menu.is_hide),
            "isKeepAlive": bool(menu.is_cached),
            "isAffix": bool(menu.is_affix),
            "isIframe": bool(menu.is_iframe),
            "roles": _role_keys(menu),
        },
    }
    if menu.component:
        node["component"] = menu.component
    if menu.redirect:
        node["redirect"] = menu.redirect
    return node


def build_menu_tree(menus: list[Menu], parent_id: int = 0) -> list[dict]:
    """
    将扁平菜单递归组装为嵌套树。

    用处：生成登录接口返回的 menuList。
    原因：前端后端控制路由模式需要顶层 children 嵌套，而非扁平 pid 列表。
    """
    tree: list[dict] = []
    children = sorted([m for m in menus if m.pid == parent_id], key=lambda x: x.weigh)
    for menu in children:
        node = menu_to_route_node(menu)
        sub = build_menu_tree(menus, menu.id)
        node["children"] = sub  # 与生产环境一致，叶子节点为 []
        tree.append(node)
    return tree


def list_menus(db: Session, title: str = "") -> list[Menu]:
    """查询全部菜单，支持按标题模糊筛选。"""
    query = db.query(Menu)
    if title:
        query = query.filter(Menu.title.contains(title))
    return query.order_by(Menu.weigh.asc(), Menu.id.asc()).all()


def list_roles(db: Session) -> list[Role]:
    """查询全部角色，供菜单表单下拉使用。"""
    return db.query(Role).order_by(Role.id.asc()).all()


def get_menu_by_id(db: Session, menu_id: int) -> Menu | None:
    return db.query(Menu).filter(Menu.id == menu_id).first()


def get_menu_role_ids(menu: Menu) -> list[int]:
    return [role.id for role in menu.roles]


def collect_permissions(menus: list[Menu]) -> list[str]:
    """
    收集按钮类型菜单的 name 作为 permissions。

    用处：前端 v-auth 指令和 Session.permissions 使用。
    原因：menu_type=2 的 name 即权限点，如 api/v1/system/menu/add。
    """
    return [m.name for m in menus if m.menu_type == 2 and m.name]


def get_route_menus(db: Session) -> list[Menu]:
    """
    获取用于动态路由注册的菜单（目录+页面）。

    原因：is_hide=1 的菜单仍需注册路由（如 create-detail），只是侧边栏不展示；
          因此此处不过滤 is_hide，与生产环境 menuList 行为一致。
    """
    return (
        db.query(Menu)
        .filter(Menu.menu_type.in_(ROUTE_MENU_TYPES))
        .order_by(Menu.weigh.asc(), Menu.id.asc())
        .all()
    )


def get_login_menu_payload(db: Session) -> tuple[list[dict], list[str]]:
    """
    生成登录/刷新所需的 menuList 与 permissions。

    返回：(嵌套 menuList, 按钮权限列表)
    """
    route_menus = get_route_menus(db)
    all_menus = db.query(Menu).order_by(Menu.weigh.asc(), Menu.id.asc()).all()
    menu_list = build_menu_tree(route_menus, parent_id=0)
    permissions = collect_permissions(all_menus)
    return menu_list, permissions


def _parse_int(value: str | int, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _apply_menu_fields(menu: Menu, data: MenuSaveRequest) -> None:
    """把请求体字段写入 ORM 对象。"""
    menu.pid = data.pid or 0
    menu.menu_type = _parse_int(data.menu_type)
    menu.title = data.menu_name
    menu.name = data.name
    menu.path = data.path
    menu.component = data.component
    menu.redirect = data.redirect
    menu.icon = data.icon
    menu.weigh = data.menu_sort
    menu.is_hide = _parse_int(data.is_hide)
    menu.is_cached = data.is_keep_alive
    menu.is_affix = data.is_affix
    menu.is_link = data.is_link
    menu.is_iframe = data.is_iframe
    menu.link_url = data.link_url


def _sync_menu_roles(db: Session, menu: Menu, role_ids: list[int]) -> None:
    """更新菜单关联角色。"""
    if not role_ids:
        menu.roles = []
        return
    menu.roles = db.query(Role).filter(Role.id.in_(role_ids)).all()


def create_menu(db: Session, data: MenuSaveRequest) -> Menu:
    menu = Menu()
    _apply_menu_fields(menu, data)
    db.add(menu)
    db.flush()
    _sync_menu_roles(db, menu, data.roles)
    db.commit()
    db.refresh(menu)
    return menu


def update_menu(db: Session, data: MenuSaveRequest) -> Menu | None:
    if data.id is None:
        return None
    menu = get_menu_by_id(db, data.id)
    if menu is None:
        return None
    _apply_menu_fields(menu, data)
    _sync_menu_roles(db, menu, data.roles)
    db.commit()
    db.refresh(menu)
    return menu


def delete_menus(db: Session, menu_ids: list[int]) -> tuple[bool, str]:
    """
    删除菜单（支持批量）。

    返回：(是否成功, 错误信息)
    原因：若菜单下仍有子节点，不允许删除，避免树断裂。
    """
    for menu_id in menu_ids:
        menu = get_menu_by_id(db, menu_id)
        if menu is None:
            continue
        child_count = db.query(Menu).filter(Menu.pid == menu_id).count()
        if child_count > 0:
            return False, f"菜单「{menu.title}」存在子菜单，请先删除子菜单"
        db.delete(menu)
    db.commit()
    return True, ""


def ensure_roles(db: Session) -> list[Role]:
    """确保默认角色存在，返回全部角色列表。"""
    if db.query(Role).count() == 0:
        db.add_all([
            Role(name="超级管理员", role_key="admin"),
            Role(name="普通角色", role_key="common"),
        ])
        db.commit()
    return list_roles(db)


def _node_to_menu_fields(node: dict) -> dict:
    """把生产环境 menuList 节点转为 Menu 表字段。"""
    meta = node.get("meta") or {}
    children = node.get("children") or []
    is_link_str = meta.get("isLink") or ""
    return {
        "id": node["id"],
        "pid": node.get("pid", 0),
        "menu_type": 0 if children else 1,
        "title": meta.get("title") or "",
        "name": node.get("name") or "",
        "path": node.get("path") or "",
        "component": node.get("component") or "",
        "redirect": node.get("redirect") or "",
        "icon": meta.get("icon") or "",
        "weigh": node["id"],
        "is_hide": 1 if meta.get("isHide") else 0,
        "is_cached": 1 if meta.get("isKeepAlive", True) else 0,
        "is_affix": 1 if meta.get("isAffix") else 0,
        "is_link": 1 if is_link_str else 0,
        "is_iframe": 1 if meta.get("isIframe") else 0,
        "link_url": is_link_str if is_link_str else "",
    }


def flatten_menu_tree(nodes: list[dict]) -> list[dict]:
    """递归展开嵌套 menuList，保留原始 id/pid。"""
    flat: list[dict] = []
    for node in nodes:
        flat.append(_node_to_menu_fields(node))
        children = node.get("children") or []
        if children:
            flat.extend(flatten_menu_tree(children))
    return flat


def _seed_menu_buttons(db: Session, roles: list[Role]) -> None:
    """为菜单管理页补充按钮权限（生产 JSON 通常不含 type=2 按钮）。"""
    menu_manage = get_menu_by_id(db, 2)
    if menu_manage is None:
        return
    button_defs = [
        ("新增菜单", "api/v1/system/menu/add", 1),
        ("修改菜单", "api/v1/system/menu/update", 2),
        ("删除菜单", "api/v1/system/menu/delete", 3),
    ]
    for title, name, weigh in button_defs:
        exists = db.query(Menu).filter(Menu.name == name, Menu.menu_type == 2).first()
        if exists:
            continue
        btn = Menu(
            pid=menu_manage.id,
            menu_type=2,
            title=title,
            name=name,
            weigh=weigh,
            roles=roles,
        )
        db.add(btn)
    db.commit()


def import_menus_from_json(db: Session, json_path: Path | None = None) -> bool:
    """
    从 JSON 文件导入生产环境菜单，覆盖现有 menus 表。

    返回：是否执行了导入。
    原因：用户提供的 menuList 含固定 id/pid，需原样写入才能与前端路由一致。
    """
    path = json_path or PRODUCTION_MENU_JSON
    if not path.exists():
        return False

    with path.open(encoding="utf-8") as f:
        tree = json.load(f)

    roles = ensure_roles(db)
    flat = flatten_menu_tree(tree)

    db.execute(menu_role_table.delete())
    db.query(Menu).delete()
    db.commit()

    for item in flat:
        menu = Menu(**{k: v for k, v in item.items() if k != "id"}, id=item["id"])
        menu.roles = roles
        db.add(menu)
    db.commit()
    _seed_menu_buttons(db, roles)
    return True


def import_production_menus_if_needed(db: Session) -> None:
    """
    启动时导入生产菜单（仅当库中不存在标记菜单 id=148 时）。

    原因：避免每次重启覆盖用户在菜单管理页的修改；首次或旧库升级时自动导入。
    """
    if get_menu_by_id(db, PRODUCTION_MENU_MARKER_ID) is not None:
        ensure_roles(db)
        return
    if import_menus_from_json(db):
        return
    seed_roles_and_menus(db)


def seed_roles_and_menus(db: Session) -> None:
    """
    初始化默认角色与菜单。

    用处：首次启动写入首页、系统管理、菜单管理及按钮权限。
    原因：开箱即用，登录后能进首页，且菜单管理页有数据可展示、有权限可点。
    """
    if db.query(Role).count() > 0:
        return

    admin_role = Role(name="超级管理员", role_key="admin")
    common_role = Role(name="普通角色", role_key="common")
    db.add_all([admin_role, common_role])
    db.flush()

    default_roles = [admin_role, common_role]

    root = Menu(
        pid=0, menu_type=0, title="根目录", name="/", path="/",
        component="layout/routerView/parent", redirect="/ai-home", weigh=0,
        roles=default_roles,
    )
    db.add(root)
    db.flush()

    home = Menu(
        pid=root.id, menu_type=1, title="首页", name="aiHome", path="/ai-home",
        component="aiHome/index", icon="ai-shouye", weigh=1, is_affix=1,
        roles=default_roles,
    )
    system_dir = Menu(
        pid=0, menu_type=0, title="系统管理", name="system", path="/system",
        component="layout/routerView/parent", icon="ele-Setting", weigh=100,
        roles=default_roles,
    )
    db.add_all([home, system_dir])
    db.flush()

    menu_manage = Menu(
        pid=system_dir.id, menu_type=1, title="菜单管理", name="apiV1SystemAuthMenuList",
        path="/system/menu", component="system/menu/index", icon="ele-Menu", weigh=1,
        roles=default_roles,
    )
    db.add(menu_manage)
    db.flush()

    buttons = [
        Menu(pid=menu_manage.id, menu_type=2, title="新增菜单", name="api/v1/system/menu/add", weigh=1, roles=default_roles),
        Menu(pid=menu_manage.id, menu_type=2, title="修改菜单", name="api/v1/system/menu/update", weigh=2, roles=default_roles),
        Menu(pid=menu_manage.id, menu_type=2, title="删除菜单", name="api/v1/system/menu/delete", weigh=3, roles=default_roles),
    ]
    db.add_all(buttons)
    db.commit()
