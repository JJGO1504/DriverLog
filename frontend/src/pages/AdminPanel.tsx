import { useEffect, useState } from 'react';
import { getAdminStats, getMaintenanceAlerts } from '../services/api';
import { Role } from '../types';

interface Stats {
  totalDrivers: number;
  totalVehicles: number;
  totalTrips: number;
  totalNetProfit: number;
  averageProfitPerDriver: number;
}

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const statsData = await getAdminStats('SUPERUSER');
        const alertData = await getMaintenanceAlerts('SUPERUSER');
        setStats(statsData);
        setAlerts(alertData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Panel global de administración</h2>
        <p className="mt-2 text-slate-600">Visualiza estadísticas agregadas de todos los conductores y alertas de mantenimiento del sistema.</p>
      </section>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">Cargando métricas...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Estadísticas agregadas</h3>
            {stats ? (
              <ul className="mt-4 space-y-3 text-slate-700">
                <li>Total conductores: {stats.totalDrivers}</li>
                <li>Total vehículos: {stats.totalVehicles}</li>
                <li>Total viajes registrados: {stats.totalTrips}</li>
                <li>Total ganancia neta real: ${stats.totalNetProfit.toFixed(2)}</li>
                <li>Ganancia media por conductor: ${stats.averageProfitPerDriver.toFixed(2)}</li>
              </ul>
            ) : (
              <p>No hay datos disponibles.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Alertas de mantenimiento</h3>
            {alerts.length > 0 ? (
              <ul className="mt-4 space-y-2 text-slate-700">
                {alerts.map((alert, index) => (
                  <li key={index} className="rounded-xl bg-slate-50 p-3 text-sm">
                    {alert}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-slate-600">No hay alertas de mantenimiento activas.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
