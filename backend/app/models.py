from pydantic import BaseModel
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

# USER login and register

class User(BaseModel):
    username: str
    password: str
    role: str = "user"

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserInDB(BaseModel):
    username: str
    password: str
    role: str
    id: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# MONGODB scan user db_uri and output findings

class UserURI(BaseModel):
    user_id: str
    encrypted_uri: str
    uri_alias: Optional[str] = None
    last_scan: Optional[datetime] = None
    created_at: datetime = datetime.now()

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ScanResult(BaseModel):
    user_uri_id: str
    findings: List[str]
    timestamp: datetime = datetime.now()

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class MongoDBRequest(BaseModel):
    mongodb_uri: str