import { useState, useEffect, useCallback } from 'react';
import { promosAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

const emptyPromo = { code: '', description: '', discount_percent: 0, discount_amount: 0, min_order_amount: 0, max_discount: '', usage_limit: '', expires_at: '' };

export default function Promos() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyPromo);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await promosAPI.getAll({ page, limit: 15 });
      setPromos(data.promo_codes);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load promos');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchPromos(); }, [page, fetchPromos]);

  const openCreate = () => { setEditItem(null); setForm(emptyPromo); setModalOpen(true); };
  const openEdit = (promo) => {
    setEditItem(promo);
    setForm({
      code: promo.code, description: promo.description || '',
      discount_percent: promo.discount_percent, discount_amount: promo.discount_amount,
      min_order_amount: promo.min_order_amount, max_discount: promo.max_discount || '',
      usage_limit: promo.usage_limit || '', expires_at: promo.expires_at ? promo.expires_at.slice(0, 16) : ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        discount_percent: parseFloat(form.discount_percent),
        discount_amount: parseFloat(form.discount_amount),
        min_order_amount: parseFloat(form.min_order_amount),
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expires_at: form.expires_at || null,
      };
      if (editItem) {
        await promosAPI.update(editItem.id, payload);
        toast.success('Promo updated');
      } else {
        await promosAPI.create(payload);
        toast.success('Promo created');
      }
      setModalOpen(false);
      fetchPromos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await promosAPI.delete(id);
      toast.success('Promo deleted');
      setDeleteConfirm(null);
      fetchPromos();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleActive = async (promo) => {
    try {
      await promosAPI.update(promo.id, { is_active: !promo.is_active });
      fetchPromos();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Promo Codes</h2>
        <button className="btn btn-primary" onClick={openCreate}><HiPlus size={18} /> Add Promo</button>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {promos.length === 0 ? <div className="empty-state">No promo codes</div> : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Code</th><th>Discount</th><th>Min Order</th><th>Used</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {promos.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.code}</strong></td>
                        <td>{p.discount_percent > 0 ? `${p.discount_percent}%` : `$${p.discount_amount}`}</td>
                        <td>${p.min_order_amount}</td>
                        <td>{p.used_count}{p.usage_limit ? `/${p.usage_limit}` : ''}</td>
                        <td>
                          <button className={`btn btn-sm ${p.is_active ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleActive(p)}>
                            {p.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Never'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><HiPencil size={14} /></button>
                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(p)}><HiTrash size={14} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Promo' : 'Add Promo'} size="md">
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Discount %</label>
              <input className="form-input" type="number" step="0.01" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Discount $</label>
              <input className="form-input" type="number" step="0.01" value={form.discount_amount} onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Min Order Amount</label>
              <input className="form-input" type="number" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Discount</label>
              <input className="form-input" type="number" step="0.01" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Usage Limit</label>
              <input className="form-input" type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Expires At</label>
              <input className="form-input" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Promo" size="sm">
        <p>Delete promo code <strong>{deleteConfirm?.code}</strong>?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
