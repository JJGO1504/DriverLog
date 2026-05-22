import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarPlus,
  Fuel,
  Car,
  BarChart3,
  LogOut,
  ChevronDown,
  Calendar,
  Camera,
  Plus,
  DollarSign,
  Gauge,
  Flame,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { User, Vehicle, Trip } from '../types';

const API = 'http://localhost:3000/api';

type NavItem = 'dashboard' | 'register' | 'fuel' | 'vehicles' | 'analytics' | 'profile';

const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { id: 'register', label: 'Registrar Viaje', icon: CalendarPlus },
  { id: 'fuel', label: 'Control de Gasolina', icon: Fuel },
  { id: 'vehicles', label: 'Mis Vehículos', icon: Car },
  { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
];

interface TripWithVehicle extends Trip {
  vehicle?: Vehicle;
}

interface FuelEntry {
  id: string;
  fecha: string;
  cantidad: string;
  kilometraje: string;
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function DriverDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<TripWithVehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    ingresoBruto: '',
    kmRecorridos: '',
    gastoCombustible: '',
  });

  const [vehicleForm, setVehicleForm] = useState({ marca: '', modelo: '', anio: '', placa: '' });
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleDetail, setVehicleDetail] = useState({ placa: '', kilometrajeActual: 0, valorCompra: 0, valorAlquiler: 0, vidaUtilKm: 1 });
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);

  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [fuelForm, setFuelForm] = useState({ fecha: new Date().toISOString().slice(0, 10), cantidad: '', kilometraje: '' });

  const [monthlyStats, setMonthlyStats] = useState<{ gross: number; fuel: number; km: number; count: number } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const api = {
    getUserProfile: (userId: number) =>
      fetch(`${API}/users/${userId}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    getUserVehicles: (userId: number) =>
      fetch(`${API}/users/${userId}/vehicles`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    updateUser: (userId: number, payload: { nombre: string }) =>
      fetch(`${API}/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    createVehicleForUser: (userId: number, payload: { marca: string; modelo: string; anio: number; placa: string }) =>
      fetch(`${API}/users/${userId}/vehicles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    updateVehicle: (vehicleId: number, payload: { placa?: string; kilometrajeActual?: number; valorCompra?: number; valorAlquiler?: number; vidaUtilKm?: number }) =>
      fetch(`${API}/vehicles/${vehicleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    submitTrip: (payload: { fecha: string; ingresoBruto: number; kmRecorridos: number; gastoCombustible: number; userId: number; vehicleId: number }) =>
      fetch(`${API}/trips`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
    getUserMonthlyStats: (userId: number, month: number, year: number) =>
      fetch(`${API}/users/${userId}/stats?month=${month}&year=${year}`).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [profileData, vehData] = await Promise.all([
        api.getUserProfile(currentUser.id),
        api.getUserVehicles(currentUser.id),
      ]);
      setUsuario(profileData);
      setProfileName(profileData.nombre);
      setTrips(profileData.trips ?? []);
      setVehiculo(vehData.vehicles?.[0] ?? null);
    } catch {
      setUsuario(null);
      setVehiculo(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getUserMonthlyStats(currentUser.id, selectedMonth, selectedYear);
      setMonthlyStats(data);
    } catch {
      setMonthlyStats(null);
    }
  };

  useEffect(() => {
    if (activeNav === 'analytics' && currentUser) {
      loadMonthlyStats();
    }
  }, [activeNav, selectedMonth, selectedYear, currentUser]);

  const defaultVehicleId = vehiculo?.id ?? 1;

  const handleRegisterTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const payload = {
      fecha: form.fecha,
      ingresoBruto: Number(form.ingresoBruto),
      kmRecorridos: Number(form.kmRecorridos),
      gastoCombustible: Number(form.gastoCombustible),
      userId: currentUser.id,
      vehicleId: defaultVehicleId,
    };
    if (!payload.ingresoBruto || !payload.kmRecorridos) return;
    setSubmitting(true);
    try {
      await api.submitTrip(payload);
      setForm({ fecha: new Date().toISOString().slice(0, 10), ingresoBruto: '', kmRecorridos: '', gastoCombustible: '' });
      await loadData();
    } catch {
      alert('Error registrando viaje');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (vehiculo) {
      setVehicleDetail({
        placa: vehiculo.placa || '',
        kilometrajeActual: vehiculo.kilometrajeActual,
        valorCompra: vehiculo.valorCompra,
        valorAlquiler: vehiculo.valorAlquiler,
        vidaUtilKm: vehiculo.vidaUtilKm,
      });
    }
  }, [vehiculo]);

  const handleUpdateVehicle = async () => {
    if (!vehiculo) return;
    setVehicleSaving(true);
    try {
      const payload = { ...vehicleDetail, placa: vehicleDetail.placa.trim().toUpperCase() };
      const { vehicle } = await api.updateVehicle(vehiculo.id, payload);
      setVehiculo(vehicle);
      setVehicleSaved(true);
      setTimeout(() => setVehicleSaved(false), 2500);
    } catch {
      alert('Error actualizando el vehículo');
    } finally {
      setVehicleSaving(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !vehicleForm.marca.trim() || !vehicleForm.modelo.trim() || !vehicleForm.anio) return;
    setVehicleSubmitting(true);
    try {
      await api.createVehicleForUser(currentUser.id, {
        marca: vehicleForm.marca.trim(),
        modelo: vehicleForm.modelo.trim(),
        anio: Number(vehicleForm.anio),
        placa: vehicleForm.placa.trim(),
      });
      setVehicleForm({ marca: '', modelo: '', anio: '', placa: '' });
      setShowVehicleForm(false);
      await loadData();
    } catch {
      alert('Error creando vehículo');
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !usuario || !profileName.trim()) return;
    setProfileSaving(true);
    try {
      const { user } = await api.updateUser(currentUser.id, { nombre: profileName.trim() });
      setUsuario((prev: User | null) => prev ? { ...prev, nombre: user.nombre } : prev);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      alert('Error guardando perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddFuelEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelForm.cantidad.trim() || !fuelForm.kilometraje.trim()) return;
    setFuelEntries((prev) => [
      { id: crypto.randomUUID(), ...fuelForm },
      ...prev,
    ]);
    setFuelForm({ fecha: new Date().toISOString().slice(0, 10), cantidad: '', kilometraje: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const calcNetProfit = (trip: TripWithVehicle): number => {
    if (!trip.vehicle || trip.vehicle.vidaUtilKm <= 0) return trip.ingresoBruto - trip.gastoCombustible;
    const depreciationPerKm =
      (trip.vehicle.valorCompra - trip.vehicle.valorReventaEstimado) / trip.vehicle.vidaUtilKm;
    return trip.ingresoBruto - trip.gastoCombustible - depreciationPerKm * trip.kmRecorridos;
  };

  const distanceBars = [35, 60, 45, 80, 55, 70, 40];
  const fuelBars = [50, 40, 65, 35, 55, 45, 60];
  const totalEarnings = trips.reduce((s, t) => s + t.ingresoBruto, 0);
  const totalFuel = trips.reduce((s, t) => s + t.gastoCombustible, 0);
  const totalNet = trips.reduce((s, t) => s + calcNetProfit(t), 0);

  const renderContent = () => {
    switch (activeNav) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            <div className="card p-8 text-center">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-500/20 border-2 border-cyan-400/40 overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Foto" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-cyan-300">{usuario?.nombre?.charAt(0) ?? '?'}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 border-2 border-[#161b22] text-black transition hover:bg-cyan-400"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              <h2 className="heading-lg mb-6">Mi Perfil</h2>

              <div className="space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Nombre Completo</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Correo Electrónico</label>
                  <input
                    value={usuario?.email ?? ''}
                    readOnly
                    className="w-full rounded-xl border border-dashed border-gray-700 bg-gray-800/50 px-4 py-3 text-gray-400 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={profileSaving}
                className="btn-premium mt-6 w-full"
              >
                {profileSaving ? 'Guardando...' : profileSaved ? '¡Guardado!' : 'Guardar Cambios'}
              </button>
            </div>
          </motion.div>
        );

      case 'dashboard':
        return (
          <>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="card p-6">
              <h2 className="mb-4 heading-lg">Registro Rápido de Viaje</h2>
              <form onSubmit={handleRegisterTrip}>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Fecha</label>
                    <div className="relative">
                      <input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                        required
                        className="input-premium w-full" />
                      <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Ingreso Bruto</label>
                    <input type="number" step="0.01" min="0" value={form.ingresoBruto}
                      onChange={(e) => setForm({ ...form, ingresoBruto: e.target.value })} required placeholder="$ 0.00"
                      className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Kilómetros Recorridos</label>
                    <input type="number" step="0.1" min="0" value={form.kmRecorridos}
                      onChange={(e) => setForm({ ...form, kmRecorridos: e.target.value })} required placeholder="0 km"
                      className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Gasto de Combustible</label>
                    <input type="number" step="0.01" min="0" value={form.gastoCombustible}
                      onChange={(e) => setForm({ ...form, gastoCombustible: e.target.value })} required placeholder="$ 0.00"
                      className="input-premium w-full" />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className="btn-premium mt-4 w-full">
                  {submitting ? 'Registrando...' : 'Registrar Viaje'}
                </button>
              </form>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="card p-6">
              <h2 className="mb-4 heading-lg">Viajes Recientes</h2>
              {trips.length === 0 ? (
                <p className="text-sm text-gray-500">No hay viajes registrados aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium">
                    <thead>
                      <tr className="text-gray-400 text-sm font-medium border-b border-gray-800">
                        <th className="pb-3 text-left">Fecha</th>
                        <th className="pb-3 text-right">Ingreso Bruto</th>
                        <th className="pb-3 text-right">Gasto Combustible</th>
                        <th className="pb-3 text-right">Ganancia Neta</th>
                        <th className="pb-3 text-left">Vehículo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => {
                        const net = calcNetProfit(trip);
                        return (
                          <tr key={trip.id} className="border-b border-gray-800/50 last:border-0">
                            <td className="py-3 text-gray-300">{new Date(trip.fecha).toLocaleDateString('es-ES')}</td>
                            <td className="py-3 text-right text-gray-300">${trip.ingresoBruto.toFixed(2)}</td>
                            <td className="py-3 text-right text-gray-300">${trip.gastoCombustible.toFixed(2)}</td>
                            <td className={`py-3 text-right font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>${net.toFixed(2)}</td>
                            <td className="py-3 text-gray-300">{trip.vehicle ? `${trip.vehicle.marca} ${trip.vehicle.modelo}` : `ID: ${trip.vehicleId}`}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card p-6">
              <h2 className="mb-4 heading-lg">Métricas del Vehículo</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Distancia de Viajes</p>
                  <div className="flex items-end gap-2 h-24">
                    {distanceBars.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-cyan-500/60 transition-all duration-500" style={{ height: `${h}%` }} />
                        <span className="text-[10px] text-gray-500">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Consumo de Combustible</p>
                  <div className="flex items-end gap-2 h-24">
                    {fuelBars.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-gray-400/40 transition-all duration-500" style={{ height: `${h}%` }} />
                        <span className="text-[10px] text-gray-500">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Ganancias Netas Estimadas</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Ingresos</span>
                      <span className="text-white font-medium">${totalEarnings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Combustible</span>
                      <span className="text-red-400 font-medium">-${totalFuel.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-800 pt-2 flex justify-between text-sm">
                      <span className="text-gray-300">Ganancia Neta</span>
                      <span className={`font-bold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>${totalNet.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        );

      case 'register':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            <div className="card p-6">
              <h2 className="mb-4 heading-lg">Registrar Nuevo Viaje</h2>
              <form onSubmit={handleRegisterTrip} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Fecha del Viaje</label>
                  <input type="date" value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })} required
                    className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Ingreso Bruto ($)</label>
                  <input type="number" step="0.01" min="0" value={form.ingresoBruto}
                    onChange={(e) => setForm({ ...form, ingresoBruto: e.target.value })} required placeholder="0.00"
                    className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Kilómetros Recorridos</label>
                  <input type="number" step="0.1" min="0" value={form.kmRecorridos}
                    onChange={(e) => setForm({ ...form, kmRecorridos: e.target.value })} required placeholder="0"
                    className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Gasto de Combustible ($)</label>
                  <input type="number" step="0.01" min="0" value={form.gastoCombustible}
                    onChange={(e) => setForm({ ...form, gastoCombustible: e.target.value })} required placeholder="0.00"
                    className="input-premium w-full" />
                </div>
                <button type="submit" disabled={submitting}
                  className="btn-premium w-full">
                  {submitting ? 'Guardando...' : 'Guardar Viaje'}
                </button>
              </form>
            </div>
          </motion.div>
        );

      case 'fuel':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">
            <div className="card p-6">
              <h2 className="mb-4 heading-lg">Registrar Carga de Combustible</h2>
              <form onSubmit={handleAddFuelEntry} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Fecha</label>
                  <input type="date" value={fuelForm.fecha}
                    onChange={(e) => setFuelForm({ ...fuelForm, fecha: e.target.value })} required
                    className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Cantidad ($ o Galones)</label>
                  <input type="text" value={fuelForm.cantidad}
                    onChange={(e) => setFuelForm({ ...fuelForm, cantidad: e.target.value })} required placeholder="Ej: 50.00"
                    className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Kilometraje Actual</label>
                  <input type="text" value={fuelForm.kilometraje}
                    onChange={(e) => setFuelForm({ ...fuelForm, kilometraje: e.target.value })} required placeholder="Ej: 12500"
                    className="input-premium w-full" />
                </div>
                <button type="submit"
                  className="btn-premium w-full">
                  Agregar Carga
                </button>
              </form>
            </div>

            {fuelEntries.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-3 text-sm font-semibold text-white">Historial de Cargas</h3>
                <div className="space-y-2">
                  {fuelEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-4 py-2 text-sm">
                      <span className="text-gray-400">{new Date(e.fecha).toLocaleDateString('es-ES')}</span>
                      <span className="text-cyan-300 font-medium">{e.cantidad}</span>
                      <span className="text-gray-500">{e.kilometraje} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      case 'vehicles':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-6">
            <div className="card p-6">
              <h2 className="heading-lg mb-4">Mis Vehículos</h2>

              {vehiculo ? (
                <div className="space-y-6">
                  {/* Read-only vehicle info */}
                  <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15">
                        <Car size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-cyan-400 uppercase tracking-wider font-medium">Tu Vehículo Activo</p>
                        <p className="text-lg font-semibold text-white">{vehiculo.marca} {vehiculo.modelo}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="rounded-lg bg-black/30 border border-gray-800 px-3 py-2 inline-block">
                        <p className="text-xs text-gray-500">Año</p>
                        <p className="text-white font-medium">{vehiculo.anio}</p>
                      </div>
                    </div>
                  </div>

                  {/* Editable operational fields */}
                  <div className="rounded-xl border border-gray-700 bg-black/30 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Detalle Operativo</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Placa del Vehículo</label>
                        <input type="text"
                          value={vehicleDetail.placa}
                          onChange={(e) => setVehicleDetail({ ...vehicleDetail, placa: e.target.value.toUpperCase() })}
                          placeholder="ABC123"
                          maxLength={10}
                          className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Kilometraje Actual</label>
                        <input type="number" min="0" step="0.1"
                          value={vehicleDetail.kilometrajeActual}
                          onChange={(e) => setVehicleDetail({ ...vehicleDetail, kilometrajeActual: Number(e.target.value) })}
                          className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Valor de Compra (COP)</label>
                        <input type="number" min="0" step="1000"
                          value={vehicleDetail.valorCompra}
                          onChange={(e) => setVehicleDetail({ ...vehicleDetail, valorCompra: Number(e.target.value) })}
                          className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Valor de la Renta / Alquiler (COP)</label>
                        <input type="number" min="0" step="1000"
                          value={vehicleDetail.valorAlquiler}
                          onChange={(e) => setVehicleDetail({ ...vehicleDetail, valorAlquiler: Number(e.target.value) })}
                          className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Vida Útil en Kilómetros</label>
                        <input type="number" min="1" step="1000"
                          value={vehicleDetail.vidaUtilKm}
                          onChange={(e) => setVehicleDetail({ ...vehicleDetail, vidaUtilKm: Number(e.target.value) })}
                          className="input-premium w-full" />
                      </div>

                      <button onClick={handleUpdateVehicle} disabled={vehicleSaving}
                        className="btn-premium w-full">
                        {vehicleSaving ? 'Guardando...' : vehicleSaved ? '¡Datos del vehículo actualizados correctamente!' : 'Actualizar Datos del Vehículo'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : showVehicleForm ? (
                <form onSubmit={handleAddVehicle} className="space-y-3 rounded-xl border border-gray-700 bg-black/30 p-4">
                  <input value={vehicleForm.marca} onChange={(e) => setVehicleForm({ ...vehicleForm, marca: e.target.value })}
                    placeholder="Marca" required
                    className="input-premium w-full" />
                  <input value={vehicleForm.modelo} onChange={(e) => setVehicleForm({ ...vehicleForm, modelo: e.target.value })}
                    placeholder="Modelo" required
                    className="input-premium w-full" />
                  <input type="number" value={vehicleForm.anio} onChange={(e) => setVehicleForm({ ...vehicleForm, anio: e.target.value })}
                    placeholder="Año" required
                    className="input-premium w-full" />
                  <input value={vehicleForm.placa} onChange={(e) => setVehicleForm({ ...vehicleForm, placa: e.target.value })}
                    placeholder="Placa (opcional)"
                    className="input-premium w-full" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={vehicleSubmitting}
                      className="btn-premium flex-1 text-sm py-2">
                      {vehicleSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
                    </button>
                    <button type="button" onClick={() => { setShowVehicleForm(false); setVehicleForm({ marca: '', modelo: '', anio: '', placa: '' }); }}
                      className="btn-ghost text-sm py-2 px-4">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No tienes vehículos registrados.</p>
                  <button onClick={() => setShowVehicleForm(true)}
                    className="btn-premium">
                    <Plus size={16} /> Registrar Vehículo
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-lg">Estadísticas Mensuales</h2>
                <div className="flex gap-2">
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="input-premium text-xs py-1.5 px-3">
                    {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="input-premium text-xs py-1.5 px-3">
                    {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {monthlyStats ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                    <div className="flex justify-center mb-1"><DollarSign size={18} className="text-green-400" /></div>
                    <p className="text-lg font-bold text-green-400">${monthlyStats.gross.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ingresos</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                    <div className="flex justify-center mb-1"><Flame size={18} className="text-red-400" /></div>
                    <p className="text-lg font-bold text-red-400">${monthlyStats.fuel.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Combustible</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                    <div className="flex justify-center mb-1"><Gauge size={18} className="text-cyan-400" /></div>
                    <p className="text-lg font-bold text-cyan-400">{monthlyStats.km.toFixed(1)} km</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Distancia</p>
                  </div>
                  <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                    <div className="flex justify-center mb-1"><BarChart3 size={18} className="text-blue-400" /></div>
                    <p className="text-lg font-bold text-blue-400">{monthlyStats.count}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Viajes</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Selecciona un mes para ver estadísticas.</p>
              )}
            </div>

            {monthlyStats && monthlyStats.count > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Resumen del Mes</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Ingreso Bruto</span><span>${monthlyStats.gross.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-green-500/70 transition-all" style={{ width: `${Math.min(100, (monthlyStats.gross / (monthlyStats.gross + monthlyStats.fuel || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Gasto Combustible</span><span>${monthlyStats.fuel.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500/70 transition-all" style={{ width: `${Math.min(100, (monthlyStats.fuel / (monthlyStats.gross + monthlyStats.fuel || 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Ganancia Neta</span><span>${(monthlyStats.gross - monthlyStats.fuel).toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${monthlyStats.gross - monthlyStats.fuel >= 0 ? 'bg-cyan-500/70' : 'bg-red-500/70'}`}
                        style={{ width: `${Math.min(100, Math.abs((monthlyStats.gross - monthlyStats.fuel) / (monthlyStats.gross || 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0d1117] text-white overflow-hidden">
      <aside className="w-64 bg-[#161b22] border-r border-gray-800 flex flex-col justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 px-6 pt-6 pb-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/40">
              <span className="text-cyan-400 text-sm font-black">D</span>
            </span>
            <span className="text-lg font-bold tracking-tight text-cyan-400">DriverLog</span>
          </div>

          <button onClick={() => setActiveNav('profile')}
            className="mx-4 mb-6 flex w-[calc(100%-32px)] items-center gap-3 rounded-xl border border-gray-800 bg-black/30 px-4 py-3 transition hover:border-cyan-500/30 hover:bg-cyan-500/5 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                usuario?.nombre?.charAt(0) ?? '?'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre ?? 'Conductor'}</p>
              <p className="text-xs text-gray-500 truncate">{usuario?.email ?? ''}</p>
            </div>
            <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
          </button>

          <nav className="px-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => setActiveNav(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-4 pb-6">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl py-3 px-4 text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>
            <motion.h1 key={activeNav} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="heading-xl">
              {activeNav === 'profile' ? 'Mi Perfil' : (navItems.find((n) => n.id === activeNav)?.label ?? 'Panel de Control')}
            </motion.h1>
            {renderContent()}
          </>
        )}
      </main>
    </div>
  );
}
