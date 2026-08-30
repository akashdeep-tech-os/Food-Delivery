from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.payment import PaymentStatus, PaymentMethod


class PaymentCreate(BaseModel):
    order_id: int
    amount: float = Field(gt=0)
    method: PaymentMethod = PaymentMethod.CASH
    transaction_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    refund_amount: Optional[float] = Field(default=None, gt=0)
    refund_reason: Optional[str] = Field(default=None, max_length=500)


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: float
    method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    refund_amount: float
    refund_reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedPayments(BaseModel):
    payments: list[PaymentResponse]
    total: int
    page: int
    pages: int
