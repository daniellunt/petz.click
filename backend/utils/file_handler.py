import os
import uuid
import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException

# Upload directory
UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed file types
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'video': ['.mp4', '.mov', '.avi', '.webm']
}


async def save_upload_file(file: UploadFile, file_type: str = 'image') -> str:
    """
    Save an uploaded file to the uploads directory
    Returns the relative path to the file
    """
    # Check file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS.get(file_type, []):
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types for {file_type}: {ALLOWED_EXTENSIONS.get(file_type, [])}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file in chunks to handle large files
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            chunk_size = 1024 * 1024  # 1MB chunks
            total_size = 0
            
            while chunk := await file.read(chunk_size):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    # Delete the file if it exceeds max size
                    await f.close()
                    if file_path.exists():
                        file_path.unlink()
                    raise HTTPException(
                        status_code=400,
                        detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024)}MB"
                    )
                await f.write(chunk)
        
        # Return relative path
        return f"/uploads/{unique_filename}"
    
    except Exception as e:
        # Clean up on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


def delete_file(file_path: str) -> bool:
    """Delete a file from the uploads directory"""
    try:
        full_path = Path("/app/backend") / file_path.lstrip('/')
        if full_path.exists():
            full_path.unlink()
            return True
        return False
    except Exception:
        return False
