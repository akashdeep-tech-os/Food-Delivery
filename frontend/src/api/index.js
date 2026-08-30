import api from './axios';

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const foodsAPI = {
  getAll: (params) => api.get('/foods', { params }),
  getById: (id) => api.get(`/foods/${id}`),
};

export const categoriesAPI = {
  getAll: (params) => api.get('/categories', { params }),
};

export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
};

export const promosAPI = {
  getAll: (params) => api.get('/promos', { params }),
};
