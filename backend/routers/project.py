from fastapi import APIRouter, Depends, status
from typing import List
from models.project import ProjectCreate, ProjectResponse
from utils.security import get_current_user
from database.mongo import get_database
from datetime import datetime, timezone

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    project_dict = project.model_dump()
    project_dict["owner_id"] = current_user["id"]
    project_dict["created_at"] = datetime.now(timezone.utc)
    result = await db["projects"].insert_one(project_dict)
    return {"id": str(result.inserted_id), **project_dict}

@router.get("/", response_model=List[ProjectResponse])
async def get_user_projects(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db["projects"].find({"owner_id": current_user["id"]})
    projects = await cursor.to_list(length=100)