from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://hyd:hyd_dev_password@localhost:5432/hyd_realestate"
    api_url: str = "http://localhost:4000"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384


settings = Settings()
