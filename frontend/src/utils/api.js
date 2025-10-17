import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Pet APIs
export const petAPI = {
  getAll: () => api.get('/pets'),
  getOne: (id) => api.get(`/pets/${id}`),
  create: (data) => api.post('/pets', data),
  update: (id, data) => api.put(`/pets/${id}`, data),
  delete: (id) => api.delete(`/pets/${id}`),
};

// Booking APIs
export const bookingAPI = {
  getAll: () => api.get('/bookings'),
  getOne: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  complete: (id) => api.put(`/bookings/${id}/complete`),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

// Messenger APIs
export const messengerAPI = {
  getMessages: (limit = 50) => api.get(`/messenger?limit=${limit}`),
  sendMessage: (data) => api.post('/messenger', data),
  sendMediaMessage: (formData) => 
    api.post('/messenger/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markAsRead: (id) => api.put(`/messenger/${id}/read`),
  getUnreadCount: () => api.get('/messenger/unread/count'),
};

// Location APIs
export const locationAPI = {
  getAll: () => api.get('/locations'),
  getOne: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// User Management APIs (Admin only)
export const userAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  activate: (id) => api.put(`/users/${id}/activate`),
};

// Services APIs
export const serviceAPI = {
  getAll: (locationId) => api.get('/services', { params: { location_id: locationId } }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  // Add-ons
  getAddons: (locationId) => api.get('/services/addons', { params: { location_id: locationId } }),
  createAddon: (data) => api.post('/services/addons', data),
  deleteAddon: (id) => api.delete(`/services/addons/${id}`),
};

// Rooms APIs
export const roomAPI = {
  getAll: (locationId) => api.get('/rooms', { params: { location_id: locationId } }),
  getOne: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  toggleAvailability: (id, isAvailable) => api.put(`/rooms/${id}/availability`, null, { params: { is_available: isAvailable } }),
};

export default api;
