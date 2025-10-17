from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import os
from models.booking import (
    Booking, BookingCreate, BookingUpdate, BookingResponse,
    ServiceType, BookingStatus
)
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime

router = APIRouter(prefix="/bookings", tags=["bookings"])

# Get database connection
db = get_db()


def prepare_booking_for_mongo(booking_dict: dict) -> dict:
    """Prepare booking data for MongoDB storage"""
    # Convert dates to ISO strings
    if 'start_date' in booking_dict and booking_dict['start_date']:
        booking_dict['start_date'] = booking_dict['start_date'].isoformat()
    if 'end_date' in booking_dict and booking_dict['end_date']:
        booking_dict['end_date'] = booking_dict['end_date'].isoformat()
    
    # Convert times to strings
    if 'start_time' in booking_dict and booking_dict['start_time']:
        booking_dict['start_time'] = booking_dict['start_time'].strftime('%H:%M:%S')
    if 'end_time' in booking_dict and booking_dict['end_time']:
        booking_dict['end_time'] = booking_dict['end_time'].strftime('%H:%M:%S')
    
    # Convert datetimes to ISO strings
    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
    booking_dict['updated_at'] = booking_dict['updated_at'].isoformat()
    
    return booking_dict


def parse_booking_from_mongo(booking_dict: dict) -> dict:
    """Parse booking data from MongoDB"""
    # Parse dates
    if isinstance(booking_dict.get('start_date'), str):
        booking_dict['start_date'] = datetime.fromisoformat(booking_dict['start_date']).date()
    if isinstance(booking_dict.get('end_date'), str) and booking_dict.get('end_date'):
        booking_dict['end_date'] = datetime.fromisoformat(booking_dict['end_date']).date()
    
    # Parse times
    if isinstance(booking_dict.get('start_time'), str) and booking_dict.get('start_time'):
        booking_dict['start_time'] = datetime.strptime(booking_dict['start_time'], '%H:%M:%S').time()
    if isinstance(booking_dict.get('end_time'), str) and booking_dict.get('end_time'):
        booking_dict['end_time'] = datetime.strptime(booking_dict['end_time'], '%H:%M:%S').time()
    
    # Parse datetimes
    if isinstance(booking_dict.get('created_at'), str):
        booking_dict['created_at'] = datetime.fromisoformat(booking_dict['created_at'])
    if isinstance(booking_dict.get('updated_at'), str):
        booking_dict['updated_at'] = datetime.fromisoformat(booking_dict['updated_at'])
    
    return booking_dict


@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(booking_data: BookingCreate, user_id: str = Depends(get_current_user)):
    """Create a new booking"""
    # Check if pet exists and belongs to user
    pet = await db.pets.find_one({"id": booking_data.pet_id, "user_id": user_id}, {"_id": 0})
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    # Check if pet has completed introduction for non-introduction services
    if booking_data.service_type != ServiceType.INTRODUCTION and not pet.get('intro_completed', False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pet must complete introduction service before booking other services"
        )
    
    # Create booking
    booking = Booking(
        user_id=user_id,
        **booking_data.model_dump()
    )
    
    booking_dict = prepare_booking_for_mongo(booking.model_dump())
    await db.bookings.insert_one(booking_dict)
    
    # If this is an introduction booking, update the pet
    if booking_data.service_type == ServiceType.INTRODUCTION:
        await db.pets.update_one(
            {"id": booking_data.pet_id},
            {"$set": {"intro_booking_id": booking.id}}
        )
    
    return BookingResponse(**booking.model_dump())


@router.get("/", response_model=List[BookingResponse])
async def get_user_bookings(user_id: str = Depends(get_current_user)):
    """Get all bookings for the current user"""
    bookings = await db.bookings.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Parse bookings from MongoDB
    parsed_bookings = [parse_booking_from_mongo(booking) for booking in bookings]
    
    return [BookingResponse(**booking) for booking in parsed_bookings]


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific booking"""
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user_id}, {"_id": 0})
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    booking = parse_booking_from_mongo(booking)
    return BookingResponse(**booking)


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: str,
    booking_update: BookingUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a booking"""
    # Check if booking exists and belongs to user
    existing_booking = await db.bookings.find_one({"id": booking_id, "user_id": user_id}, {"_id": 0})
    
    if not existing_booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Prepare update data
    update_data = booking_update.model_dump(exclude_unset=True)
    
    if update_data:
        # Handle date/time conversions
        if 'start_date' in update_data and update_data['start_date']:
            update_data['start_date'] = update_data['start_date'].isoformat()
        if 'end_date' in update_data and update_data['end_date']:
            update_data['end_date'] = update_data['end_date'].isoformat()
        if 'start_time' in update_data and update_data['start_time']:
            update_data['start_time'] = update_data['start_time'].strftime('%H:%M:%S')
        if 'end_time' in update_data and update_data['end_time']:
            update_data['end_time'] = update_data['end_time'].strftime('%H:%M:%S')
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        await db.bookings.update_one(
            {"id": booking_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    # Get updated booking
    updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    updated_booking = parse_booking_from_mongo(updated_booking)
    
    return BookingResponse(**updated_booking)


@router.put("/{booking_id}/complete")
async def complete_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Mark booking as completed and update pet intro status if it's an introduction"""
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user_id}, {"_id": 0})
    
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    # Update booking status
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "status": BookingStatus.COMPLETED.value,
            "updated_at": datetime.now().isoformat()
        }}
    )
    
    # If introduction booking, mark pet as intro completed
    if booking.get('service_type') == ServiceType.INTRODUCTION.value:
        await db.pets.update_one(
            {"id": booking['pet_id']},
            {"$set": {"intro_completed": True}}
        )
    
    return {"message": "Booking completed successfully"}


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_booking(booking_id: str, user_id: str = Depends(get_current_user)):
    """Cancel a booking"""
    result = await db.bookings.update_one(
        {"id": booking_id, "user_id": user_id},
        {"$set": {
            "status": BookingStatus.CANCELLED.value,
            "updated_at": datetime.now().isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found"
        )
    
    return None
