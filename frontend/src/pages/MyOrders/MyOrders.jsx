import React, { useEffect, useState } from 'react';
import './MyOrders.css';
import { useAuth } from '../../context/AuthContext';
import { ordersAPI } from '../../api';
import { useLocation, useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets';

const statusColors = {
  placed: '#f39c12',
  confirmed: '#3498db',
  preparing: '#9b59b6',
  ready: '#27ae60',
  out_for_delivery: '#e67e22',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
};

const statusLabels = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const MyOrders = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);

  useEffect(() => {
    if (location.state?.orderPlaced) {
      setOrderPlaced(true);
      setPlacedOrderId(location.state.orderId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ limit: 50 });
      setOrders(res.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="my-orders">
      {orderPlaced && (
        <div className="order-success-banner">
          <img src={assets.parcel_icon} alt="" />
          <div>
            <h3>Order Placed Successfully!</h3>
            <p>Order #{placedOrderId} has been placed. We'll prepare your food shortly.</p>
          </div>
        </div>
      )}

      <h2>My Orders</h2>

      {loading ? (
        <div className="my-orders-loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="my-orders-empty">
          <img src={assets.parcel_icon} alt="" />
          <p>No orders yet</p>
          <button onClick={() => navigate('/')}>Browse Menu</button>
        </div>
      ) : (
        <div className="my-orders-list">
          {orders.map((order) => (
            <div key={order.id} className="my-order-card">
              <div className="my-order-header">
                <div className="my-order-id">
                  <img src={assets.parcel_icon} alt="" />
                  <div>
                    <p className="my-order-id-text">Order #{order.id}</p>
                    <p className="my-order-date">{new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="my-order-status" style={{ backgroundColor: statusColors[order.status] + '22', color: statusColors[order.status] }}>
                  {statusLabels[order.status]}
                </div>
              </div>

              <div className="my-order-items">
                {order.items.map((item) => (
                  <div key={item.id} className="my-order-item">
                    <p>{item.food_name} x{item.quantity}</p>
                    <p>${item.subtotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="my-order-footer">
                <div className="my-order-total">
                  <p>Total: <b>${order.final_amount.toFixed(2)}</b></p>
                  <p className="my-order-address">Delivering to: {order.delivery_address}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
