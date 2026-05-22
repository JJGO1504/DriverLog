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
