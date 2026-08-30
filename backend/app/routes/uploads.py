from fastapi import APIRouter, UploadFile, File, Depends
import os
import uuid
from io import BytesIO
from PIL import Image, UnidentifiedImageError
from app.config import settings
from app.utils.dependencies import require_admin
from app.utils.exceptions import BadRequestException

router = APIRouter(prefix="/api/upload", tags=["upload"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _=Depends(require_admin)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise BadRequestException("Invalid file type. Allowed: JPEG, PNG, WebP, GIF")

    max_size = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > max_size:
        raise BadRequestException("File size too large. Maximum 5MB allowed")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
        with Image.open(BytesIO(content)) as image:
            if image.width > 5000 or image.height > 5000:
                raise BadRequestException("Image dimensions are too large")
            image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
            encoded = BytesIO()
            image.save(encoded, format="WEBP", quality=85, method=6)
            content = encoded.getvalue()
    except UnidentifiedImageError as exc:
        raise BadRequestException("Uploaded file is not a valid image") from exc

    filename = f"{uuid.uuid4()}.webp"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    return {"filename": filename, "url": f"/uploads/{filename}", "success": True}
