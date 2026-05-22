import axios from 'axios';
import { Role, Trip, CategoriaMantenimiento } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

export function getUserProfile(userId: number) {
  return api.get(`/users/${userId}`).then(response => response.data);
}

export function getAdminStats(role: Role) {
  return api.get('/admin/stats', { headers: { 'x-user-role': role } }).then(response => response.data);
}

export function getMaintenanceAlerts(role: Role) {
  return api.get('/admin/alerts', { headers: { 'x-user-role': role } }).then(response => response.data.alerts as string[]);
}

export function getVehicleMaintenances(vehicleId: number) {
  return api.get('/maintenances', { params: { vehicleId } }).then(res => res.data.maintenances);
}

export function createMaintenance(payload: { descripcion: string; categoria: CategoriaMantenimiento; intervaloKm: number; costoEstimado: number; vehicleId: number }) {
  return api.post('/maintenances', payload).then(res => res.data.maintenance);
}

export function deleteMaintenance(id: number) {
  return api.delete(`/maintenances/${id}`).then(res => res.data);
}

export function seedMaintenancePlan(vehicleId: number) {
  return api.post('/maintenances/seed', { vehicleId }).then(res => res.data.maintenances);
}

export function getMaintenanceAlertsByVehicle(vehicleId: number) {
  return api.get('/maintenances/alerts', { params: { vehicleId } }).then(res => res.data.alerts);
}

export function submitTrip(trip: Omit<Trip, 'id'>) {
  return api.post('/trips', trip, { headers: { 'x-user-role': 'USER' } }).then(response => response.data);
}

export function updateTrip(tripId: number, payload: { ingresoBruto: number; kmRecorridos: number; gastoCombustible?: number }) {
  return api.put(`/trips/${tripId}`, payload).then(res => res.data);
}

export function loginUser(email: string, password: string) {
  return api.post('/auth/login', { email, password }).then(res => res.data);
}

export function createUser(payload: { nombre: string; email: string; password: string }) {
  return api.post('/users', payload).then(res => res.data);
}

export function updateUser(userId: number, payload: { nombre: string }) {
  return api.patch(`/users/${userId}`, payload).then(res => res.data);
}

export function getUserVehicles(userId: number) {
  return api.get(`/users/${userId}/vehicles`).then(res => res.data);
}

export function getUserMonthlyStats(userId: number, month: number, year: number) {
  return api.get(`/users/${userId}/stats`, { params: { month, year } }).then(res => res.data);
}

export function createVehicle(payload: { marca: string; modelo: string; anio: number; placa?: string }) {
  return api.post('/vehicles', payload).then(res => res.data);
}

export function createVehicleForUser(userId: number | string, payload: { marca: string; modelo: string; anio: number; placa?: string }) {
  return api.post(`/users/${userId}/vehicles`, payload).then(res => res.data);
}

export function updateVehicle(vehicleId: number, payload: { placa?: string; kilometrajeActual?: number; valorCompra?: number; valorAlquiler?: number; vidaUtilKm?: number; rendimientoKmGalon?: number }) {
  return api.patch(`/vehicles/${vehicleId}`, payload).then(res => res.data);
}
