from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.service import Service, ServiceCreate, ServiceUpdate, ServiceResponse, ServiceAddon, ServiceAddonCreate, ServiceAddonResponse
from utils.auth import get_current_user
from utils.database import get_db
from datetime import datetime

router = APIRouter(tags=["services"])

# Get database connection
db = get_db()


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def create_service(service_data: ServiceCreate, user_id: str = Depends(get_current_user)):
    """Create a new service"""
    service = Service(**service_data.model_dump())
    
    # Convert to dict and serialize datetime
    service_dict = service.model_dump()
    service_dict['created_at'] = service_dict['created_at'].isoformat()
    service_dict['updated_at'] = service_dict['updated_at'].isoformat()
    
    await db.services.insert_one(service_dict)
    
    return ServiceResponse(**service.model_dump())


@router.get("", response_model=List[ServiceResponse])
async def get_services(location_id: str = None, user_id: str = Depends(get_current_user)):
    """Get all services, optionally filtered by location"""
    query = {"is_active": True}
    if location_id:
        query["location_id"] = location_id
    
    services = await db.services.find(query, {"_id": 0}).to_list(100)
    
    # Parse services from MongoDB
    for service in services:
        if isinstance(service.get('created_at'), str):
            service['created_at'] = datetime.fromisoformat(service['created_at'])
        if isinstance(service.get('updated_at'), str):
            service['updated_at'] = datetime.fromisoformat(service['updated_at'])
    
    return [ServiceResponse(**svc) for svc in services]


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(service_id: str, user_id: str = Depends(get_current_user)):
    """Get a specific service"""
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Parse datetime
    if isinstance(service.get('created_at'), str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    if isinstance(service.get('updated_at'), str):
        service['updated_at'] = datetime.fromisoformat(service['updated_at'])
    
    return ServiceResponse(**service)


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    service_update: ServiceUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a service"""
    # Check if service exists
    existing_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    # Prepare update data
    update_data = service_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now().isoformat()
        
        await db.services.update_one(
            {"id": service_id},
            {"$set": update_data}
        )
    
    # Get updated service
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    
    # Parse datetime
    if isinstance(updated_service.get('created_at'), str):
        updated_service['created_at'] = datetime.fromisoformat(updated_service['created_at'])
    if isinstance(updated_service.get('updated_at'), str):
        updated_service['updated_at'] = datetime.fromisoformat(updated_service['updated_at'])
    
    return ServiceResponse(**updated_service)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_service(service_id: str, user_id: str = Depends(get_current_user)):
    """Soft delete a service"""
    result = await db.services.update_one(
        {"id": service_id},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )
    
    return None


# Service Add-ons endpoints

@router.post("/addons", response_model=ServiceAddonResponse, status_code=status.HTTP_201_CREATED)
async def create_addon(addon_data: ServiceAddonCreate, user_id: str = Depends(get_current_user)):
    """Create a new service add-on"""
    addon = ServiceAddon(**addon_data.model_dump())
    
    # Convert to dict and serialize datetime
    addon_dict = addon.model_dump()
    addon_dict['created_at'] = addon_dict['created_at'].isoformat()
    
    await db.service_addons.insert_one(addon_dict)
    
    return ServiceAddonResponse(**addon.model_dump())


@router.get("/addons", response_model=List[ServiceAddonResponse])
async def get_addons(location_id: str = None, user_id: str = Depends(get_current_user)):
    """Get all service add-ons, optionally filtered by location"""
    query = {"is_active": True}
    if location_id:
        query["location_id"] = location_id
    
    addons = await db.service_addons.find(query, {"_id": 0}).to_list(100)
    
    # Parse addons from MongoDB
    for addon in addons:
        if isinstance(addon.get('created_at'), str):
            addon['created_at'] = datetime.fromisoformat(addon['created_at'])
    
    return [ServiceAddonResponse(**addon) for addon in addons]


@router.delete("/addons/{addon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_addon(addon_id: str, user_id: str = Depends(get_current_user)):
    """Soft delete an add-on"""
    result = await db.service_addons.update_one(
        {"id": addon_id},
        {"$set": {"is_active": False}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Add-on not found"
        )
    
    return None
