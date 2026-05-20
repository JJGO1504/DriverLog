import { ChangeEvent, FormEvent, useState } from 'react';
import { Trip } from '../types';

interface TripFormProps {
  onSubmit: (trip: Omit<Trip, 'id'>) => void;
}

const initialState = {
  fecha: new Date().toISOString().slice(0, 10),
  ingresoBruto: 0,
  kmRecorridos: 0,
  gastoCombustible: 0,
  userId: 1,
  vehicleId: 1,
};

export default function TripForm({ onSubmit }: TripFormProps) {
  const [formState, setFormState] = useState<Omit<Trip, 'id'>>(initialState);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState(prev => ({
      ...prev,
      [name]: name === 'fecha' ? value : Number(value),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Registrar nuevo viaje</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Fecha</span>
          <input name="fecha" type="date" value={formState.fecha} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Ingreso bruto</span>
          <input name="ingresoBruto" type="number" value={formState.ingresoBruto} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">KM recorridos</span>
          <input name="kmRecorridos" type="number" value={formState.kmRecorridos} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Gasto de combustible</span>
          <input name="gastoCombustible" type="number" value={formState.gastoCombustible} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">ID de vehículo</span>
          <input name="vehicleId" type="number" value={formState.vehicleId} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 p-2" />
        </label>
      </div>
      <button type="submit" className="btn w-full">
        Guardar viaje
      </button>
    </form>
  );
}
