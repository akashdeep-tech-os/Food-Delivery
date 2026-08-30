from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import datetime


class PromoCodeCreate(BaseModel):
    code: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)
    discount_percent: float = Field(default=0.0, ge=0, le=100)
    discount_amount: float = Field(default=0.0, ge=0)
    min_order_amount: float = Field(default=0.0, ge=0)
    max_discount: Optional[float] = Field(default=None, ge=0)
    usage_limit: Optional[int] = Field(default=None, gt=0)
    expires_at: Optional[datetime] = None

    @model_validator(mode="after")
    def validate_discount(self):
        if (self.discount_percent > 0) == (self.discount_amount > 0):
            raise ValueError("Set exactly one of discount_percent or discount_amount")
        return self


class PromoCodeUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)
    discount_amount: Optional[float] = Field(default=None, ge=0)
    min_order_amount: Optional[float] = Field(default=None, ge=0)
    max_discount: Optional[float] = Field(default=None, ge=0)
    usage_limit: Optional[int] = Field(default=None, gt=0)
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None


class PromoCodeResponse(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    discount_percent: float
    discount_amount: float
    min_order_amount: float
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = None
    used_count: int
    is_active: bool
    expires_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedPromoCodes(BaseModel):
    promo_codes: list[PromoCodeResponse]
    total: int
    page: int
    pages: int
