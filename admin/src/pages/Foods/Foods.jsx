import { useState, useEffect, useCallback } from 'react';
import { foodsAPI, categoriesAPI, uploadAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

const emptyFood = { name: '', description: '', price: '', category_id: '', is_available: true, is_featured: false, preparation_time: 15, calories: '' };

export default function Foods() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyFood);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (catFilter) params.category_id = catFilter;
      const { data } = await foodsAPI.getAll(params);
      setFoods(data.foods);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load foods');
    } finally {
      setLoading(false);
    }
  }, [page, search, catFilter]);

  useEffect(() => { fetchFoods(); }, [page, search, catFilter, fetchFoods]);
  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll();
      setCategories(data);
    } catch (err) {
      void err;
      toast.error('Failed to load categories');
    }
  };

  const openCreate = () => { setEditItem(null); setForm(emptyFood); setModalOpen(true); };
  const openEdit = (food) => {
    setEditItem(food);
    setForm({
      name: food.name, description: food.description || '', price: food.price,
      category_id: food.category_id, is_available: food.is_available,
      is_featured: food.is_featured, preparation_time: food.preparation_time,
      calories: food.calories || ''
    });
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
      const payload = { ...form, price: parseFloat(form.price), category_id: parseInt(form.category_id), calories: form.calories ? parseInt(form.calories) : null };
      if (editItem) {
        await foodsAPI.update(editItem.id, payload);
        toast.success('Food updated');
      } else {
        await foodsAPI.create(payload);
        toast.success('Food created');
      }
      setModalOpen(false);
      fetchFoods();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await foodsAPI.delete(id);
      toast.success('Food deleted');
      setDeleteConfirm(null);
      fetchFoods();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleAvailability = async (food) => {
    try {
      await foodsAPI.update(food.id, { is_available: !food.is_available });
      fetchFoods();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Food Items</h2>
        <button className="btn btn-primary" onClick={openCreate}><HiPlus size={18} /> Add Food</button>
      </div>

      <div className="toolbar">
        <input className="form-input" placeholder="Search foods..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {foods.length === 0 ? <div className="empty-state">No foods found</div> : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Available</th><th>Featured</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {foods.map((food) => (
                      <tr key={food.id}>
                        <td>#{food.id}</td>
                        <td><strong>{food.name}</strong></td>
                        <td>{food.category_name}</td>
                        <td>${food.price.toFixed(2)}</td>
                        <td>
                          <button className={`btn btn-sm ${food.is_available ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleAvailability(food)}>
                            {food.is_available ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td>{food.is_featured ? '⭐' : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-sm btn-secondary" onClick={() => openEdit(food)}><HiPencil size={14} /></button>
                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(food)}><HiTrash size={14} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Food' : 'Add Food'} size="md">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prep Time (min)</label>
              <input className="form-input" type="number" value={form.preparation_time} onChange={(e) => setForm({ ...form, preparation_time: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Calories</label>
              <input className="form-input" type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Image</label>
            <input className="form-input" type="file" accept="image/*" onChange={handleImageUpload} />
            {form.image && <img src={`http://localhost:8000${form.image}`} alt="" style={{ marginTop: '8px', maxWidth: '100px', borderRadius: '8px' }} />}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} /> Available</label>
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Featured</label>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Food" size="sm">
        <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
