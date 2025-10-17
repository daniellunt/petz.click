from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone, date, time
from enum import Enum
import uuid


class ServiceType(str, Enum):
    INTRODUCTION = "introduction"
    DAYCARE = "daycare"
    BOARDING = "boarding"
    TIMED = "timed"


class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pet_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date] = None  # For boarding
    start_time: Optional[time] = None  # For timed services
    end_time: Optional[time] = None  # For timed services
    status: BookingStatus = BookingStatus.PENDING
    location: str
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    pet_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: str
    notes: Optional[str] = None


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    user_id: str
    pet_id: str
    service_type: ServiceType
    start_date: date
    end_date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    status: BookingStatus
    location: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
