from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class SenderType(str, Enum):
    USER = "user"
    ADMIN = "admin"


class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    sender_type: SenderType
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image, video, etc.
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    read: bool = False


class MessageCreate(BaseModel):
    content: str
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_id: str
    sender_type: SenderType
    content: str
    media_url: Optional[str]
    media_type: Optional[str]
    timestamp: datetime
    read: bool
