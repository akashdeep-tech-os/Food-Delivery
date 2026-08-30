import { useState, useEffect, useCallback } from 'react';
import { paymentsAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { HiCheckCircle, HiXCircle, HiArrowPath } from 'react-icons/hi2';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await paymentsAPI.getAll(params);
      setPayments(data.payments);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [page, statusFilter, fetchPayments]);

  const updateStatus = async (id, status) => {
    try {
      await paymentsAPI.update(id, { status });
      toast.success('Payment updated');
      fetchPayments();
    } catch {
      toast.error('Update failed');
    }
  };

  const processRefund = async (payment) => {
    const reason = prompt('Refund reason:');
    if (reason === null) return;
    try {
      await paymentsAPI.update(payment.id, { status: 'refunded', refund_amount: payment.amount, refund_reason: reason });
      toast.success('Refund processed');
      fetchPayments();
    } catch {
      toast.error('Refund failed');
    }
  };

  return (
    <div>
      <div className="page-header"><h2>Payments</h2></div>

      <div className="toolbar">
        <select className="form-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {payments.length === 0 ? <div className="empty-state">No payments found</div> : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>#{p.order_id}</td>
                        <td><strong>${p.amount.toFixed(2)}</strong></td>
                        <td><span className="badge-status badge-placed">{p.method}</span></td>
                        <td><span className={`badge-status badge-${p.status}`}>{p.status}</span></td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {p.status === 'pending' && (
                              <>
                                <button className="btn btn-sm btn-success" onClick={() => updateStatus(p.id, 'completed')}>
                                  <HiCheckCircle size={14} /> Complete
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => updateStatus(p.id, 'failed')}>
                                  <HiXCircle size={14} /> Fail
                                </button>
                              </>
                            )}
                            {p.status === 'completed' && (
                              <button className="btn btn-sm btn-secondary" onClick={() => processRefund(p)}>
                                <HiArrowPath size={14} /> Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} pages={totalPages} onPageChange={setPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
