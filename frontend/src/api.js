import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (formData) => api.post('/customers', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateCustomer = (id, formData) => api.put(`/customers/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);
