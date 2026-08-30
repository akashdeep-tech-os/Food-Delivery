from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func, extract, case
from datetime import datetime, timedelta, timezone
from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User, UserRole
from app.models.food import Food
from app.models.payment import Payment, PaymentStatus
from app.schemas.dashboard import DashboardResponse, DashboardStats, SalesData, TopFood
from app.schemas.order import OrderResponse, OrderItemResponse
from app.utils.dependencies import require_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_orders = db.query(sql_func.count(Order.id)).scalar() or 0
    total_revenue = db.query(sql_func.coalesce(sql_func.sum(Order.final_amount), 0)).scalar()
    total_users = db.query(sql_func.count(User.id)).scalar() or 0
    total_food_items = db.query(sql_func.count(Food.id)).scalar() or 0
    active_orders = db.query(sql_func.count(Order.id)).filter(
        Order.status.in_([OrderStatus.PLACED, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.OUT_FOR_DELIVERY])
    ).scalar() or 0
    pending_payments = db.query(sql_func.count(Payment.id)).filter(Payment.status == PaymentStatus.PENDING).scalar() or 0
    today_orders = db.query(sql_func.count(Order.id)).filter(Order.created_at >= today_start).scalar() or 0
    today_revenue = db.query(sql_func.coalesce(sql_func.sum(Order.final_amount), 0)).filter(Order.created_at >= today_start).scalar()

    stats = DashboardStats(
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_users=total_users,
        total_food_items=total_food_items,
        active_orders=active_orders,
        pending_payments=pending_payments,
        today_orders=today_orders,
        today_revenue=today_revenue
    )

    sales_chart = []
    for i in range(29, -1, -1):
        day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day + timedelta(days=1)
        day_orders = db.query(sql_func.count(Order.id)).filter(
            Order.created_at >= day, Order.created_at < day_end
        ).scalar() or 0
        day_revenue = db.query(sql_func.coalesce(sql_func.sum(Order.final_amount), 0)).filter(
            Order.created_at >= day, Order.created_at < day_end
        ).scalar()
        sales_chart.append(SalesData(date=day.strftime("%Y-%m-%d"), orders=day_orders, revenue=day_revenue))

    top_foods_query = (
        db.query(
            OrderItem.food_id,
            sql_func.sum(OrderItem.quantity).label("total_quantity"),
            sql_func.sum(OrderItem.subtotal).label("total_revenue")
        )
        .group_by(OrderItem.food_id)
        .order_by(sql_func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    top_foods = []
    for row in top_foods_query:
        food = db.query(Food).filter(Food.id == row.food_id).first()
        top_foods.append(TopFood(
            food_id=row.food_id,
            food_name=food.name if food else "Unknown",
            total_quantity=int(row.total_quantity),
            total_revenue=row.total_revenue
        ))

    recent_orders_query = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders = []
    for order in recent_orders_query:
        user = db.query(User).filter(User.id == order.user_id).first()
        items = []
        for item in order.items:
            food = db.query(Food).filter(Food.id == item.food_id).first()
            items.append(OrderItemResponse(
                id=item.id, food_id=item.food_id,
                food_name=food.name if food else "Unknown",
                quantity=item.quantity, price=item.price, subtotal=item.subtotal
            ))
        order_dict = {k: v for k, v in order.__dict__.items() if k != "_sa_instance_state"}
        order_dict["user_name"] = user.name if user else "Unknown"
        order_dict["delivery_name"] = order.delivery_name
        order_dict["items"] = items
        recent_orders.append(OrderResponse(**order_dict))

    status_dist = {}
    for s in OrderStatus:
        count = db.query(sql_func.count(Order.id)).filter(Order.status == s).scalar() or 0
        status_dist[s.value] = count

    return DashboardResponse(
        stats=stats,
        sales_chart=sales_chart,
        top_foods=top_foods,
        recent_orders=recent_orders,
        order_status_distribution=status_dist
    )
