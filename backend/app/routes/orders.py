from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func as sql_func
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.food import Food
from app.models.promo import PromoCode
from app.models.payment import Payment, PaymentMethod
from app.models.user import User, UserRole
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse, OrderItemResponse, PaginatedOrders
from app.utils.dependencies import get_current_user, require_admin
from app.utils.exceptions import NotFoundException, BadRequestException, ForbiddenException

router = APIRouter(prefix="/api/orders", tags=["orders"])

CENT = Decimal("0.01")


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)


def serialize_order(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        user_name=order.user.name if order.user else "Unknown",
        delivery_user_id=order.delivery_user_id,
        delivery_agent_name=order.delivery_user.name if order.delivery_user else None,
        status=order.status,
        total_amount=order.total_amount,
        delivery_fee=order.delivery_fee,
        discount_amount=order.discount_amount,
        final_amount=order.final_amount,
        delivery_address=order.delivery_address,
        delivery_phone=order.delivery_phone,
        delivery_name=order.delivery_name,
        special_instructions=order.special_instructions,
        items=[OrderItemResponse(
            id=item.id,
            food_id=item.food_id,
            food_name=item.food.name if item.food else "Unknown",
            quantity=item.quantity,
            price=item.price,
            subtotal=item.subtotal,
        ) for item in order.items],
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


@router.get("", response_model=PaginatedOrders)
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = None,
    user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.delivery_user),
        selectinload(Order.items).joinedload(OrderItem.food),
    )

    if current_user.role.value != "admin":
        query = query.filter(
            (Order.user_id == current_user.id) | (Order.delivery_user_id == current_user.id)
        )

    if status:
        query = query.filter(Order.status == status)
    if user_id:
        query = query.filter(Order.user_id == user_id)

    total = query.count()
    pages = (total + limit - 1) // limit
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = [serialize_order(order) for order in orders]

    return PaginatedOrders(orders=result, total=total, page=page, pages=pages)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    order = db.query(Order).options(
        joinedload(Order.user),
        joinedload(Order.delivery_user),
        selectinload(Order.items).joinedload(OrderItem.food),
    ).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundException("Order")

    if current_user.role.value != "admin" and order.user_id != current_user.id and order.delivery_user_id != current_user.id:
        raise ForbiddenException("You cannot access this order")
    return serialize_order(order)


@router.post("", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    total_amount = Decimal("0.00")
    order_items = []

    for item_data in order_data.items:
        food = db.query(Food).filter(Food.id == item_data.food_id).first()
        if not food:
            raise NotFoundException(f"Food item with id {item_data.food_id}")
        if not food.is_available:
            raise BadRequestException(f"{food.name} is not available")

        subtotal = money(food.price) * item_data.quantity
        total_amount += subtotal
        order_items.append((food, item_data.quantity, money(food.price), subtotal))

    delivery_fee = Decimal("2.00") if total_amount > 0 else Decimal("0.00")
    discount_amount = Decimal("0.00")
    promo_code_id = None

    if order_data.promo_code:
        promo = db.query(PromoCode).filter(
            PromoCode.code == order_data.promo_code.upper(),
            PromoCode.is_active == True
        ).first()
        if not promo:
            raise BadRequestException("Invalid promo code")
        if promo.expires_at and promo.expires_at <= datetime.now(timezone.utc):
            raise BadRequestException("Promo code has expired")
        if promo.usage_limit is not None and promo.used_count >= promo.usage_limit:
            raise BadRequestException("Promo code usage limit reached")
        if total_amount < money(promo.min_order_amount):
            raise BadRequestException(f"Minimum order amount is {promo.min_order_amount}")
        if promo.discount_percent > 0:
            discount_amount = total_amount * (Decimal(str(promo.discount_percent)) / Decimal("100"))
            if promo.max_discount is not None:
                discount_amount = min(discount_amount, money(promo.max_discount))
        else:
            discount_amount = money(promo.discount_amount)
        discount_amount = min(discount_amount, total_amount + delivery_fee)
        promo.used_count += 1
        promo_code_id = promo.id

    final_amount = money(total_amount + delivery_fee - discount_amount)

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        delivery_fee=delivery_fee,
        discount_amount=discount_amount,
        final_amount=final_amount,
        promo_code_id=promo_code_id,
        delivery_address=order_data.delivery_address,
        delivery_phone=order_data.delivery_phone,
        delivery_name=order_data.delivery_name,
        special_instructions=order_data.special_instructions
    )
    db.add(order)
    db.flush()

    for food, quantity, price, subtotal in order_items:
        order_item = OrderItem(
            order_id=order.id,
            food_id=food.id,
            quantity=quantity,
            price=price,
            subtotal=subtotal
        )
        db.add(order_item)

    db.add(Payment(
        order_id=order.id,
        amount=final_amount,
        method=PaymentMethod(order_data.payment_method),
    ))
    db.commit()
    db.refresh(order)
    return get_order(order.id, db, current_user)


@router.patch("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_data: OrderUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundException("Order")

    update_data = order_data.model_dump(exclude_unset=True)
    if order_data.status is not None:
        allowed_transitions = {
            OrderStatus.PLACED: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
            OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
            OrderStatus.PREPARING: {OrderStatus.READY},
            OrderStatus.READY: {OrderStatus.OUT_FOR_DELIVERY},
            OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED},
            OrderStatus.DELIVERED: set(),
            OrderStatus.CANCELLED: set(),
        }
        if order_data.status != order.status and order_data.status not in allowed_transitions[order.status]:
            raise BadRequestException(f"Invalid order transition: {order.status.value} to {order_data.status.value}")
    if order_data.delivery_user_id is not None:
        delivery_user = db.query(User).filter(User.id == order_data.delivery_user_id).first()
        if not delivery_user or delivery_user.role not in (UserRole.DELIVERY, UserRole.ADMIN):
            raise BadRequestException("Assigned user must be a delivery user or admin")
        if not delivery_user.is_active:
            raise BadRequestException("Cannot assign an inactive delivery user")
    for key, value in update_data.items():
        setattr(order, key, value)

    if order_data.status == OrderStatus.DELIVERED:
        order.actual_delivery = datetime.now(timezone.utc)

    db.commit()
    db.refresh(order)
    return get_order(order.id, db, _)
