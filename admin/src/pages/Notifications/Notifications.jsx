import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiPlus, HiCheck } from 'react-icons/hi2';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', is_broadcast: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      void err;
      toast.error('Failed to mark as read');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await notificationsAPI.create(form);
      toast.success('Notification sent');
      setModalOpen(false);
      setForm({ title: '', message: '', type: 'info', is_broadcast: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Send failed');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = { info: 'badge-placed', success: 'badge-delivered', warning: 'badge-confirmed', error: 'badge-cancelled' };
    return colors[type] || 'badge-placed';
  };

  return (
    <div>
      <div className="page-header">
        <h2>Notifications</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}><HiPlus size={18} /> Send Notification</button>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {notifications.length === 0 ? <div className="empty-state">No notifications</div> : (
            <div className="notifications-list">
              {notifications.map((n) => (
                <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                  <div className="notification-content">
                    <div className="notification-header">
                      <span className={`badge-status ${getTypeColor(n.type)}`}>{n.type}</span>
                      {n.is_broadcast && <span className="badge-status badge-placed">Broadcast</span>}
                      <h4>{n.title}</h4>
                    </div>
                    <p>{n.message}</p>
                    <span className="notification-time">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                  {!n.is_read && (
                    <button className="btn btn-sm btn-secondary" onClick={() => markRead(n.id)}>
                      <HiCheck size={14} /> Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Send Notification" size="md">
        <form onSubmit={handleSend}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={form.is_broadcast} onChange={(e) => setForm({ ...form, is_broadcast: e.target.checked })} /> Broadcast to all users</label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Sending...' : 'Send'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
