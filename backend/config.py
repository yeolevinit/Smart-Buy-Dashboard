from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_CONNECTION_STRING: str
    MONGODB_DATABASE_NAME: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

settings = Settings()