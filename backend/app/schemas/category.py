from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str
    is_active: bool = True
    sort_order: int = 0


class CategoryCreate(CategoryBase):
    image: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    image: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CategoryResponse(CategoryBase):
    id: int
    image: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
