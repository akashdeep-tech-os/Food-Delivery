import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../../api';
import { Card } from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import { Modal } from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { HiPencil } from 'react-icons/hi2';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await usersAPI.getAll(params);
      setUsers(data.users);
      setTotalPages(data.pages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter, fetchUsers]);

  const toggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch {
      toast.error('Update failed');
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, phone: user.phone || '', address: user.address || '', role: user.role });
    setModalOpen(true);
  };

  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.update(editUser.id, form);
      toast.success('User updated');
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Update failed');
    }
  };

  return (
    <div>
      <div className="page-header"><h2>Users</h2></div>

      <div className="toolbar">
        <input className="form-input" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="form-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="delivery">Delivery</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>

      {loading ? <Loading /> : (
        <Card>
          {users.length === 0 ? <div className="empty-state">No users found</div> : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td><strong>{user.name}</strong></td>
                        <td>{user.email}</td>
                        <td>{user.phone || '-'}</td>
                        <td><span className={`badge-status badge-${user.role === 'admin' ? 'confirmed' : user.role === 'delivery' ? 'out_for_delivery' : 'placed'}`}>{user.role}</span></td>
                        <td>
                          <button className={`btn btn-sm ${user.is_active ? 'btn-success' : 'btn-danger'}`} onClick={() => toggleActive(user)}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(user)}><HiPencil size={14} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Edit User" size="md">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
                <option value="delivery">Delivery</option>
                <option value="restaurant">Restaurant</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
