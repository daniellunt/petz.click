from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from models.user import User, UserCreate, UserUpdate, UserResponse
from utils.auth import get_current_user, get_password_hash
from utils.database import get_db
from datetime import datetime

router = APIRouter(tags=["users"])

# Get database connection
db = get_db()


async def check_admin_role(user_id: str = Depends(get_current_user)):
    """Check if user has admin role"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user_id


@router.get("", response_model=List[UserResponse])
async def get_users(user_id: str = Depends(check_admin_role)):
    """Get all users (admin only)"""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    
    # Parse users from MongoDB
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return [UserResponse(**u) for u in users]


@router.get("/{user_id_param}", response_model=UserResponse)
async def get_user(user_id_param: str, user_id: str = Depends(check_admin_role)):
    """Get a specific user (admin only)"""
    user = await db.users.find_one({"id": user_id_param}, {"_id": 0, "password_hash": 0})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Parse datetime
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return UserResponse(**user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreate, admin_user_id: str = Depends(check_admin_role)):
    """Create a new user (admin only)"""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        location_ids=user_data.location_ids
    )
    
    # Convert to dict and serialize datetime
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(**user.model_dump())


@router.put("/{user_id_param}", response_model=UserResponse)
async def update_user(
    user_id_param: str,
    user_update: UserUpdate,
    admin_user_id: str = Depends(check_admin_role)
):
    """Update a user (admin only)"""
    # Check if user exists
    existing_user = await db.users.find_one({"id": user_id_param}, {"_id": 0})
    
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prepare update data
    update_data = user_update.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now().isoformat()
        
        await db.users.update_one(
            {"id": user_id_param},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id_param}, {"_id": 0, "password_hash": 0})
    
    # Parse datetime
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    if isinstance(updated_user.get('updated_at'), str):
        updated_user['updated_at'] = datetime.fromisoformat(updated_user['updated_at'])
    
    return UserResponse(**updated_user)


@router.delete("/{user_id_param}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(user_id_param: str, admin_user_id: str = Depends(check_admin_role)):
    """Deactivate a user (admin only)"""
    # Prevent admin from deactivating themselves
    if user_id_param == admin_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    result = await db.users.update_one(
        {"id": user_id_param},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return None


@router.put("/{user_id_param}/activate", response_model=UserResponse)
async def activate_user(user_id_param: str, admin_user_id: str = Depends(check_admin_role)):
    """Activate a user (admin only)"""
    result = await db.users.update_one(
        {"id": user_id_param},
        {"$set": {"is_active": True, "updated_at": datetime.now().isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": user_id_param}, {"_id": 0, "password_hash": 0})
    
    # Parse datetime
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    if isinstance(updated_user.get('updated_at'), str):
        updated_user['updated_at'] = datetime.fromisoformat(updated_user['updated_at'])
    
    return UserResponse(**updated_user)
