import axios from 'axios';
import { Role, Trip } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

export function getAdminStats(role: Role) {
  return api.get('/admin/stats', { headers: { 'x-user-role': role } }).then(response => response.data);
}

export function getMaintenanceAlerts(role: Role) {
  return api.get('/admin/alerts', { headers: { 'x-user-role': role } }).then(response => response.data.alerts as string[]);
}

export function submitTrip(trip: Omit<Trip, 'id'>) {
  return api.post('/trips', trip, { headers: { 'x-user-role': 'USER' } }).then(response => response.data);
}
