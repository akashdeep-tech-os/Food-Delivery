from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=5000)
    type: str = "info"
    user_id: Optional[int] = None
    is_broadcast: bool = False


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    message: str
    type: str
    is_read: bool
    is_broadcast: bool
    created_at: datetime

    model_config = {"from_attributes": True}
