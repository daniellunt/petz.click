from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List
from models.transport import (
    BusStop, BusStopCreate, BusStopResponse,
    TransportBooking, TransportBookingCreate, TransportBookingUpdate, TransportBookingResponse,
    TransportSettings, TransportSettingsCreate, TransportSettingsResponse,
    TransportType
)
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime
import math

router = APIRouter(tags=["transport"])

# Get database connection
db = get_db()


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula (in km)"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


# Bus Stops Management

@router.post("/stops", response_model=BusStopResponse, status_code=status.HTTP_201_CREATED)
async def create_bus_stop(stop_data: BusStopCreate, user_id: str = Depends(get_current_user)):
    """Create a new bus stop"""
    stop = BusStop(**stop_data.model_dump())
    
    stop_dict = stop.model_dump()
    stop_dict['created_at'] = stop_dict['created_at'].isoformat()
    
    await db.bus_stops.insert_one(stop_dict)
    
    return BusStopResponse(**stop.model_dump())


@router.get("/stops", response_model=List[BusStopResponse])
async def get_bus_stops(
    location_id: str = None,
    client_lat: float = None,
    client_lon: float = None,
    limit: int = None,
    user_id: str = Depends(get_current_user)
):
    """
    Get all bus stops for a location.
    If client coordinates provided, calculate distances and optionally limit to closest stops.
    """
    query = {"is_active": True}
    if location_id:
        query["location_id"] = location_id
    
    stops = await db.bus_stops.find(query, {"_id": 0}).to_list(200)
    
    # Parse from MongoDB
    for stop in stops:
        if isinstance(stop.get('created_at'), str):
            stop['created_at'] = datetime.fromisoformat(stop['created_at'])
    
    stop_responses = [BusStopResponse(**stop) for stop in stops]
    
    # Calculate distances if client location provided
    if client_lat is not None and client_lon is not None:
        for stop_resp in stop_responses:
            stop_resp.distance_km = calculate_distance(
                client_lat, client_lon,
                stop_resp.latitude, stop_resp.longitude
            )
        
        # Sort by distance
        stop_responses.sort(key=lambda x: x.distance_km if x.distance_km else float('inf'))
        
        # Limit to closest stops if specified
        if limit:
            stop_responses = stop_responses[:limit]
    
    return stop_responses


@router.get("/stops/{stop_id}", response_model=BusStopResponse)
async def get_bus_stop(stop_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific bus stop"""
    stop = await db.bus_stops.find_one({"id": stop_id}, {"_id": 0})
    
    if not stop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bus stop not found"
        )
    
    if isinstance(stop.get('created_at'), str):
        stop['created_at'] = datetime.fromisoformat(stop['created_at'])
    
    return BusStopResponse(**stop)


@router.delete("/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bus_stop(stop_id: str, user_id: str = Depends(get_current_user)):
    """Delete a bus stop"""
    result = await db.bus_stops.update_one(
        {"id": stop_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bus stop not found"
        )
    
    return None


# Transport Bookings

@router.post("/bookings", response_model=TransportBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_transport_booking(
    booking_data: TransportBookingCreate,
    location_id: str,
    user_id: str = Depends(get_current_user)
):
    """Create a new transport booking"""
    
    # Get transport settings for pricing
    settings = await db.transport_settings.find_one({"location_id": location_id}, {"_id": 0})
    if not settings:
        # Create default settings if not exist
        default_settings = TransportSettings(location_id=location_id)
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.transport_settings.insert_one(settings_dict)
        settings = settings_dict
    
    booking = TransportBooking(
        location_id=location_id,
        **booking_data.model_dump()
    )
    
    # Calculate estimated cost
    if booking.transport_type == TransportType.PET_TAXI:
        # Calculate distance if coordinates provided
        if (booking.pickup_latitude and booking.pickup_longitude and 
            booking.dropoff_latitude and booking.dropoff_longitude):
            distance = calculate_distance(
                booking.pickup_latitude, booking.pickup_longitude,
                booking.dropoff_latitude, booking.dropoff_longitude
            )
            booking.distance_km = distance
            booking.estimated_cost = settings['taxi_base_rate'] + (distance * settings['taxi_per_km_rate'])
    else:  # SCHOOL_BUS
        booking.estimated_cost = settings['school_bus_flat_rate']
    
    booking_dict = booking.model_dump()
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    booking_dict['updated_at'] = booking_dict['updated_at'].isoformat()
    booking_dict['scheduled_date'] = booking_dict['scheduled_date'].isoformat()
    booking_dict['scheduled_time'] = booking_dict['scheduled_time'].strftime('%H:%M:%S')
    
    await db.transport_bookings.insert_one(booking_dict)
    
    return TransportBookingResponse(**booking.model_dump())


@router.get("/bookings", response_model=List[TransportBookingResponse])
async def get_transport_bookings(
    location_id: str = None,
    date: str = None,
    status: str = None,
    user_id: str = Depends(get_current_user)
):
    """Get all transport bookings with optional filters"""
    query = {}
    if location_id:
        query["location_id"] = location_id
    if date:
        query["scheduled_date"] = date
    if status:
        query["status"] = status
    
    bookings = await db.transport_bookings.find(query, {"_id": 0}).to_list(200)
    
    # Parse from MongoDB
    for booking in bookings:
        if isinstance(booking.get('created_at'), str):
            booking['created_at'] = datetime.fromisoformat(booking['created_at'])
        if isinstance(booking.get('updated_at'), str):
            booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
        if isinstance(booking.get('scheduled_date'), str):
            booking['scheduled_date'] = datetime.fromisoformat(booking['scheduled_date']).date()
        if isinstance(booking.get('scheduled_time'), str):
            booking['scheduled_time'] = datetime.strptime(booking['scheduled_time'], '%H:%M:%S').time()
        if isinstance(booking.get('pickup_time'), str):
            booking['pickup_time'] = datetime.fromisoformat(booking['pickup_time'])
        if isinstance(booking.get('dropoff_time'), str):
            booking['dropoff_time'] = datetime.fromisoformat(booking['dropoff_time'])
    
    return [TransportBookingResponse(**b) for b in bookings]


@router.get("/bookings/{booking_id}", response_model=TransportBookingResponse)
async def get_transport_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific transport booking"""
    booking = await db.transport_bookings.find_one({"id": booking_id}, {"_id": 0})
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport booking not found"
        )
    
    # Parse from MongoDB
    if isinstance(booking.get('created_at'), str):
        booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    if isinstance(booking.get('updated_at'), str):
        booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
    if isinstance(booking.get('scheduled_date'), str):
        booking['scheduled_date'] = datetime.fromisoformat(booking['scheduled_date']).date()
    if isinstance(booking.get('scheduled_time'), str):
        booking['scheduled_time'] = datetime.strptime(booking['scheduled_time'], '%H:%M:%S').time()
    if isinstance(booking.get('pickup_time'), str):
        booking['pickup_time'] = datetime.fromisoformat(booking['pickup_time'])
    if isinstance(booking.get('dropoff_time'), str):
        booking['dropoff_time'] = datetime.fromisoformat(booking['dropoff_time'])
    
    return TransportBookingResponse(**booking)


@router.put("/bookings/{booking_id}", response_model=TransportBookingResponse)
async def update_transport_booking(
    booking_id: str,
    booking_update: TransportBookingUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a transport booking"""
    existing = await db.transport_bookings.find_one({"id": booking_id}, {"_id": 0})
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transport booking not found"
        )
    
    update_data = booking_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now().isoformat()
        
        # Convert datetime fields to ISO strings
        if 'pickup_time' in update_data and update_data['pickup_time']:
            update_data['pickup_time'] = update_data['pickup_time'].isoformat()
        if 'dropoff_time' in update_data and update_data['dropoff_time']:
            update_data['dropoff_time'] = update_data['dropoff_time'].isoformat()
        
        await db.transport_bookings.update_one(
            {"id": booking_id},
            {"$set": update_data}
        )
    
    # Get updated booking
    updated = await db.transport_bookings.find_one({"id": booking_id}, {"_id": 0})
    
    # Parse from MongoDB
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    if isinstance(updated.get('scheduled_date'), str):
        updated['scheduled_date'] = datetime.fromisoformat(updated['scheduled_date']).date()
    if isinstance(updated.get('scheduled_time'), str):
        updated['scheduled_time'] = datetime.strptime(updated['scheduled_time'], '%H:%M:%S').time()
    if isinstance(updated.get('pickup_time'), str):
        updated['pickup_time'] = datetime.fromisoformat(updated['pickup_time'])
    if isinstance(updated.get('dropoff_time'), str):
        updated['dropoff_time'] = datetime.fromisoformat(updated['dropoff_time'])
    
    return TransportBookingResponse(**updated)


# Transport Settings

@router.get("/settings/{location_id}", response_model=TransportSettingsResponse)
async def get_transport_settings(location_id: str, user_id: str = Depends(get_current_user)):
    """Get transport settings for a location"""
    settings = await db.transport_settings.find_one({"location_id": location_id}, {"_id": 0})
    
    if not settings:
        # Create default settings
        default_settings = TransportSettings(location_id=location_id)
        settings_dict = default_settings.model_dump()
        settings_dict['created_at'] = settings_dict['created_at'].isoformat()
        settings_dict['updated_at'] = settings_dict['updated_at'].isoformat()
        await db.transport_settings.insert_one(settings_dict)
        return TransportSettingsResponse(**default_settings.model_dump())
    
    # Parse from MongoDB
    if isinstance(settings.get('created_at'), str):
        settings['created_at'] = datetime.fromisoformat(settings['created_at'])
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return TransportSettingsResponse(**settings)


@router.put("/settings/{location_id}", response_model=TransportSettingsResponse)
async def update_transport_settings(
    location_id: str,
    settings_data: TransportSettingsCreate,
    user_id: str = Depends(get_current_user)
):
    """Update transport settings for a location"""
    update_data = settings_data.model_dump()
    update_data['updated_at'] = datetime.now().isoformat()
    
    await db.transport_settings.update_one(
        {"location_id": location_id},
        {"$set": update_data},
        upsert=True
    )
    
    updated = await db.transport_settings.find_one({"location_id": location_id}, {"_id": 0})
    
    # Parse from MongoDB
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return TransportSettingsResponse(**updated)
