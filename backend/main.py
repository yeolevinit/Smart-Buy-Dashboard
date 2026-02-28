from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database.mongo import connect_to_mongo, close_mongo_connection
import logging

from routers import auth, project

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()

app = FastAPI(title="Smart Buy Dashboard API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
CORSMiddleware,
allow_origins=[""],
allow_credentials=True,
allow_methods=[""],
allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(project.router)

@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "healthy", "message": "Backend MVC is fully integrated."}

if name == "main":
  import uvicorn
  uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)