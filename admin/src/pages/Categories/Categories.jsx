import { useState, useEffect } from 'react';
import { categoriesAPI, uploadAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', is_active: true, sort_order: 0, image: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditItem(null); setForm({ name: '', is_active: true, sort_order: 0, image: '' }); setModalOpen(true); };
  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({ name: cat.name, is_active: cat.is_active, sort_order: cat.sort_order, image: cat.image || '' });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { data } = await uploadAPI.image(file);
      setForm({ ...form, image: data.url });
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) };
      if (editItem) {
        await categoriesAPI.update(editItem.id, payload);
        toast.success('Category updated');
      } else {
        await categoriesAPI.create(payload);
        toast.success('Category created');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await categoriesAPI.delete(id);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Categories</h2>
        <button className="btn btn-primary" onClick={openCreate}><HiPlus size={18} /> Add Category</button>
      </div>

      {loading ? <Loading /> : (
        <div className="categories-grid">
          {categories.map((cat) => (
            <Card key={cat.id} className="category-card">
              <div className="category-card-content">
                {cat.image && <img src={`http://localhost:8000${cat.image}`} alt={cat.name} className="category-thumb" />}
                <div className="category-info">
                  <h3>{cat.name}</h3>
                  <p className={`badge-status ${cat.is_active ? 'badge-delivered' : 'badge-cancelled'}`}>
                    {cat.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Order: {cat.sort_order}</p>
                </div>
              </div>
              <div className="category-actions">
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(cat)}><HiPencil size={14} /></button>
                <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(cat)}><HiTrash size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Sort Order</label>
            <input className="form-input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Image</label>
            <input className="form-input" type="file" accept="image/*" onChange={handleImageUpload} />
            {form.image && <img src={`http://localhost:8000${form.image}`} alt="" style={{ marginTop: '8px', maxWidth: '100px', borderRadius: '8px' }} />}
          </div>
          <div className="form-group">
            <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Category" size="sm">
        <p>Delete <strong>{deleteConfirm?.name}</strong>? All foods in this category will be affected.</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
