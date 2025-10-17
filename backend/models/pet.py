from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date
import uuid


class Vaccination(BaseModel):
    name: str
    date: date
    next_due: Optional[date] = None
    document_url: Optional[str] = None


class Pet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str  # Changed from user_id to client_id
    location_id: str
    name: str
    species: str = "dog"  # dog, cat, other
    breed: str
    age: int
    weight: float
    size: str = "medium"  # small, medium, large, xlarge
    color: Optional[str] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    avatar_url: Optional[str] = None
    medical_info: Optional[str] = None
    medications: List[str] = []
    allergies: List[str] = []
    vaccinations: List[Vaccination] = []
    behavioral_notes: Optional[str] = None
    dietary_requirements: Optional[str] = None
    emergency_vet_name: Optional[str] = None
    emergency_vet_phone: Optional[str] = None
    preferences: Dict[str, Any] = {}  # Custom preferences
    intro_completed: bool = False
    intro_booking_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PetCreate(BaseModel):
    client_id: str
    location_id: str
    name: str
    species: str = "dog"
    breed: str
    age: int
    weight: float
    size: str = "medium"
    color: Optional[str] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    avatar_url: Optional[str] = None
    medical_info: Optional[str] = None
    medications: List[str] = []
    allergies: List[str] = []
    vaccinations: List[Vaccination] = []
    behavioral_notes: Optional[str] = None
    dietary_requirements: Optional[str] = None
    emergency_vet_name: Optional[str] = None
    emergency_vet_phone: Optional[str] = None


class PetUpdate(BaseModel):
    name: Optional[str] = None
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    weight: Optional[float] = None
    size: Optional[str] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    is_neutered: Optional[bool] = None
    avatar_url: Optional[str] = None
    medical_info: Optional[str] = None
    medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    vaccinations: Optional[List[Vaccination]] = None
    behavioral_notes: Optional[str] = None
    dietary_requirements: Optional[str] = None
    emergency_vet_name: Optional[str] = None
    emergency_vet_phone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class PetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    client_id: str
    location_id: str
    name: str
    species: str
    breed: str
    age: int
    weight: float
    size: str
    color: Optional[str]
    gender: Optional[str]
    is_neutered: Optional[bool]
    avatar_url: Optional[str]
    medical_info: Optional[str]
    medications: List[str]
    allergies: List[str]
    vaccinations: List[Vaccination]
    behavioral_notes: Optional[str]
    dietary_requirements: Optional[str]
    emergency_vet_name: Optional[str]
    emergency_vet_phone: Optional[str]
    preferences: Dict[str, Any]
    intro_completed: bool
    intro_booking_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
