from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta, timezone
from config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database.mongo import get_database
from bson import ObjectId

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
to_encode = data.copy()
expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
to_encode.update({"exp": expire})
return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
credentials_exception = HTTPException(
status_code=status.HTTP_401_UNAUTHORIZED,
detail="Could not validate credentials",
headers={"WWW-Authenticate": "Bearer"},
)
try:
payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
user_id: str = payload.get("sub")
if user_id is None:
raise credentials_exception
except jwt.PyJWTError:
raise credentials_exception

db = get_database()
user = await db["users"].find_one({"_id": ObjectId(user_id)})
if user is None:
    raise credentials_exception
    
user["id"] = str(user["_id"])
return user