from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.order import Order
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse, PaginatedPayments
from app.utils.dependencies import require_admin, get_current_user
from app.utils.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=PaginatedPayments)
def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: PaymentStatus | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)

    total = query.count()
    pages = (total + limit - 1) // limit
    payments = query.order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return PaginatedPayments(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total=total, page=page, pages=pages
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise NotFoundException("Payment")
    return PaymentResponse.model_validate(payment)


@router.post("", response_model=PaymentResponse)
def create_payment(payment_data: PaymentCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    order = db.query(Order).filter(Order.id == payment_data.order_id).first()
    if not order:
        raise NotFoundException("Order")

    existing = db.query(Payment).filter(Payment.order_id == payment_data.order_id).first()
    if existing:
        raise BadRequestException("Payment already exists for this order")
    if round(payment_data.amount, 2) != round(float(order.final_amount), 2):
        raise BadRequestException("Payment amount must match the order total")

    payment = Payment(**payment_data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.patch("/{payment_id}", response_model=PaymentResponse)
def update_payment(payment_id: int, payment_data: PaymentUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise NotFoundException("Payment")

    update_data = payment_data.model_dump(exclude_unset=True)
    if payment_data.status == PaymentStatus.REFUNDED:
        if payment.status != PaymentStatus.COMPLETED:
            raise BadRequestException("Only completed payments can be refunded")
        refund_amount = payment_data.refund_amount or payment.amount
        if float(refund_amount) <= 0 or float(refund_amount) > float(payment.amount):
            raise BadRequestException("Refund amount must be greater than zero and no more than the payment amount")
        update_data["refund_amount"] = refund_amount
    if payment_data.refund_amount is not None and float(payment_data.refund_amount) > float(payment.amount):
        raise BadRequestException("Refund amount cannot exceed the payment amount")
    for key, value in update_data.items():
        setattr(payment, key, value)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)
