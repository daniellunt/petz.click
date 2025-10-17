from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class Room(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    name: str
    room_type: str = "kennel"  # kennel, suite, play_area, grooming, etc.
    capacity: int = 1
    size_restrictions: List[str] = []  # ["small", "medium", "large", "xlarge"]
    species: str = "all"  # all, dog, cat
    amenities: List[str] = []  # Indoor, outdoor access, climate control, etc.
    is_available: bool = True
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RoomCreate(BaseModel):
    location_id: str
    name: str
    room_type: str = "kennel"
    capacity: int = 1
    size_restrictions: List[str] = []
    species: str = "all"
    amenities: List[str] = []
    notes: Optional[str] = None


class RoomUpdate(BaseModel):
    name: Optional[str] = None
    room_type: Optional[str] = None
    capacity: Optional[int] = None
    size_restrictions: Optional[List[str]] = None
    species: Optional[str] = None
    amenities: Optional[List[str]] = None
    is_available: Optional[bool] = None
    notes: Optional[str] = None


class RoomResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    name: str
    room_type: str
    capacity: int
    size_restrictions: List[str]
    species: str
    amenities: List[str]
    is_available: bool
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
