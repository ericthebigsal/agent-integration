from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    klaviyo_api_key: str
    klaviyo_revision: str = "2024-10-15"
    klaviyo_base_url: str = "https://a.klaviyo.com"

    class Config:
        env_file = ".env"


settings = Settings()
