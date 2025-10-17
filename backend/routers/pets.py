from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import os
from models.pet import Pet, PetCreate, PetUpdate, PetResponse
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime

router = APIRouter(prefix="/pets", tags=["pets"])

# Get database connection
db = get_db()


def prepare_pet_for_mongo(pet_dict: dict) -> dict:
    """Prepare pet data for MongoDB storage"""
    pet_dict['created_at'] = pet_dict['created_at'].isoformat()
    # Convert vaccination dates to ISO strings
    for vacc in pet_dict.get('vaccinations', []):
        if 'date' in vacc:
            vacc['date'] = vacc['date'].isoformat()
        if 'next_due' in vacc and vacc['next_due']:
            vacc['next_due'] = vacc['next_due'].isoformat()
    return pet_dict


def parse_pet_from_mongo(pet_dict: dict) -> dict:
    """Parse pet data from MongoDB"""
    if isinstance(pet_dict.get('created_at'), str):
        pet_dict['created_at'] = datetime.fromisoformat(pet_dict['created_at'])
    
    # Parse vaccination dates
    for vacc in pet_dict.get('vaccinations', []):
        if isinstance(vacc.get('date'), str):
            vacc['date'] = datetime.fromisoformat(vacc['date']).date()
        if isinstance(vacc.get('next_due'), str) and vacc.get('next_due'):
            vacc['next_due'] = datetime.fromisoformat(vacc['next_due']).date()
    
    return pet_dict


@router.post("/", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(pet_data: PetCreate, user_id: str = Depends(get_current_user)):
    """Create a new pet for the current user"""
    pet = Pet(
        user_id=user_id,
        **pet_data.model_dump()
    )
    
    pet_dict = prepare_pet_for_mongo(pet.model_dump())
    await db.pets.insert_one(pet_dict)
    
    return PetResponse(**pet.model_dump())


@router.get("/", response_model=List[PetResponse])
async def get_user_pets(user_id: str = Depends(get_current_user)):
    """Get all pets for the current user"""
    pets = await db.pets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    # Parse pets from MongoDB
    parsed_pets = [parse_pet_from_mongo(pet) for pet in pets]
    
    return [PetResponse(**pet) for pet in parsed_pets]


@router.get("/{pet_id}", response_model=PetResponse)
async def get_pet(pet_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific pet"""
    pet = await db.pets.find_one({"id": pet_id, "user_id": user_id}, {"_id": 0})
    
    if not pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    pet = parse_pet_from_mongo(pet)
    return PetResponse(**pet)


@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(pet_id: str, pet_update: PetUpdate, user_id: str = Depends(get_current_user)):
    """Update a pet"""
    # Check if pet exists and belongs to user
    existing_pet = await db.pets.find_one({"id": pet_id, "user_id": user_id}, {"_id": 0})
    
    if not existing_pet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    # Prepare update data
    update_data = pet_update.model_dump(exclude_unset=True)
    
    if update_data:
        # Handle vaccination dates if present
        if 'vaccinations' in update_data:
            for vacc in update_data['vaccinations']:
                if 'date' in vacc:
                    vacc['date'] = vacc['date'].isoformat()
                if 'next_due' in vacc and vacc['next_due']:
                    vacc['next_due'] = vacc['next_due'].isoformat()
        
        await db.pets.update_one(
            {"id": pet_id, "user_id": user_id},
            {"$set": update_data}
        )
    
    # Get updated pet
    updated_pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    updated_pet = parse_pet_from_mongo(updated_pet)
    
    return PetResponse(**updated_pet)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pet(pet_id: str, user_id: str = Depends(get_current_user)):
    """Delete a pet"""
    result = await db.pets.delete_one({"id": pet_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found"
        )
    
    return None
