import { useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiEye, HiTruck, HiCheckCircle, HiClock } from 'react-icons/hi2';

const STATUS_OPTIONS = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await ordersAPI.getAll(params);
      setOrders(data.orders);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [page, statusFilter, fetchOrders]);

  const fetchOrderDetail = async (id) => {
    setDetailLoading(true);
    try {
      const { data } = await ordersAPI.getById(id);
      setSelectedOrder(data);
    } catch {
      toast.error('Failed to load order details');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await ordersAPI.update(orderId, { status });
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) fetchOrderDetail(orderId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update');
    }
  };

  const getNextStatus = (current) => {
    const flow = {
      placed: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return flow[current];
  };

  const getStatusAction = (status) => {
    const actions = {
      placed: { icon: HiCheckCircle, label: 'Confirm', color: '#22c55e' },
      confirmed: { icon: HiClock, label: 'Start Preparing', color: '#f59e0b' },
      preparing: { icon: HiCheckCircle, label: 'Mark Ready', color: '#8b5cf6' },
      ready: { icon: HiTruck, label: 'Dispatch', color: '#3b82f6' },
      out_for_delivery: { icon: HiCheckCircle, label: 'Delivered', color: '#22c55e' },
    };
    return actions[status];
  };

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
      </div>

      <div className="toolbar">
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {orders.length === 0 ? (
            <div className="empty-state">No orders found</div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const nextStatus = getNextStatus(order.status);
                      const action = getStatusAction(order.status);
                      return (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>{order.user_name || 'Unknown'}</td>
                          <td>{order.items?.length || 0} items</td>
                          <td><strong>${order.final_amount.toFixed(2)}</strong></td>
                          <td><span className={`badge-status badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span></td>
                          <td>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => fetchOrderDetail(order.id)}>
                                <HiEye size={14} />
                              </button>
                              {action && (
                                <button
                                  className="btn btn-sm"
                                  style={{ background: action.color, color: '#fff' }}
                                  onClick={() => updateStatus(order.id, nextStatus)}
                                >
                                  <action.icon size={14} /> {action.label}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${selectedOrder?.id}`} size="lg">
        {detailLoading ? <Loading /> : selectedOrder && (
          <div className="order-detail">
            <div className="order-detail-grid">
              <div>
                <h4>Customer</h4>
                <p>{selectedOrder.delivery_agent_name || 'Unassigned'}</p>
                <p>{selectedOrder.delivery_phone}</p>
                <p>{selectedOrder.delivery_address}</p>
              </div>
              <div>
                <h4>Order Info</h4>
                <p>Status: <span className={`badge-status badge-${selectedOrder.status}`}>{selectedOrder.status.replace(/_/g, ' ')}</span></p>
                <p>Subtotal: ${selectedOrder.total_amount.toFixed(2)}</p>
                <p>Delivery Fee: ${selectedOrder.delivery_fee.toFixed(2)}</p>
                {selectedOrder.discount_amount > 0 && <p>Discount: -${selectedOrder.discount_amount.toFixed(2)}</p>}
                <p><strong>Total: ${selectedOrder.final_amount.toFixed(2)}</strong></p>
              </div>
            </div>
            <h4 style={{ marginTop: '16px' }}>Items</h4>
            <table className="table">
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.food_name}</td>
                    <td>{item.quantity}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {selectedOrder.special_instructions && (
              <div style={{ marginTop: '12px' }}>
                <h4>Special Instructions</h4>
                <p>{selectedOrder.special_instructions}</p>
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${selectedOrder.status === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => updateStatus(selectedOrder.id, s)}
                  disabled={selectedOrder.status === s}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
