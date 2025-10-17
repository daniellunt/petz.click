from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date, time
from enum import Enum
import uuid


class ServiceType(str, Enum):
    INTRODUCTION = "introduction"
    DAYCARE = "daycare"
    BOARDING = "boarding"
    TIMED = "timed"
    GROOMING = "grooming"
    TRAINING = "training"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CHECKED_IN = "checked_in"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    client_id: str
    pet_id: str
    service_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date] = None  # For boarding
    start_time: Optional[time] = None  # For timed services
    end_time: Optional[time] = None  # For timed services
    status: BookingStatus = BookingStatus.PENDING
    room_id: Optional[str] = None  # Room assignment
    assigned_staff_ids: List[str] = []  # Staff assigned to this booking
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    pricing: Dict[str, Any] = {}  # {base_price: X, addons: [], tax: X, total: X}
    addons: List[Dict[str, Any]] = []  # [{addon_id: X, quantity: Y, price: Z}]
    notes: Optional[str] = None
    special_requirements: Optional[str] = None
    created_by: str  # User ID who created the booking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    location_id: str
    client_id: str
    pet_id: str
    service_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_id: Optional[str] = None
    assigned_staff_ids: List[str] = []
    addons: List[Dict[str, Any]] = []
    notes: Optional[str] = None
    special_requirements: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_id: Optional[str] = None
    assigned_staff_ids: Optional[List[str]] = None
    pricing: Optional[Dict[str, Any]] = None
    addons: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    special_requirements: Optional[str] = None


class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    client_id: str
    pet_id: str
    service_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    status: BookingStatus
    room_id: Optional[str]
    assigned_staff_ids: List[str]
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    pricing: Dict[str, Any]
    addons: List[Dict[str, Any]]
    notes: Optional[str]
    special_requirements: Optional[str]
    created_by: str
    created_at: datetime
    updated_at: datetime
