from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List
import os
from models.message import Message, MessageCreate, MessageResponse, SenderType
from utils.auth import get_current_user
from utils.file_handler import save_upload_file
from datetime import datetime

router = APIRouter(prefix="/messenger", tags=["messenger"])

# Get database connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


def prepare_message_for_mongo(message_dict: dict) -> dict:
    """Prepare message data for MongoDB storage"""
    message_dict['timestamp'] = message_dict['timestamp'].isoformat()
    return message_dict


def parse_message_from_mongo(message_dict: dict) -> dict:
    """Parse message data from MongoDB"""
    if isinstance(message_dict.get('timestamp'), str):
        message_dict['timestamp'] = datetime.fromisoformat(message_dict['timestamp'])
    return message_dict


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(message_data: MessageCreate, user_id: str = Depends(get_current_user)):
    """Send a text message"""
    message = Message(
        user_id=user_id,
        sender_type=SenderType.USER,
        **message_data.model_dump()
    )
    
    message_dict = prepare_message_for_mongo(message.model_dump())
    await db.messages.insert_one(message_dict)
    
    return MessageResponse(**message.model_dump())


@router.post("/upload", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message_with_media(
    content: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Send a message with media (image or video)"""
    # Determine file type
    file_ext = file.filename.split('.')[-1].lower()
    media_type = 'image' if file_ext in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else 'video'
    
    # Save file
    try:
        media_url = await save_upload_file(file, media_type)
    except HTTPException as e:
        raise e
    
    # Create message
    message = Message(
        user_id=user_id,
        sender_type=SenderType.USER,
        content=content,
        media_url=media_url,
        media_type=media_type
    )
    
    message_dict = prepare_message_for_mongo(message.model_dump())
    await db.messages.insert_one(message_dict)
    
    return MessageResponse(**message.model_dump())


@router.get("/", response_model=List[MessageResponse])
async def get_messages(user_id: str = Depends(get_current_user), limit: int = 50):
    """Get messages for the current user"""
    messages = await db.messages.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Parse messages from MongoDB and reverse to get chronological order
    parsed_messages = [parse_message_from_mongo(msg) for msg in reversed(messages)]
    
    return [MessageResponse(**msg) for msg in parsed_messages]


@router.put("/{message_id}/read", status_code=status.HTTP_200_OK)
async def mark_message_as_read(message_id: str, user_id: str = Depends(get_current_user)):
    """Mark a message as read"""
    result = await db.messages.update_one(
        {"id": message_id, "user_id": user_id},
        {"$set": {"read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    return {"message": "Message marked as read"}


@router.get("/unread/count")
async def get_unread_count(user_id: str = Depends(get_current_user)):
    """Get count of unread messages"""
    count = await db.messages.count_documents({
        "user_id": user_id,
        "sender_type": SenderType.ADMIN.value,
        "read": False
    })
    
    return {"unread_count": count}
