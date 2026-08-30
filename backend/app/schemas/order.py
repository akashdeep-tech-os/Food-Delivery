from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.order import OrderStatus


class OrderItemCreate(BaseModel):
    food_id: int
    quantity: int = Field(gt=0, le=50)


class OrderItemResponse(BaseModel):
    id: int
    food_id: int
    food_name: Optional[str] = None
    quantity: int
    price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    items: List[OrderItemCreate] = Field(min_length=1, max_length=50)
    delivery_address: str = Field(min_length=5, max_length=1000)
    delivery_phone: str = Field(min_length=5, max_length=20)
    delivery_name: str = Field(min_length=2, max_length=200)
    special_instructions: Optional[str] = Field(default=None, max_length=1000)
    promo_code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    payment_method: str = Field(default="cash", pattern="^(cash|card|upi|wallet)$")


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    delivery_user_id: Optional[int] = None
    estimated_delivery: Optional[datetime] = None


class OrderResponse(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    delivery_user_id: Optional[int] = None
    delivery_agent_name: Optional[str] = None
    status: OrderStatus
    total_amount: float
    delivery_fee: float
    discount_amount: float
    final_amount: float
    delivery_address: str
    delivery_phone: str
    delivery_name: Optional[str] = None
    special_instructions: Optional[str] = None
    items: List[OrderItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PaginatedOrders(BaseModel):
    orders: list[OrderResponse]
    total: int
    page: int
    pages: int
