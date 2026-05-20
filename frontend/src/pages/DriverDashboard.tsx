import { useState } from 'react';
import { submitTrip } from '../services/api';
import TripForm from '../components/TripForm';

export default function DriverDashboard() {
  const [result, setResult] = useState<string>('No hay viajes registrados en esta sesión.');

  const handleTripSubmit = async (tripData: any) => {
    try {
      const response = await submitTrip(tripData);
      setResult(
        `Viaje registrado. Ganancia Neta Real estimada: ${response.netProfit.toFixed(2)} ` +
          `para el ingreso bruto ${response.trip.ingresoBruto}`
      );
    } catch (error) {
      setResult('No se pudo registrar el viaje. Verifica los datos e intenta nuevamente.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold">Dashboard del conductor</h2>
        <p className="mt-2 text-slate-600">
          Aquí puedes registrar viajes diarios y ver tu métrica de ganancia real basada en ingreso bruto, gasto de combustible y depreciación por kilómetro.
        </p>
      </section>

      <TripForm onSubmit={handleTripSubmit} />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">Métrica de Ganancia Real</h3>
        <p className="mt-3 text-slate-700">{result}</p>
      </section>
    </div>
  );
}
