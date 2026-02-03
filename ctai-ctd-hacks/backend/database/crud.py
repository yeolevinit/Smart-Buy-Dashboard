from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from .mongodb import db_manager
from models.database_models import (
    ProjectModel, MaterialModel, VendorModel, 
    ProcurementItemModel, PredictionModel, 
    ChatMessageModel, UserModel
)

# Helper function to convert string ID to ObjectId
def to_object_id(id_str: str) -> ObjectId:
    """Convert string ID to ObjectId"""
    if isinstance(id_str, ObjectId):
        return id_str
    return ObjectId(id_str)

# Project CRUD operations
def create_project(project: ProjectModel) -> ProjectModel:
    """Create a new project"""
    collection = db_manager.get_projects_collection()
    project_dict = project.dict(by_alias=True)
    if "_id" in project_dict:
        del project_dict["_id"]
    
    result = collection.insert_one(project_dict)
    project.id = str(result.inserted_id)
    return project

def get_project(project_id: str) -> Optional[ProjectModel]:
    """Get a project by ID"""
    collection = db_manager.get_projects_collection()
    try:
        project_data = collection.find_one({"_id": to_object_id(project_id)})
        if project_data:
            project_data["_id"] = str(project_data["_id"])
            return ProjectModel(**project_data)
    except Exception:
        pass
    return None

def get_all_projects() -> List[ProjectModel]:
    """Get all projects"""
    collection = db_manager.get_projects_collection()
    projects = []
    for project_data in collection.find():
        project_data["_id"] = str(project_data["_id"])
        projects.append(ProjectModel(**project_data))
    return projects

def update_project(project_id: str, project_data: dict) -> bool:
    """Update a project"""
    collection = db_manager.get_projects_collection()
    result = collection.update_one(
        {"_id": to_object_id(project_id)},
        {"$set": {**project_data, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

def delete_project(project_id: str) -> bool:
    """Delete a project"""
    collection = db_manager.get_projects_collection()
    result = collection.delete_one({"_id": to_object_id(project_id)})
    return result.deleted_count > 0

# Material CRUD operations
def create_material(material: MaterialModel) -> MaterialModel:
    """Create a new material prediction"""
    collection = db_manager.get_materials_collection()
    material_dict = material.dict(by_alias=True)
    if "_id" in material_dict:
        del material_dict["_id"]
    
    result = collection.insert_one(material_dict)
    material.id = str(result.inserted_id)
    return material

def get_materials_by_project(project_id: str) -> List[MaterialModel]:
    """Get all materials for a project"""
    collection = db_manager.get_materials_collection()
    materials = []
    for material_data in collection.find({"project_id": to_object_id(project_id)}):
        material_data["_id"] = str(material_data["_id"])
        materials.append(MaterialModel(**material_data))
    return materials

def update_material_with_vendor(material_id: str, vendor_id: str) -> bool:
    """Update a material with vendor assignment"""
    collection = db_manager.get_materials_collection()
    result = collection.update_one(
        {"_id": to_object_id(material_id)},
        {"$set": {"vendor_assigned": to_object_id(vendor_id)}}
    )
    return result.modified_count > 0

def get_material_by_id(material_id: str) -> Optional[MaterialModel]:
    """Get a material by ID"""
    collection = db_manager.get_materials_collection()
    try:
        material_data = collection.find_one({"_id": to_object_id(material_id)})
        if material_data:
            material_data["_id"] = str(material_data["_id"])
            return MaterialModel(**material_data)
    except Exception:
        pass
    return None

# Vendor CRUD operations
def create_vendor(vendor: VendorModel) -> VendorModel:
    """Create a new vendor"""
    collection = db_manager.get_vendors_collection()
    vendor_dict = vendor.dict(by_alias=True)
    # Convert project_id and material_id to ObjectId if they exist
    if vendor_dict.get("project_id"):
        vendor_dict["project_id"] = to_object_id(vendor_dict["project_id"])
    if vendor_dict.get("material_id"):
        vendor_dict["material_id"] = to_object_id(vendor_dict["material_id"])
    if "_id" in vendor_dict:
        del vendor_dict["_id"]
    
    result = collection.insert_one(vendor_dict)
    vendor.id = str(result.inserted_id)
    return vendor

def get_vendor(vendor_id: str) -> Optional[VendorModel]:
    """Get a vendor by ID"""
    collection = db_manager.get_vendors_collection()
    try:
        vendor_data = collection.find_one({"_id": to_object_id(vendor_id)})
        if vendor_data:
            vendor_data["_id"] = str(vendor_data["_id"])
            if vendor_data.get("project_id"):
                vendor_data["project_id"] = str(vendor_data["project_id"])
            if vendor_data.get("material_id"):
                vendor_data["material_id"] = str(vendor_data["material_id"])
            return VendorModel(**vendor_data)
    except Exception:
        pass
    return None

def search_vendors_by_material(material_name: str) -> List[VendorModel]:
    """Search vendors by material name"""
    collection = db_manager.get_vendors_collection()
    vendors = []
    # This is a simplified search - in practice, you might want a more sophisticated search
    for vendor_data in collection.find({"item_name": {"$regex": material_name, "$options": "i"}}):
        vendor_data["_id"] = str(vendor_data["_id"])
        if vendor_data.get("project_id"):
            vendor_data["project_id"] = str(vendor_data["project_id"])
        if vendor_data.get("material_id"):
            vendor_data["material_id"] = str(vendor_data["material_id"])
        vendors.append(VendorModel(**vendor_data))
    return vendors

def update_vendor(vendor_id: str, vendor_data: dict) -> bool:
    """Update a vendor"""
    collection = db_manager.get_vendors_collection()
    # Convert project_id and material_id to ObjectId if they exist in vendor_data
    if vendor_data.get("project_id"):
        vendor_data["project_id"] = to_object_id(vendor_data["project_id"])
    if vendor_data.get("material_id"):
        vendor_data["material_id"] = to_object_id(vendor_data["material_id"])
    result = collection.update_one(
        {"_id": to_object_id(vendor_id)},
        {"$set": {**vendor_data, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

def get_vendors_by_project(project_id: str, material_name: str = None) -> List[VendorModel]:
    """Get vendors associated with a specific project, optionally filtered by material"""
    collection = db_manager.get_vendors_collection()
    vendors = []
    
    # Build query filter
    query = {"project_id": to_object_id(project_id)}
    if material_name:
        query["material_name"] = material_name
    
    # Find vendors matching the criteria
    for vendor_data in collection.find(query):
        vendor_data["_id"] = str(vendor_data["_id"])
        if vendor_data.get("project_id"):
            vendor_data["project_id"] = str(vendor_data["project_id"])
        if vendor_data.get("material_id"):
            vendor_data["material_id"] = str(vendor_data["material_id"])
        vendors.append(VendorModel(**vendor_data))
    return vendors

# Prediction CRUD operations
def create_prediction(prediction: PredictionModel) -> PredictionModel:
    """Create a new prediction"""
    collection = db_manager.get_predictions_collection()
    prediction_dict = prediction.dict(by_alias=True)
    if "_id" in prediction_dict:
        del prediction_dict["_id"]
    
    result = collection.insert_one(prediction_dict)
    prediction.id = str(result.inserted_id)
    return prediction

def get_predictions_by_project(project_id: str) -> List[PredictionModel]:
    """Get all predictions for a project"""
    collection = db_manager.get_predictions_collection()
    predictions = []
    try:
        query = {"project_id": project_id}  # Use string ID directly
        cursor = collection.find(query)
        for prediction_data in cursor:
            prediction_data["_id"] = str(prediction_data["_id"])
            # Convert materials to use string IDs
            materials_data = prediction_data.get("materials", [])
            for material in materials_data:
                if "_id" in material:
                    material["_id"] = str(material["_id"])
                if "project_id" in material:
                    material["project_id"] = str(material["project_id"])
            predictions.append(PredictionModel(**prediction_data))
        return predictions
    except Exception:
        return []

# Chat CRUD operations
def create_chat_message(message: ChatMessageModel) -> ChatMessageModel:
    """Create a new chat message"""
    collection = db_manager.get_chat_history_collection()
    message_dict = message.dict(by_alias=True)
    if "_id" in message_dict:
        del message_dict["_id"]
    
    result = collection.insert_one(message_dict)
    message.id = str(result.inserted_id)
    return message

def get_chat_history(project_id: str) -> List[ChatMessageModel]:
    """Get chat history for a project"""
    collection = db_manager.get_chat_history_collection()
    messages = []
    for message_data in collection.find({"project_id": to_object_id(project_id)}).sort("timestamp", 1):
        message_data["_id"] = str(message_data["_id"])
        messages.append(ChatMessageModel(**message_data))
    return messages

# User CRUD operations
def create_user(user: UserModel) -> UserModel:
    """Create a new user"""
    collection = db_manager.get_users_collection()
    user_dict = user.dict(by_alias=True)
    if "_id" in user_dict:
        del user_dict["_id"]
    
    result = collection.insert_one(user_dict)
    user.id = str(result.inserted_id)
    return user

def get_user_by_email(email: str) -> Optional[UserModel]:
    """Get a user by email"""
    collection = db_manager.get_users_collection()
    user_data = collection.find_one({"email": email})
    if user_data:
        user_data["_id"] = str(user_data["_id"])
        return UserModel(**user_data)
    return None

def get_user_by_username(username: str) -> Optional[UserModel]:
    """Get a user by username"""
    collection = db_manager.get_users_collection()
    user_data = collection.find_one({"username": username})
    if user_data:
        user_data["_id"] = str(user_data["_id"])
        # Handle the case where the user document might not have all fields
        try:
            return UserModel(**user_data)
        except Exception as e:
            # If validation fails, create a minimal user model
            return UserModel(
                id=user_data.get('_id'),
                username=user_data.get('username', ''),
                password=user_data.get('password', '')
            )
    return None

def update_user_last_login(user_id: str) -> bool:
    """Update user's last login timestamp"""
    collection = db_manager.get_users_collection()
    result = collection.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    return result.modified_count > 0