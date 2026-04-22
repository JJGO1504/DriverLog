import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TripService {
  /**
   * Calculate Cost per Kilometer (CPK)
   * @param vehicle The vehicle data
   * @returns The CPK value
   */
  static calculateCPK(vehicle: any): number {
    if (vehicle.vidaUtilKm <= 0) {
      throw new Error('Vida útil en km debe ser mayor a cero');
    }
    if (vehicle.valorCompra < vehicle.valorReventaEstimado) {
      throw new Error('Valor de compra debe ser mayor o igual al valor de reventa estimado');
    }
    return (vehicle.valorCompra - vehicle.valorReventaEstimado) / vehicle.vidaUtilKm;
  }

  /**
   * Get Net Profit for a trip
   * @param trip The trip data
   * @param vehicle The vehicle data
   * @returns The net profit
   */
  static getNetProfit(trip: any, vehicle: any): number {
    if (trip.kmRecorridos < 0 || trip.ingresoBruto < 0 || trip.gastoCombustible < 0) {
      throw new Error('Valores de viaje deben ser no negativos');
    }
    const cpk = this.calculateCPK(vehicle);
    return trip.ingresoBruto - trip.gastoCombustible - (trip.kmRecorridos * cpk);
  }

  /**
   * Check if vehicle mileage is approaching maintenance intervals
   * @param vehicle The vehicle data
   * @param maintenances List of maintenances
   * @returns List of alerts
   */
  static checkMaintenanceAlerts(vehicle: any, maintenances: any[]): string[] {
    if (!maintenances || maintenances.length === 0) {
      return [];
    }
    return maintenances
      .filter(maintenance => {
        const remainingKm = maintenance.intervaloKm - vehicle.kilometrajeActual;
        return remainingKm <= 1000;
      })
      .map(maintenance => {
        const remainingKm = maintenance.intervaloKm - vehicle.kilometrajeActual;
        if (remainingKm <= 0) {
          return `Mantenimiento: ${maintenance.descripcion} - Vencido por ${Math.abs(remainingKm).toFixed(2)} km`;
        }
        return `Mantenimiento: ${maintenance.descripcion} - ${remainingKm.toFixed(2)} km restantes`;
      });
  }

  /**
   * Get monthly profit for a user
   * @param userId The user ID
   * @param month The month (1-12)
   * @param year The year
   * @returns The total profit for the month
   */
  static async getMonthlyProfit(userId: number, month: number, year: number): Promise<number> {
    if (month < 1 || month > 12) {
      throw new Error('Mes debe estar entre 1 y 12');
    }
    if (year < 1900 || year > new Date().getFullYear() + 10) {
      throw new Error('Año inválido');
    }
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const trips = await prisma.trip.findMany({
      where: {
        userId,
        fecha: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        vehicle: true,
      },
    });

    return trips.reduce((total: number, trip: any) => {
      const vehicle = trip.vehicle;
      return total + this.getNetProfit(trip, vehicle);
    }, 0);
  }
}
