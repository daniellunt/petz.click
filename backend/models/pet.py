from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, date
import uuid


class Vaccination(BaseModel):
    name: str
    date: date
    next_due: Optional[date] = None


class Pet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    breed: str
    age: int
    weight: float
    medical_info: Optional[str] = None
    vaccinations: List[Vaccination] = []
    intro_completed: bool = False
    intro_booking_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PetCreate(BaseModel):
    name: str
    breed: str
    age: int
    weight: float
    medical_info: Optional[str] = None
    vaccinations: List[Vaccination] = []


class PetUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    medical_info: Optional[str] = None
    vaccinations: Optional[List[Vaccination]] = None


class PetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_id: str
    name: str
    breed: str
    age: int
    weight: float
    medical_info: Optional[str] = None
    vaccinations: List[Vaccination]
    intro_completed: bool
    intro_booking_id: Optional[str]
    created_at: datetime
