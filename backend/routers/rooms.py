from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.room import Room, RoomCreate, RoomUpdate, RoomResponse
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime

router = APIRouter(tags=["rooms"])

# Get database connection
db = get_db()


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(room_data: RoomCreate, user_id: str = Depends(get_current_user)):
    """Create a new room"""
    room = Room(**room_data.model_dump())
    
    # Convert to dict and serialize datetime
    room_dict = room.model_dump()
    room_dict['created_at'] = room_dict['created_at'].isoformat()
    room_dict['updated_at'] = room_dict['updated_at'].isoformat()
    
    await db.rooms.insert_one(room_dict)
    
    return RoomResponse(**room.model_dump())


@router.get("", response_model=List[RoomResponse])
async def get_rooms(location_id: str = None, user_id: str = Depends(get_current_user)):
    """Get all rooms, optionally filtered by location"""
    query = {}
    if location_id:
        query["location_id"] = location_id
    
    rooms = await db.rooms.find(query, {"_id": 0}).to_list(200)
    
    # Parse rooms from MongoDB
    for room in rooms:
        if isinstance(room.get('created_at'), str):
            room['created_at'] = datetime.fromisoformat(room['created_at'])
        if isinstance(room.get('updated_at'), str):
            room['updated_at'] = datetime.fromisoformat(room['updated_at'])
    
    return [RoomResponse(**room) for room in rooms]


@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific room"""
    room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Parse datetime
    if isinstance(room.get('created_at'), str):
        room['created_at'] = datetime.fromisoformat(room['created_at'])
    if isinstance(room.get('updated_at'), str):
        room['updated_at'] = datetime.fromisoformat(room['updated_at'])
    
    return RoomResponse(**room)


@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(
    room_id: str,
    room_update: RoomUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a room"""
    # Check if room exists
    existing_room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    
    if not existing_room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Prepare update data
    update_data = room_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now().isoformat()
        
        await db.rooms.update_one(
            {"id": room_id},
            {"$set": update_data}
        )
    
    # Get updated room
    updated_room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    
    # Parse datetime
    if isinstance(updated_room.get('created_at'), str):
        updated_room['created_at'] = datetime.fromisoformat(updated_room['created_at'])
    if isinstance(updated_room.get('updated_at'), str):
        updated_room['updated_at'] = datetime.fromisoformat(updated_room['updated_at'])
    
    return RoomResponse(**updated_room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_room(room_id: str, user_id: str = Depends(get_current_user)):
    """Delete a room"""
    result = await db.rooms.delete_one({"id": room_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return None


@router.put("/{room_id}/availability", response_model=RoomResponse)
async def toggle_room_availability(
    room_id: str,
    is_available: bool,
    user_id: str = Depends(get_current_user)
):
    """Toggle room availability"""
    result = await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"is_available": is_available, "updated_at": datetime.now().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Get updated room
    updated_room = await db.rooms.find_one({"id": room_id}, {"_id": 0})
    
    # Parse datetime
    if isinstance(updated_room.get('created_at'), str):
        updated_room['created_at'] = datetime.fromisoformat(updated_room['created_at'])
    if isinstance(updated_room.get('updated_at'), str):
        updated_room['updated_at'] = datetime.fromisoformat(updated_room['updated_at'])
    
    return RoomResponse(**updated_room)
