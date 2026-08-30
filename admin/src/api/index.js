import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const foodsAPI = {
  getAll: (params) => api.get('/foods', { params }),
  getById: (id) => api.get(`/foods/${id}`),
  create: (data) => api.post('/foods', data),
  update: (id, data) => api.put(`/foods/${id}`, data),
  delete: (id) => api.delete(`/foods/${id}`),
};

export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.patch(`/orders/${id}`, data),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const paymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.patch(`/payments/${id}`, data),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const promosAPI = {
  getAll: (params) => api.get('/promos', { params }),
  getById: (id) => api.get(`/promos/${id}`),
  create: (data) => api.post('/promos', data),
  update: (id, data) => api.put(`/promos/${id}`, data),
  delete: (id) => api.delete(`/promos/${id}`),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  create: (data) => api.post('/notifications', data),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (key, data) => api.put(`/settings/${key}`, data),
};
