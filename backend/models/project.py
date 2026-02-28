from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=3)
    description: Optional[str] = None
    project_type: str = Field(..., description="e.g., Residential, Commercial")
    size_sqft: Optional[float] = None
    location: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime