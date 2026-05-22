export type CategoriaMantenimiento = 'MOTOR' | 'FRENOS' | 'SUSPENSION' | 'LLANTAS' | 'OTROS';

export type Role = 'USER' | 'SUPERUSER';

export interface User {
  id: number;
  nombre: string;
  email: string;
  role: Role;
}

export interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  kilometrajeActual: number;
  valorCompra: number;
  valorAlquiler: number;
  valorReventaEstimado: number;
  vidaUtilKm: number;
  rendimientoKmGalon: number;
}

export interface Maintenance {
  id: number;
  descripcion: string;
  categoria: CategoriaMantenimiento;
  intervaloKm: number;
  costoEstimado: number;
  vehicleId: number | null;
}

export interface MaintenanceAlert extends Maintenance {
  remainingKm: number;
}

export interface Trip {
  id: number;
  fecha: string;
  ingresoBruto: number;
  kmRecorridos: number;
  gastoCombustible: number;
  userId: number;
  vehicleId: number;
  vehicle?: Vehicle;
}
