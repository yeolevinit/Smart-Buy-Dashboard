from fastapi import APIRouter, HTTPException, status
from models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from utils.security import get_password_hash, verify_password, create_access_token
from database.mongo import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    db = get_database()
    db_user = await db["users"].find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists")
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    result = await db["users"].insert_one(user_dict)
    return {"id": str(result.inserted_id), **user_dict}

@router.post("/login", response_model=TokenResponse)
async def login_user(user: UserLogin):
    db = get_database()
    db_user = await db["users"].find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = create_access_token({"sub": str(db_user["_id"])})
    return {"access_token": access_token, "token_type": "bearer", "user": {"id": str(db_user["_id"]), "name": db_user["name"], "email": db_user["email"]}}