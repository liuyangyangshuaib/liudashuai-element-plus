"""
应用配置模块。

用处：
  - 从 .env 文件和环境变量读取配置（数据库地址、密钥、CORS 白名单等）。
  - 通过 get_settings() 向全项目提供统一的配置访问入口。

为什么这么做：
  - 配置与代码分离：开发/测试/生产只需换 .env，不用改代码。
  - 使用 pydantic-settings 自动做类型校验和默认值，比手写 os.getenv 更安全。
  - lru_cache 保证配置只加载一次，避免每次请求都重新读文件。
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    应用配置模型。

    用处：声明所有可配置项及其类型，启动时由 pydantic-settings 自动从 .env 填充。
    原因：类型注解 + 默认值 = 既能在没配 .env 时跑起来，又能在配错类型时立刻报错。
    """

    model_config = SettingsConfigDict(
        env_file=".env",           # 默认读取项目根目录下的 .env
        env_file_encoding="utf-8", # Windows 下避免中文注释乱码
        extra="ignore",            # .env 里有多余字段时不报错，方便逐步扩展配置
    )

    app_name: str = "FastAPI Server"
    debug: bool = True
    secret_key: str = "dev-secret-key"  # JWT 签名密钥，生产环境必须换成随机长字符串
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8888,http://127.0.0.1:8888"
    database_url: str = "sqlite:///./app.db"  # 本地 SQLite；换 PostgreSQL 时只改这一项即可
    jwt_access_token_expire_minutes: int = 60 * 24 * 7  # Token 有效期（分钟），默认 7 天

    @property
    def cors_origin_list(self) -> list[str]:
        """
        将逗号分隔的 CORS 字符串解析为列表。

        用处：供 CORSMiddleware 的 allow_origins 使用。
        原因：.env 里用字符串存储更方便编辑；运行时需要 list 类型，所以在属性里转换。
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """
    获取全局配置单例。

    用处：全项目通过此函数拿配置，保证只实例化一次 Settings。
    原因：配置在进程生命周期内不变，缓存可避免重复解析 .env，也便于单元测试时 mock。
    """
    return Settings()
