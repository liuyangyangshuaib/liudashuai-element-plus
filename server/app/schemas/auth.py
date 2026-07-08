"""
认证相关 Pydantic 模型。

用处：
  - 定义登录/注册 API 的请求体与响应体结构。
  - FastAPI 自动校验入参、生成 Swagger 文档，类似前端 TypeScript interface。

为什么与 models/user.py 分开：
  - API 层接收明文 password，数据库层只存 password_hash，二者不应混用同一模型。
  - 登录响应包含 token、menuList 等聚合数据，不是单表结构能表达的。
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """
    POST /api/v1/system/login 请求体。

    用处：接收前端 account.vue 提交的登录表单。
    verifyCode / verifyKey 为验证码字段，当前前端已关闭验证码，设为可选以兼容原接口。
    """

    username: str = Field(..., min_length=1, max_length=50, description="登录用户名")
    password: str = Field(..., min_length=1, max_length=128, description="登录密码")
    verify_code: str | None = Field(default=None, alias="verifyCode")
    verify_key: str | None = Field(default=None, alias="verifyKey")

    model_config = {"populate_by_name": True}


class RegisterRequest(BaseModel):
    """
    POST /api/v1/system/register 请求体。

    用处：本地开发注册新账号，便于测试登录流程。
    """

    username: str = Field(..., min_length=3, max_length=50, description="用户名，至少 3 个字符")
    password: str = Field(..., min_length=6, max_length=128, description="密码，至少 6 个字符")


class UserInfoOut(BaseModel):
    """
    登录响应中的 userInfo 结构。

    用处：与前端 Session.set('userInfo', ...) 及 stores/userInfo.ts 字段对齐。
    字段名使用 camelCase alias，因为前端约定为 userName、userNickname 等。
    """

    id: int
    user_name: str = Field(alias="userName")
    user_nickname: str = Field(alias="userNickname")
    avatar: str = ""
    roles: list[str] = ["admin"]
    auth_btn_list: list[str] = Field(default_factory=list, alias="authBtnList")
    senbei: int = 0
    time: int

    model_config = {"populate_by_name": True}


class LoginDataOut(BaseModel):
    """
    登录成功时 data 字段的完整结构。

    用处：前端 account.vue 从 res.data 读取 token、userInfo、menuList、permissions。
    menuList / permissions 暂返回开发用默认值，第 5 步后可对接真实菜单权限系统。
    """

    token: str
    user_info: UserInfoOut = Field(alias="userInfo")
    menu_list: list[dict] = Field(alias="menuList")
    permissions: list[str] = []

    model_config = {"populate_by_name": True}
