from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DashboardStats(BaseModel):
    total_orders: int
    total_revenue: float
    total_users: int
    total_food_items: int
    active_orders: int
    pending_payments: int
    today_orders: int
    today_revenue: float


class SalesData(BaseModel):
    date: str
    orders: int
    revenue: float


class TopFood(BaseModel):
    food_id: int
    food_name: str
    total_quantity: int
    total_revenue: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    sales_chart: list[SalesData]
    top_foods: list[TopFood]
    recent_orders: list
    order_status_distribution: dict
