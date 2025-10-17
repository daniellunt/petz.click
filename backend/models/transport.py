from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, date, time
from enum import Enum
import uuid


class TransportType(str, Enum):
    PET_TAXI = "pet_taxi"  # Home to facility, charged by km
    SCHOOL_BUS = "school_bus"  # Flat rate, pre-defined stops


class TransportStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BusStop(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BusStopCreate(BaseModel):
    location_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    notes: Optional[str] = None


class BusStopResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    name: str
    address: str
    latitude: float
    longitude: float
    notes: Optional[str]
    is_active: bool
    created_at: datetime
    distance_km: Optional[float] = None  # Calculated distance from client


class TransportBooking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    client_id: str
    pet_ids: List[str]  # Multiple pets can be transported together
    booking_id: Optional[str] = None  # Linked to main booking if applicable
    transport_type: TransportType
    
    # Addresses
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    
    dropoff_address: str
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    
    # For school bus
    bus_stop_id: Optional[str] = None
    
    # Schedule
    scheduled_date: date
    scheduled_time: time
    
    # Assignment
    driver_id: Optional[str] = None
    vehicle_info: Optional[str] = None
    
    # Status
    status: TransportStatus = TransportStatus.SCHEDULED
    
    # Route info
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    
    # Times
    pickup_time: Optional[datetime] = None
    dropoff_time: Optional[datetime] = None
    
    notes: Optional[str] = None
    special_instructions: Optional[str] = None
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransportBookingCreate(BaseModel):
    client_id: str
    pet_ids: List[str]
    booking_id: Optional[str] = None
    transport_type: TransportType
    pickup_address: str
    pickup_latitude: Optional[float] = None
    pickup_longitude: Optional[float] = None
    dropoff_address: str
    dropoff_latitude: Optional[float] = None
    dropoff_longitude: Optional[float] = None
    bus_stop_id: Optional[str] = None
    scheduled_date: date
    scheduled_time: time
    notes: Optional[str] = None
    special_instructions: Optional[str] = None


class TransportBookingUpdate(BaseModel):
    driver_id: Optional[str] = None
    vehicle_info: Optional[str] = None
    status: Optional[TransportStatus] = None
    distance_km: Optional[float] = None
    duration_minutes: Optional[int] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    pickup_time: Optional[datetime] = None
    dropoff_time: Optional[datetime] = None
    notes: Optional[str] = None
    special_instructions: Optional[str] = None


class TransportBookingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    client_id: str
    pet_ids: List[str]
    booking_id: Optional[str]
    transport_type: TransportType
    pickup_address: str
    pickup_latitude: Optional[float]
    pickup_longitude: Optional[float]
    dropoff_address: str
    dropoff_latitude: Optional[float]
    dropoff_longitude: Optional[float]
    bus_stop_id: Optional[str]
    scheduled_date: date
    scheduled_time: time
    driver_id: Optional[str]
    vehicle_info: Optional[str]
    status: TransportStatus
    distance_km: Optional[float]
    duration_minutes: Optional[int]
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    pickup_time: Optional[datetime]
    dropoff_time: Optional[datetime]
    notes: Optional[str]
    special_instructions: Optional[str]
    created_at: datetime
    updated_at: datetime


class RouteOptimization(BaseModel):
    """For optimizing multi-stop routes"""
    origin: str
    destination: str
    waypoints: List[str]
    optimize: bool = True


class TransportSettings(BaseModel):
    """Transport pricing and settings per location"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    location_id: str
    
    # Pet Taxi pricing
    taxi_base_rate: float = 10.0
    taxi_per_km_rate: float = 2.50
    
    # School Bus pricing
    school_bus_flat_rate: float = 15.0
    
    # Operating hours
    operating_hours: Dict[str, Any] = {}
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransportSettingsCreate(BaseModel):
    location_id: str
    taxi_base_rate: float = 10.0
    taxi_per_km_rate: float = 2.50
    school_bus_flat_rate: float = 15.0
    operating_hours: Dict[str, Any] = {}


class TransportSettingsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    location_id: str
    taxi_base_rate: float
    taxi_per_km_rate: float
    school_bus_flat_rate: float
    operating_hours: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
