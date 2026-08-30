from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum as SAEnum, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class OrderStatus(str, enum.Enum):
    PLACED = "placed"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    delivery_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PLACED, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    delivery_fee = Column(Numeric(10, 2), default=2.0)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    final_amount = Column(Numeric(10, 2), nullable=False)
    promo_code_id = Column(Integer, ForeignKey("promo_codes.id"), nullable=True)
    delivery_address = Column(Text, nullable=False)
    delivery_phone = Column(String(20), nullable=False)
    delivery_name = Column(String(200), nullable=False)
    special_instructions = Column(Text, nullable=True)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    actual_delivery = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="orders", foreign_keys=[user_id])
    delivery_user = relationship("User", foreign_keys=[delivery_user_id])
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    promo_code = relationship("PromoCode")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    food = relationship("Food", back_populates="order_items")


Index("ix_orders_user_created", Order.user_id, Order.created_at)
Index("ix_orders_status_created", Order.status, Order.created_at)
