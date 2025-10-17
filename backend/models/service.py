from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, time
import uuid


class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    name: str
    description: Optional[str] = None
    booking_type: str = "time_slot"  # time_slot, overnight, daycare
    species: str = "all"  # all, dog, cat
    duration_minutes: Optional[int] = None  # For time-slot bookings
    pricing: Dict[str, Any] = {"type": "fixed", "amount": 0}  # {type: 'fixed'|'per_size', amount: X, prices: {size: amount}}
    schedule: Dict[str, Any] = {}  # Days, times, check-in/out times
    room_id: Optional[str] = None  # Default room assignment
    tax_rate_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ServiceCreate(BaseModel):
    location_id: str
    name: str
    description: Optional[str] = None
    booking_type: str = "time_slot"
    species: str = "all"
    duration_minutes: Optional[int] = None
    pricing: Dict[str, Any] = {"type": "fixed", "amount": 0}
    schedule: Dict[str, Any] = {}
    room_id: Optional[str] = None
    tax_rate_id: Optional[str] = None


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    booking_type: Optional[str] = None
    species: Optional[str] = None
    duration_minutes: Optional[int] = None
    pricing: Optional[Dict[str, Any]] = None
    schedule: Optional[Dict[str, Any]] = None
    room_id: Optional[str] = None
    tax_rate_id: Optional[str] = None
    is_active: Optional[bool] = None


class ServiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    name: str
    description: Optional[str]
    booking_type: str
    species: str
    duration_minutes: Optional[int]
    pricing: Dict[str, Any]
    schedule: Dict[str, Any]
    room_id: Optional[str]
    tax_rate_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ServiceAddon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    name: str
    description: Optional[str] = None
    pricing_type: str = "one_off"  # one_off, per_day, per_km
    price: float
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ServiceAddonCreate(BaseModel):
    location_id: str
    name: str
    description: Optional[str] = None
    pricing_type: str = "one_off"
    price: float


class ServiceAddonResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    name: str
    description: Optional[str]
    pricing_type: str
    price: float
    is_active: bool
    created_at: datetime
