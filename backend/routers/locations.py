from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.location import Location, LocationCreate, LocationUpdate, LocationResponse
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime

router = APIRouter(tags=["locations"])

# Get database connection
db = get_db()


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(location_data: LocationCreate, user_id: str = Depends(get_current_user)):
    """Create a new location (admin only)"""
    # TODO: Add admin role check
    
    location = Location(**location_data.model_dump())
    
    # Convert to dict and serialize datetime
    location_dict = location.model_dump()
    location_dict['created_at'] = location_dict['created_at'].isoformat()
    location_dict['updated_at'] = location_dict['updated_at'].isoformat()
    
    await db.locations.insert_one(location_dict)
    
    return LocationResponse(**location.model_dump())


@router.get("", response_model=List[LocationResponse])
async def get_locations(user_id: str = Depends(get_current_user)):
    """Get all active locations"""
    locations = await db.locations.find({"is_active": True}, {"_id": 0}).to_list(100)
    
    # Parse locations from MongoDB
    for location in locations:
        if isinstance(location.get('created_at'), str):
            location['created_at'] = datetime.fromisoformat(location['created_at'])
        if isinstance(location.get('updated_at'), str):
            location['updated_at'] = datetime.fromisoformat(location['updated_at'])
    
    return [LocationResponse(**loc) for loc in locations]


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(location_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific location"""
    location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Parse datetime
    if isinstance(location.get('created_at'), str):
        location['created_at'] = datetime.fromisoformat(location['created_at'])
    if isinstance(location.get('updated_at'), str):
        location['updated_at'] = datetime.fromisoformat(location['updated_at'])
    
    return LocationResponse(**location)


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_update: LocationUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a location (admin only)"""
    # TODO: Add admin role check
    
    # Check if location exists
    existing_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    
    if not existing_location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Prepare update data
    update_data = location_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now().isoformat()
        
        await db.locations.update_one(
            {"id": location_id},
            {"$set": update_data}
        )
    
    # Get updated location
    updated_location = await db.locations.find_one({"id": location_id}, {"_id": 0})
    
    # Parse datetime
    if isinstance(updated_location.get('created_at'), str):
        updated_location['created_at'] = datetime.fromisoformat(updated_location['created_at'])
    if isinstance(updated_location.get('updated_at'), str):
        updated_location['updated_at'] = datetime.fromisoformat(updated_location['updated_at'])
    
    return LocationResponse(**updated_location)


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(location_id: str, user_id: str = Depends(get_current_user)):
    """Soft delete a location (admin only)"""
    # TODO: Add admin role check
    
    result = await db.locations.update_one(
        {"id": location_id},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    return None
