from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FoodBase(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    price: float = Field(gt=0, le=100000)
    category_id: int
    is_available: bool = True
    is_featured: bool = False
    preparation_time: int = Field(default=15, gt=0, le=1440)
    calories: Optional[int] = Field(default=None, ge=0, le=100000)


class FoodCreate(FoodBase):
    image: Optional[str] = None


class FoodUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    image: Optional[str] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    preparation_time: Optional[int] = None
    calories: Optional[int] = None


class FoodResponse(FoodBase):
    id: int
    image: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FoodWithCategory(FoodResponse):
    category_name: Optional[str] = None


class PaginatedFoods(BaseModel):
    foods: list[FoodWithCategory]
    total: int
    page: int
    pages: int
