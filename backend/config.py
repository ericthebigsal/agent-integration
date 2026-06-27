from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    klaviyo_api_key: str = Field(alias="KLAVIYO_PRIVATE_API_KEY")
    klaviyo_revision: str = "2024-10-15"
    klaviyo_base_url: str = "https://a.klaviyo.com"

    model_config = {"env_file": ".env", "populate_by_name": True, "extra": "ignore"}


settings = Settings()
