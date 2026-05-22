import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, CalendarPlus, Fuel, Car, BarChart3, LogOut, ChevronDown, Calendar, Camera, Plus,
  DollarSign, Gauge, Flame, Edit3, X, Wrench, Download, ChevronLeft, ChevronRight, AlertTriangle, FileText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import * as api from '../services/api';
import type { User, Vehicle, Trip, FuelEntry, Maintenance, MaintenanceAlert, CategoriaMantenimiento, VehicleDocument } from '../types';

const PRECIO_GALON = 15500;
const CATS: CategoriaMantenimiento[] = ['MOTOR', 'FRENOS', 'SUSPENSION', 'LLANTAS', 'OTROS'];

const formatCOP = (v: number) => Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);
const toDigits = (v: string) => v.replace(/\D/g, '');
const formatMiles = (v: string) => { const d = toDigits(v); return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''; };
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

type NavItem = 'dashboard' | 'register' | 'fuel' | 'vehicles' | 'maintenance' | 'analytics' | 'profile';
const navItems: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
  { id: 'register', label: 'Registrar Viaje', icon: CalendarPlus },
  { id: 'fuel', label: 'Control de Gasolina', icon: Fuel },
  { id: 'vehicles', label: 'Mis Vehículos', icon: Car },
  { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
];

interface TripWithVehicle extends Trip { vehicle?: Vehicle; }

export default function DriverDashboard() {
  const { currentUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [vehiculoActivo, setVehiculoActivo] = useState<number | null>(null);
  const [trips, setTrips] = useState<TripWithVehicle[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const vehiculo = useMemo(() => vehiculos.find(v => v.id === vehiculoActivo) ?? vehiculos[0] ?? null, [vehiculos, vehiculoActivo]);

  const [form, setForm] = useState({ fecha: todayStr(), ingresoBruto: '', kmRecorridos: '' });
  const [vehicleForm, setVehicleForm] = useState({ marca: '', modelo: '', anio: '', placa: '' });
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleDetail, setVehicleDetail] = useState({ placa: '', kilometrajeActual: '', valorCompra: '', valorAlquiler: '', vidaUtilKm: '', rendimientoKmGalon: '' });
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripWithVehicle | null>(null);
  const [editForm, setEditForm] = useState({ ingresoBruto: '', kmRecorridos: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [statsTab, setStatsTab] = useState<'diario' | 'semanal' | 'mensual'>('diario');

  // Mantenimiento
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [maintForm, setMaintForm] = useState({ descripcion: '', categoria: 'OTROS' as CategoriaMantenimiento, intervaloKm: '', costoEstimado: '' });
  const [maintSubmitting, setMaintSubmitting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [deleteMaintId, setDeleteMaintId] = useState<number | null>(null);

  // Gasolina persistente
  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>([]);
  const [fuelForm, setFuelForm] = useState({ fecha: todayStr(), cantidad: '', kilometraje: '', costoTotal: '' });
  const [fuelSubmitting, setFuelSubmitting] = useState(false);
  const [fuelDeleteId, setFuelDeleteId] = useState<number | null>(null);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const totalPages = Math.max(1, Math.ceil(trips.length / pageSize));
  const paginatedTrips = trips.slice((page - 1) * pageSize, page * pageSize);

  // Documentos del vehículo
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [docForm, setDocForm] = useState({ tipo: 'SOAT' as VehicleDocument['tipo'], fechaExpedicion: '', fechaVencimiento: '' });
  const [docSubmitting, setDocSubmitting] = useState(false);
  const [docDeleteId, setDocDeleteId] = useState<number | null>(null);

  // Metas financieras
  const [goalDiario, setGoalDiario] = useState(() => Number(localStorage.getItem('goal_diario') || '0'));
  const [goalSemanal, setGoalSemanal] = useState(() => Number(localStorage.getItem('goal_semanal') || '0'));
  const [goalMensual, setGoalMensual] = useState(() => Number(localStorage.getItem('goal_mensual') || '0'));
  const [editGoal, setEditGoal] = useState<{ tipo: string; valor: string } | null>(null);

  const saveGoal = (tipo: string, val: number) => {
    localStorage.setItem(`goal_${tipo}`, String(val));
    if (tipo === 'diario') setGoalDiario(val);
    else if (tipo === 'semanal') setGoalSemanal(val);
    else if (tipo === 'mensual') setGoalMensual(val);
    setEditGoal(null);
    addToast('Meta guardada', 'success');
  };

  const loadData = useCallback(async () => {
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
      setVehiculos(vehData.vehicles ?? []);
      setPage(1);
    } catch {
      setUsuario(null);
      setVehiculos([]);
      addToast('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    if (!currentUser) { navigate('/'); return; }
    loadData();
  }, [currentUser]);

  useEffect(() => { if (vehiculo) setVehiculoActivo(vehiculo.id); }, [vehiculos]);

  // Cargar mantenimientos y documentos cuando se navega a esas secciones
  const loadMaintenances = useCallback(async () => {
    if (!vehiculo) return;
    try {
      const [mData, aData] = await Promise.all([
        api.getVehicleMaintenances(vehiculo.id),
        api.getMaintenanceAlertsByVehicle(vehiculo.id),
      ]);
      setMaintenances(mData);
      setAlerts(aData);
    } catch { setMaintenances([]); setAlerts([]); }
  }, [vehiculo]);

  useEffect(() => { if (activeNav === 'maintenance' && vehiculo) loadMaintenances(); }, [activeNav, vehiculo, loadMaintenances]);

  const loadFuelEntries = useCallback(async () => {
    if (!currentUser) return;
    try { setFuelEntries(await api.getFuelEntries(currentUser.id)); } catch { setFuelEntries([]); }
  }, [currentUser]);

  useEffect(() => { if (activeNav === 'fuel' && currentUser) loadFuelEntries(); }, [activeNav, currentUser, loadFuelEntries]);

  const loadDocuments = useCallback(async () => {
    if (!vehiculo) return;
    try { setDocuments(await api.getVehicleDocuments(vehiculo.id)); } catch { setDocuments([]); }
  }, [vehiculo]);

  useEffect(() => { if (activeNav === 'vehicles' && vehiculo) loadDocuments(); }, [activeNav, vehiculo, loadDocuments]);

  // Handlers
  const handleOpenEdit = (trip: TripWithVehicle) => {
    setEditingTrip(trip);
    setEditForm({ ingresoBruto: String(trip.ingresoBruto), kmRecorridos: String(trip.kmRecorridos) });
  };

  const handleSaveEdit = async () => {
    if (!editingTrip || !currentUser) return;
    const rend = vehiculo?.rendimientoKmGalon || 1;
    const km = Number(editForm.kmRecorridos) || 0;
    setEditSaving(true);
    try {
      await api.updateTrip(editingTrip.id, {
        ingresoBruto: Number(editForm.ingresoBruto.replace(/\./g, '')) || 0,
        kmRecorridos: km,
        gastoCombustible: (km / rend) * PRECIO_GALON,
      });
      setEditingTrip(null);
      await loadData();
      addToast('Viaje actualizado', 'success');
    } catch { addToast('Error actualizando viaje', 'error'); } finally { setEditSaving(false); }
  };

  const handleRegisterTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !vehiculo) return;
    const rend = vehiculo.rendimientoKmGalon || 1;
    const km = Number(form.kmRecorridos) || 0;
    const payload = {
      fecha: form.fecha,
      ingresoBruto: Number(form.ingresoBruto.replace(/\./g, '')) || 0,
      kmRecorridos: km,
      gastoCombustible: (km / rend) * PRECIO_GALON,
      userId: currentUser.id,
      vehicleId: vehiculo.id,
    };
    if (!payload.ingresoBruto || !payload.kmRecorridos) return;
    setSubmitting(true);
    try {
      await api.submitTrip(payload);
      setForm({ fecha: todayStr(), ingresoBruto: '', kmRecorridos: '' });
      await loadData();
      addToast('Viaje registrado', 'success');
    } catch { addToast('Error registrando viaje', 'error'); } finally { setSubmitting(false); }
  };

  useEffect(() => {
    if (vehiculo) setVehicleDetail({
      placa: vehiculo.placa || '',
      kilometrajeActual: formatMiles(String(vehiculo.kilometrajeActual)),
      valorCompra: formatMiles(String(vehiculo.valorCompra)),
      valorAlquiler: formatMiles(String(vehiculo.valorAlquiler)),
      vidaUtilKm: formatMiles(String(vehiculo.vidaUtilKm)),
      rendimientoKmGalon: String(vehiculo.rendimientoKmGalon),
    });
  }, [vehiculo]);

  const handleUpdateVehicle = async () => {
    if (!vehiculo) return;
    setVehicleSaving(true);
    try {
      const s = (v: string) => v.replace(/\./g, '');
      const payload = {
        placa: vehicleDetail.placa.trim().toUpperCase(),
        kilometrajeActual: Number(s(vehicleDetail.kilometrajeActual)) || 0,
        valorCompra: Number(s(vehicleDetail.valorCompra)) || 0,
        valorAlquiler: Number(s(vehicleDetail.valorAlquiler)) || 0,
        vidaUtilKm: Number(s(vehicleDetail.vidaUtilKm)) || 1,
        rendimientoKmGalon: Number(vehicleDetail.rendimientoKmGalon) || 1,
      };
      await api.updateVehicle(vehiculo.id, payload);
      setVehicleSaved(true);
      setTimeout(() => setVehicleSaved(false), 2500);
      addToast('Vehículo actualizado', 'success');
    } catch { addToast('Error actualizando vehículo', 'error'); } finally { setVehicleSaving(false); }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !vehicleForm.marca.trim() || !vehicleForm.modelo.trim() || !vehicleForm.anio) return;
    setVehicleSubmitting(true);
    try {
      await api.createVehicleForUser(currentUser.id, {
        marca: vehicleForm.marca.trim(), modelo: vehicleForm.modelo.trim(),
        anio: Number(vehicleForm.anio), placa: vehicleForm.placa.trim(),
      });
      setVehicleForm({ marca: '', modelo: '', anio: '', placa: '' });
      setShowVehicleForm(false);
      await loadData();
      addToast('Vehículo registrado', 'success');
    } catch { addToast('Error creando vehículo', 'error'); } finally { setVehicleSubmitting(false); }
  };

  const handleSaveProfile = async () => {
    if (!currentUser || !profileName.trim()) return;
    setProfileSaving(true);
    try {
      const { user } = await api.updateUser(currentUser.id, { nombre: profileName.trim() });
      setUsuario(prev => prev ? { ...prev, nombre: user.nombre } : prev);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
      addToast('Perfil guardado', 'success');
    } catch { addToast('Error guardando perfil', 'error'); } finally { setProfileSaving(false); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // Fuel handlers (persistentes)
  const handleAddFuelEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !fuelForm.cantidad || !fuelForm.kilometraje) return;
    setFuelSubmitting(true);
    try {
      await api.createFuelEntry({
        fecha: fuelForm.fecha,
        cantidad: Number(fuelForm.cantidad),
        kilometraje: Number(fuelForm.kilometraje),
        costoTotal: Number(fuelForm.costoTotal) || 0,
        userId: currentUser.id,
        vehicleId: vehiculo?.id,
      });
      setFuelForm({ fecha: todayStr(), cantidad: '', kilometraje: '', costoTotal: '' });
      await loadFuelEntries();
      addToast('Carga registrada', 'success');
    } catch { addToast('Error registrando carga', 'error'); } finally { setFuelSubmitting(false); }
  };

  const handleDeleteFuel = async () => {
    if (!fuelDeleteId) return;
    try { await api.deleteFuelEntry(fuelDeleteId); await loadFuelEntries(); addToast('Carga eliminada', 'success'); }
    catch { addToast('Error eliminando carga', 'error'); } finally { setFuelDeleteId(null); }
  };

  // Maintenance handlers
  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculo || !maintForm.descripcion.trim() || !maintForm.intervaloKm || !maintForm.costoEstimado) return;
    setMaintSubmitting(true);
    try {
      await api.createMaintenance({
        descripcion: maintForm.descripcion.trim(), categoria: maintForm.categoria,
        intervaloKm: Number(maintForm.intervaloKm),
        costoEstimado: Number(maintForm.costoEstimado.replace(/\./g, '')),
        vehicleId: vehiculo.id,
      });
      setMaintForm({ descripcion: '', categoria: 'OTROS', intervaloKm: '', costoEstimado: '' });
      await loadMaintenances();
      addToast('Mantenimiento agregado', 'success');
    } catch { addToast('Error registrando mantenimiento', 'error'); } finally { setMaintSubmitting(false); }
  };

  const handleDeleteMaintenance = async () => {
    if (!deleteMaintId) return;
    try { await api.deleteMaintenance(deleteMaintId); await loadMaintenances(); addToast('Mantenimiento eliminado', 'success'); }
    catch { addToast('Error eliminando mantenimiento', 'error'); } finally { setDeleteMaintId(null); }
  };

  const handleSeedPlan = async () => {
    if (!vehiculo) return;
    setSeedLoading(true);
    try { await api.seedMaintenancePlan(vehiculo.id); await loadMaintenances(); addToast('Plan preventivo cargado', 'success'); }
    catch { addToast('Error cargando plan', 'error'); } finally { setSeedLoading(false); }
  };

  // Document handlers
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculo || !docForm.fechaExpedicion || !docForm.fechaVencimiento) return;
    setDocSubmitting(true);
    try {
      await api.createVehicleDocument({ ...docForm, vehicleId: vehiculo.id });
      setDocForm({ tipo: 'SOAT', fechaExpedicion: '', fechaVencimiento: '' });
      await loadDocuments();
      addToast('Documento agregado', 'success');
    } catch { addToast('Error agregando documento', 'error'); } finally { setDocSubmitting(false); }
  };

  const handleDeleteDoc = async () => {
    if (!docDeleteId) return;
    try { await api.deleteVehicleDocument(docDeleteId); await loadDocuments(); addToast('Documento eliminado', 'success'); }
    catch { addToast('Error eliminando documento', 'error'); } finally { setDocDeleteId(null); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  // CSV Export
  const handleExportCSV = async () => {
    if (!currentUser) return;
    try { await api.exportTripsCSV(currentUser.id); addToast('Exportación completada', 'success'); }
    catch { addToast('Error exportando datos', 'error'); }
  };

  // Analytics helpers
  const calcNetProfit = (trip: TripWithVehicle): number => {
    if (!trip.vehicle || trip.vehicle.vidaUtilKm <= 0) return trip.ingresoBruto - trip.gastoCombustible;
    const dep = (trip.vehicle.valorCompra - trip.vehicle.valorReventaEstimado) / trip.vehicle.vidaUtilKm;
    return trip.ingresoBruto - trip.gastoCombustible - dep * trip.kmRecorridos;
  };

  const totalEarnings = trips.reduce((s, t) => s + t.ingresoBruto, 0);
  const totalFuel = trips.reduce((s, t) => s + t.gastoCombustible, 0);
  const totalNet = trips.reduce((s, t) => s + calcNetProfit(t), 0);

  const filteredTrips = useMemo(() => {
    const now = todayStr();
    switch (statsTab) {
      case 'diario': return trips.filter(t => t.fecha.slice(0, 10) === now);
      case 'semanal': return trips.filter(t => t.fecha.slice(0, 10) >= daysAgoStr(7));
      case 'mensual': return trips.filter(t => t.fecha.slice(0, 7) === now.slice(0, 7));
    }
  }, [trips, statsTab]);

  const sGross = filteredTrips.reduce((s, t) => s + t.ingresoBruto, 0);
  const sFuel = filteredTrips.reduce((s, t) => s + t.gastoCombustible, 0);
  const sNet = filteredTrips.reduce((s, t) => s + calcNetProfit(t), 0);
  const sKm = filteredTrips.reduce((s, t) => s + t.kmRecorridos, 0);

  // Meta progress
  const goalProgress = useMemo(() => {
    const g = { diario: goalDiario, semanal: goalSemanal, mensual: goalMensual };
    const earned = { diario: sGross, semanal: trips.filter(t => t.fecha.slice(0, 10) >= daysAgoStr(7)).reduce((s, t) => s + t.ingresoBruto, 0), mensual: trips.filter(t => t.fecha.slice(0, 7) === todayStr().slice(0, 7)).reduce((s, t) => s + t.ingresoBruto, 0) };
    return { diario: { goal: g.diario, earned: earned.diario, pct: g.diario > 0 ? Math.min(100, (earned.diario / g.diario) * 100) : 0 },
      semanal: { goal: g.semanal, earned: earned.semanal, pct: g.semanal > 0 ? Math.min(100, (earned.semanal / g.semanal) * 100) : 0 },
      mensual: { goal: g.mensual, earned: earned.mensual, pct: g.mensual > 0 ? Math.min(100, (earned.mensual / g.mensual) * 100) : 0 } };
  }, [goalDiario, goalSemanal, goalMensual, sGross, trips]);

  const renderContent = () => {
    switch (activeNav) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
            <div className="card p-8 text-center">
              <div className="relative mx-auto mb-4 h-28 w-28">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-500/20 border-2 border-cyan-400/40 overflow-hidden">
                  {photoPreview ? <img src={photoPreview} alt="" className="h-full w-full object-cover" /> :
                    <span className="text-3xl font-bold text-cyan-300">{usuario?.nombre?.charAt(0) ?? '?'}</span>}
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 border-2 border-[#161b22] text-black hover:bg-cyan-400">
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <h2 className="heading-lg mb-6">Mi Perfil</h2>
              <div className="space-y-4 text-left">
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Nombre Completo</label>
                  <input value={profileName} onChange={e => setProfileName(e.target.value)} className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Correo Electrónico</label>
                  <input value={usuario?.email ?? ''} readOnly
                    className="w-full rounded-xl border border-dashed border-gray-700 bg-gray-800/50 px-4 py-3 text-gray-400 outline-none cursor-not-allowed" />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={profileSaving}
                className="btn-premium mt-6 w-full">
                {profileSaving ? 'Guardando...' : profileSaved ? '¡Guardado!' : 'Guardar Cambios'}
              </button>
            </div>
          </motion.div>
        );

      case 'dashboard':
        return (
          <>
            {/* Quick trip */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
              <h2 className="mb-4 heading-lg">Registro Rápido de Viaje</h2>
              <form onSubmit={handleRegisterTrip}>
                <div className="grid grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Fecha</label>
                    <div className="relative">
                      <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required className="input-premium w-full" />
                      <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Ingreso Bruto</label>
                    <input type="text" inputMode="numeric" value={form.ingresoBruto}
                      onChange={e => setForm({ ...form, ingresoBruto: formatMiles(e.target.value) })} required placeholder="$ 0" className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Kilómetros Recorridos</label>
                    <input type="number" step="0.1" min="0" value={form.kmRecorridos}
                      onChange={e => setForm({ ...form, kmRecorridos: e.target.value })} required placeholder="0 km" className="input-premium w-full" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Gasto Combustible</label>
                    <input type="text" value={vehiculo ? formatCOP((Number(form.kmRecorridos) / (vehiculo.rendimientoKmGalon || 1)) * PRECIO_GALON) : '$ 0'} readOnly
                      className="w-full rounded-xl border border-gray-700 bg-black/30 px-4 py-3 text-gray-400 outline-none cursor-not-allowed" />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-premium mt-4 w-full">
                  {submitting ? 'Registrando...' : 'Registrar Viaje'}
                </button>
              </form>
            </motion.div>

            {/* Metas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="heading-lg">Metas del Día</h2>
                <button onClick={() => setEditGoal({ tipo: 'diario', valor: String(goalDiario) })} className="text-xs text-cyan-400 hover:text-cyan-300">Editar metas</button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {(['diario', 'semanal', 'mensual'] as const).map(p => (
                  <div key={p} className="rounded-xl border border-gray-800 bg-black/30 p-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span className="capitalize">{p === 'diario' ? 'Hoy' : p === 'semanal' ? 'Semana' : 'Mes'}</span>
                      <span>{formatCOP(goalProgress[p].earned)} / {formatCOP(goalProgress[p].goal)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${goalProgress[p].pct >= 100 ? 'bg-green-500' : 'bg-cyan-500'}`}
                        style={{ width: `${goalProgress[p].pct}%` }} />
                    </div>
                    {goalProgress[p].goal > 0 && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        {goalProgress[p].pct >= 100 ? '¡Meta cumplida!' : `${goalProgress[p].pct.toFixed(0)}%`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent trips with pagination */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-lg">Viajes Recientes</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                  <span className="text-xs text-gray-500">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
                  <button onClick={handleExportCSV} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 ml-2">
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>
              {trips.length === 0 ? (
                <p className="text-sm text-gray-500">No hay viajes registrados aún.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-premium">
                    <thead>
                      <tr className="text-gray-400 text-sm font-medium border-b border-gray-800">
                        <th className="pb-3 text-left">Fecha</th><th className="pb-3 text-right">Ingreso</th>
                        <th className="pb-3 text-right">Combustible</th><th className="pb-3 text-right">Ganancia</th>
                        <th className="pb-3 text-left">Vehículo</th><th className="pb-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTrips.map(trip => {
                        const net = calcNetProfit(trip);
                        return (
                          <tr key={trip.id} className="border-b border-gray-800/50 last:border-0">
                            <td className="py-3 text-gray-300">{trip.fecha.slice(0, 10)}</td>
                            <td className="py-3 text-right text-gray-300">{formatCOP(trip.ingresoBruto)}</td>
                            <td className="py-3 text-right text-gray-300">{formatCOP(trip.gastoCombustible)}</td>
                            <td className={`py-3 text-right font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCOP(net)}</td>
                            <td className="py-3 text-gray-300">{trip.vehicle ? `${trip.vehicle.marca} ${trip.vehicle.modelo}` : `ID: ${trip.vehicleId}`}</td>
                            <td className="py-3 text-center">
                              <button onClick={() => handleOpenEdit(trip)} className="text-cyan-400 hover:text-cyan-300 transition p-1"><Edit3 size={15} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Metrics */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
              <h2 className="mb-4 heading-lg">Métricas del Vehículo</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Distancia de Viajes</p>
                  <div className="flex items-end gap-2 h-24">
                    {[35, 60, 45, 80, 55, 70, 40].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-cyan-500/60" style={{ height: `${h}%` }} />
                        <span className="text-[10px] text-gray-500">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Consumo Combustible</p>
                  <div className="flex items-end gap-2 h-24">
                    {[50, 40, 65, 35, 55, 45, 60].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full rounded-t bg-gray-400/40" style={{ height: `${h}%` }} />
                        <span className="text-[10px] text-gray-500">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                  <p className="text-xs text-gray-400 mb-3">Ganancias Netas</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Total Ingresos</span><span className="text-white font-medium">{formatCOP(totalEarnings)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Total Combustible</span><span className="text-red-400 font-medium">-{formatCOP(totalFuel)}</span></div>
                    <div className="border-t border-gray-800 pt-2 flex justify-between text-sm">
                      <span className="text-gray-300">Ganancia Neta</span>
                      <span className={`font-bold ${totalNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCOP(totalNet)}</span>
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
                  <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Ingreso Bruto</label>
                  <input type="text" inputMode="numeric" value={form.ingresoBruto}
                    onChange={e => setForm({ ...form, ingresoBruto: formatMiles(e.target.value) })} required placeholder="0" className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Kilómetros Recorridos</label>
                  <input type="number" step="0.1" min="0" value={form.kmRecorridos}
                    onChange={e => setForm({ ...form, kmRecorridos: e.target.value })} required placeholder="0" className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Gasto de Combustible</label>
                  <input type="text" value={vehiculo ? formatCOP((Number(form.kmRecorridos) / (vehiculo.rendimientoKmGalon || 1)) * PRECIO_GALON) : '$ 0'} readOnly
                    className="w-full rounded-xl border border-gray-700 bg-black/30 px-4 py-3 text-gray-400 outline-none cursor-not-allowed" />
                </div>
                <button type="submit" disabled={submitting} className="btn-premium w-full">
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
                  <input type="date" value={fuelForm.fecha} onChange={e => setFuelForm({ ...fuelForm, fecha: e.target.value })} required className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Cantidad (Galones)</label>
                  <input type="number" step="0.01" min="0" value={fuelForm.cantidad}
                    onChange={e => setFuelForm({ ...fuelForm, cantidad: e.target.value })} required placeholder="Ej: 10.5" className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Kilometraje Actual</label>
                  <input type="number" step="0.1" min="0" value={fuelForm.kilometraje}
                    onChange={e => setFuelForm({ ...fuelForm, kilometraje: e.target.value })} required placeholder="Ej: 12500" className="input-premium w-full" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-400">Costo Total (COP)</label>
                  <input type="text" inputMode="numeric" value={fuelForm.costoTotal}
                    onChange={e => setFuelForm({ ...fuelForm, costoTotal: formatMiles(e.target.value) })} placeholder="0" className="input-premium w-full" />
                </div>
                <button type="submit" disabled={fuelSubmitting} className="btn-premium w-full">
                  {fuelSubmitting ? 'Guardando...' : 'Agregar Carga'}
                </button>
              </form>
            </div>

            {fuelEntries.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-3 text-sm font-semibold text-white">Historial de Cargas</h3>
                <div className="space-y-2">
                  {fuelEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-4 py-2 text-sm">
                      <span className="text-gray-400">{e.fecha.slice(0, 10)}</span>
                      <span className="text-cyan-300 font-medium">{e.cantidad} gal</span>
                      <span className="text-gray-500">{e.kilometraje} km</span>
                      <span className="text-gray-400">{formatCOP(e.costoTotal)}</span>
                      <button onClick={() => setFuelDeleteId(e.id)} className="text-gray-600 hover:text-red-400 transition"><X size={14} /></button>
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
            {/* Vehicle selector */}
            {vehiculos.length > 1 && (
              <div className="card p-4">
                <label className="mb-2 block text-xs text-gray-400">Seleccionar Vehículo</label>
                <div className="flex gap-2">
                  {vehiculos.map(v => (
                    <button key={v.id} onClick={() => setVehiculoActivo(v.id)}
                      className={`px-4 py-2 text-sm rounded-xl border transition ${vehiculoActivo === v.id ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300' : 'border-gray-700 bg-black/30 text-gray-400 hover:border-gray-500'}`}>
                      {v.marca} {v.modelo} - {v.placa || 'Sin placa'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle detail */}
            <div className="card p-6">
              <h2 className="heading-lg mb-4">Mis Vehículos</h2>
              {vehiculo ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/15"><Car size={20} className="text-cyan-400" /></div>
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

                  <div className="rounded-xl border border-gray-700 bg-black/30 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Detalle Operativo</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Placa</label>
                        <input type="text" value={vehicleDetail.placa} onChange={e => setVehicleDetail({ ...vehicleDetail, placa: e.target.value.toUpperCase() })}
                          placeholder="ABC123" maxLength={10} className="input-premium w-full" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-gray-400">Kilometraje Actual</label>
                        <input type="text" inputMode="numeric" value={vehicleDetail.kilometrajeActual}
                          onChange={e => setVehicleDetail({ ...vehicleDetail, kilometrajeActual: formatMiles(e.target.value) })} className="input-premium w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Valor Compra</label>
                          <input type="text" inputMode="numeric" value={vehicleDetail.valorCompra}
                            onChange={e => setVehicleDetail({ ...vehicleDetail, valorCompra: formatMiles(e.target.value) })} className="input-premium w-full" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Valor Alquiler</label>
                          <input type="text" inputMode="numeric" value={vehicleDetail.valorAlquiler}
                            onChange={e => setVehicleDetail({ ...vehicleDetail, valorAlquiler: formatMiles(e.target.value) })} className="input-premium w-full" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Vida Útil (km)</label>
                          <input type="text" inputMode="numeric" value={vehicleDetail.vidaUtilKm}
                            onChange={e => setVehicleDetail({ ...vehicleDetail, vidaUtilKm: formatMiles(e.target.value) })} className="input-premium w-full" />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-gray-400">Rendimiento km/gal</label>
                          <input type="number" min="1" step="0.1" value={vehicleDetail.rendimientoKmGalon}
                            onChange={e => setVehicleDetail({ ...vehicleDetail, rendimientoKmGalon: e.target.value })} placeholder="35" className="input-premium w-full" />
                        </div>
                      </div>
                      <button onClick={handleUpdateVehicle} disabled={vehicleSaving} className="btn-premium w-full">
                        {vehicleSaving ? 'Guardando...' : vehicleSaved ? '¡Actualizado!' : 'Actualizar Datos'}
                      </button>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="rounded-xl border border-gray-700 bg-black/30 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Documentos del Vehículo</h3>
                    <form onSubmit={handleAddDocument} className="space-y-3 mb-4">
                      <div className="grid grid-cols-3 gap-2">
                        <select value={docForm.tipo} onChange={e => setDocForm({ ...docForm, tipo: e.target.value as VehicleDocument['tipo'] })}
                          className="input-premium text-xs">
                          <option value="SOAT">SOAT</option>
                          <option value="TECNOMECANICA">Tecnomecánica</option>
                          <option value="SEGURO">Seguro</option>
                          <option value="OTRO">Otro</option>
                        </select>
                        <input type="date" value={docForm.fechaExpedicion}
                          onChange={e => setDocForm({ ...docForm, fechaExpedicion: e.target.value })} required placeholder="Expide"
                          className="input-premium text-xs" />
                        <input type="date" value={docForm.fechaVencimiento}
                          onChange={e => setDocForm({ ...docForm, fechaVencimiento: e.target.value })} required placeholder="Vence"
                          className="input-premium text-xs" />
                      </div>
                      <button type="submit" disabled={docSubmitting} className="btn-premium w-full text-xs py-2">
                        {docSubmitting ? 'Guardando...' : 'Agregar Documento'}
                      </button>
                    </form>
                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map(d => {
                          const vencido = new Date(d.fechaVencimiento) < new Date();
                          return (
                            <div key={d.id} className={`flex items-center justify-between rounded-lg border px-4 py-2 text-sm ${vencido ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 bg-black/30'}`}>
                              <div className="flex items-center gap-2">
                                <FileText size={14} className={vencido ? 'text-red-400' : 'text-cyan-400'} />
                                <span className="text-gray-300">{d.tipo}</span>
                                <span className="text-xs text-gray-500">Vence: {d.fechaVencimiento.slice(0, 10)}</span>
                                {vencido && <span className="text-xs text-red-400 font-medium">Vencido</span>}
                              </div>
                              <button onClick={() => setDocDeleteId(d.id)} className="text-gray-600 hover:text-red-400"><X size={14} /></button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No hay documentos registrados.</p>
                    )}
                  </div>
                </div>
              ) : showVehicleForm ? (
                <form onSubmit={handleAddVehicle} className="space-y-3 rounded-xl border border-gray-700 bg-black/30 p-4">
                  <input value={vehicleForm.marca} onChange={e => setVehicleForm({ ...vehicleForm, marca: e.target.value })} placeholder="Marca" required className="input-premium w-full" />
                  <input value={vehicleForm.modelo} onChange={e => setVehicleForm({ ...vehicleForm, modelo: e.target.value })} placeholder="Modelo" required className="input-premium w-full" />
                  <input type="number" value={vehicleForm.anio} onChange={e => setVehicleForm({ ...vehicleForm, anio: e.target.value })} placeholder="Año" required className="input-premium w-full" />
                  <input value={vehicleForm.placa} onChange={e => setVehicleForm({ ...vehicleForm, placa: e.target.value })} placeholder="Placa (opcional)" className="input-premium w-full" />
                  <div className="flex gap-2">
                    <button type="submit" disabled={vehicleSubmitting} className="btn-premium flex-1 text-sm py-2">
                      {vehicleSubmitting ? 'Guardando...' : 'Guardar Vehículo'}
                    </button>
                    <button type="button" onClick={() => { setShowVehicleForm(false); setVehicleForm({ marca: '', modelo: '', anio: '', placa: '' }); }}
                      className="btn-ghost text-sm py-2 px-4">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No tienes vehículos registrados.</p>
                  <button onClick={() => setShowVehicleForm(true)} className="btn-premium"><Plus size={16} /> Registrar Vehículo</button>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'maintenance':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-lg">Plan Preventivo</h2>
                <button onClick={handleSeedPlan} disabled={seedLoading} className="btn-premium text-xs py-2 px-4">
                  {seedLoading ? 'Cargando...' : 'Cargar plan estándar'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Carga el plan de mantenimiento sugerido para un Kia Rio Xcite.</p>

              {alerts.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Alertas preventivas</p>
                  {alerts.map(a => (
                    <div key={a.id} className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                      <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-300">[{a.categoria}] {a.descripcion}</p>
                        <p className="text-xs text-amber-400/80">
                          {a.remainingKm <= 0
                            ? `¡Vencido por ${Math.abs(a.remainingKm).toLocaleString('es-CO')} km!`
                            : `¡Próximo mantenimiento en ${a.remainingKm.toLocaleString('es-CO')} km!`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleCreateMaintenance} className="space-y-3 rounded-xl border border-gray-700 bg-black/30 p-4">
                <h3 className="text-sm font-semibold text-white">Agregar Mantenimiento</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input value={maintForm.descripcion} onChange={e => setMaintForm({ ...maintForm, descripcion: e.target.value })}
                      placeholder="Descripción" required className="input-premium w-full" />
                  </div>
                  <div>
                    <select value={maintForm.categoria} onChange={e => setMaintForm({ ...maintForm, categoria: e.target.value as CategoriaMantenimiento })}
                      className="input-premium w-full">
                      {CATS.map(c => <option key={c} value={c}>{c === 'SUSPENSION' ? 'Suspensión' : c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <input type="number" min="1" value={maintForm.intervaloKm}
                      onChange={e => setMaintForm({ ...maintForm, intervaloKm: e.target.value })}
                      placeholder="Intervalo (km)" required className="input-premium w-full" />
                  </div>
                  <div>
                    <input type="text" inputMode="numeric" value={maintForm.costoEstimado}
                      onChange={e => setMaintForm({ ...maintForm, costoEstimado: formatMiles(e.target.value) })}
                      placeholder="Costo estimado" required className="input-premium w-full" />
                  </div>
                </div>
                <button type="submit" disabled={maintSubmitting} className="btn-premium w-full text-sm py-2">
                  {maintSubmitting ? 'Guardando...' : 'Agregar Mantenimiento'}
                </button>
              </form>
            </div>

            <div className="card p-6">
              <h2 className="heading-lg mb-4">Historial de Mantenimientos</h2>
              {maintenances.length === 0 ? (
                <p className="text-sm text-gray-500">No hay mantenimientos registrados. Usa el botón "Cargar plan estándar" o agrega manualmente.</p>
              ) : (
                <div className="space-y-2">
                  {maintenances.map(m => {
                    const kmDiff = m.intervaloKm - (vehiculo?.kilometrajeActual ?? 0);
                    const isDue = kmDiff <= 1000;
                    return (
                      <div key={m.id} className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${isDue ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-800 bg-black/30'}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium tracking-wider text-gray-500">[{m.categoria}]</span>
                            <span className="text-white font-medium">{m.descripcion}</span>
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            <span>Cada {m.intervaloKm.toLocaleString('es-CO')} km</span>
                            <span>Costo: {formatCOP(m.costoEstimado)}</span>
                          </div>
                          {isDue && <p className="text-xs text-amber-400 mt-1">
                            {kmDiff <= 0 ? `⚠ Vencido por ${Math.abs(kmDiff).toLocaleString('es-CO')} km` : `⚠ Próximo en ${kmDiff.toLocaleString('es-CO')} km`}
                          </p>}
                        </div>
                        <button onClick={() => setDeleteMaintId(m.id)} className="text-gray-500 hover:text-red-400 transition p-1 ml-3"><X size={15} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
            {/* Mini goals editor modal */}
            {editGoal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-xs mx-4 rounded-2xl border border-gray-700 bg-[#161b22] p-6 shadow-2xl">
                  <h3 className="text-sm font-semibold text-white mb-4">Editar Meta {editGoal.tipo === 'diario' ? 'Diaria' : editGoal.tipo === 'semanal' ? 'Semanal' : 'Mensual'}</h3>
                  <input type="text" inputMode="numeric" value={editGoal.valor}
                    onChange={e => setEditGoal({ ...editGoal, valor: formatMiles(e.target.value) })}
                    placeholder="Monto objetivo" className="input-premium w-full mb-4" />
                  <div className="flex gap-3">
                    <button onClick={() => saveGoal(editGoal.tipo, Number(editGoal.valor.replace(/\./g, '')) || 0)}
                      className="btn-premium flex-1">Guardar</button>
                    <button onClick={() => setEditGoal(null)} className="btn-ghost flex-1">Cancelar</button>
                  </div>
                </motion.div>
              </div>
            )}

            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="heading-lg">Estadísticas</h2>
                <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-gray-800">
                  {(['diario', 'semanal', 'mensual'] as const).map(tab => (
                    <button key={tab} onClick={() => setStatsTab(tab)}
                      className={`px-4 py-1.5 text-xs rounded-md font-medium transition ${statsTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30' : 'text-gray-500 hover:text-gray-300'}`}>
                      {tab === 'diario' ? 'Diario' : tab === 'semanal' ? 'Semanal' : 'Mensual'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal progress */}
              {goalProgress[statsTab].goal > 0 && (
                <div className="mb-4 rounded-lg border border-gray-800 bg-black/30 p-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Meta: {formatCOP(goalProgress[statsTab].goal)}</span>
                    <span>{formatCOP(goalProgress[statsTab].earned)} ({goalProgress[statsTab].pct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${goalProgress[statsTab].pct >= 100 ? 'bg-green-500' : 'bg-cyan-500'}`}
                      style={{ width: `${goalProgress[statsTab].pct}%` }} />
                  </div>
                </div>
              )}

              {filteredTrips.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No hay viajes en este período.</p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                      <DollarSign size={18} className="text-green-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-400">{formatCOP(sGross)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ingresos</p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                      <Flame size={18} className="text-red-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-400">{formatCOP(sFuel)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Combustible</p>
                    </div>
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4 text-center">
                      <BarChart3 size={18} className={`mx-auto mb-1 ${sNet >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                      <p className={`text-lg font-bold ${sNet >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCOP(sNet)}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">Ganancia Neta</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-4 text-xs text-gray-500">
                    <span>Viajes: {filteredTrips.length}</span>
                    <span>Kilómetros: {sKm.toFixed(1)} km</span>
                  </div>
                </>
              )}
            </div>

            {/* Gastos por categoría de mantenimiento */}
            {maintenances.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Gastos Estimados por Categoría</h3>
                <div className="space-y-2">
                  {CATS.map(cat => {
                    const total = maintenances.filter(m => m.categoria === cat).reduce((s, m) => s + m.costoEstimado, 0);
                    if (total === 0) return null;
                    return (
                      <div key={cat} className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-4 py-2 text-sm">
                        <span className="text-gray-400">{cat === 'SUSPENSION' ? 'Suspensión' : cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                        <span className="text-white font-medium">{formatCOP(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredTrips.length > 0 && (
              <div className="card p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">
                  {statsTab === 'diario' ? 'Viajes de Hoy' : statsTab === 'semanal' ? 'Viajes de la Semana' : 'Viajes del Mes'}
                </h3>
                <div className="space-y-2">
                  {filteredTrips.map(t => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/30 px-4 py-2 text-sm">
                      <span className="text-gray-400">{t.fecha.slice(0, 10)}</span>
                      <span className="text-green-400">{formatCOP(t.ingresoBruto)}</span>
                      <span className="text-red-400">{formatCOP(t.gastoCombustible)}</span>
                      <span className={calcNetProfit(t) >= 0 ? 'text-cyan-400 font-medium' : 'text-red-400 font-medium'}>{formatCOP(calcNetProfit(t))}</span>
                    </div>
                  ))}
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
              {photoPreview ? <img src={photoPreview} alt="" className="h-full w-full rounded-full object-cover" /> : (usuario?.nombre?.charAt(0) ?? '?')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{usuario?.nombre ?? 'Conductor'}</p>
              <p className="text-xs text-gray-500 truncate">{usuario?.email ?? ''}</p>
            </div>
            <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
          </button>

          <nav className="px-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => setActiveNav(item.id)}
                  className={`nav-item ${isActive ? 'active' : ''}`}>
                  <Icon size={18} /> {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="px-4 pb-6">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl py-3 px-4 text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200">
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-gray-400 text-sm">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>
            <motion.h1 key={activeNav} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="heading-xl">
              {activeNav === 'profile' ? 'Mi Perfil' : (navItems.find(n => n.id === activeNav)?.label ?? 'Panel de Control')}
            </motion.h1>
            {renderContent()}
          </>
        )}
      </main>

      {/* Modals */}
      {editingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-4 rounded-2xl border border-gray-700 bg-[#161b22] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Editar Viaje</h3>
              <button onClick={() => setEditingTrip(null)} className="text-gray-500 hover:text-white transition p-1"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-gray-400">Ingreso del Viaje</label>
                <input type="text" inputMode="numeric" value={editForm.ingresoBruto}
                  onChange={e => setEditForm({ ...editForm, ingresoBruto: formatMiles(e.target.value) })} className="input-premium w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-400">Kilómetros Recorridos</label>
                <input type="number" step="0.1" min="0" value={editForm.kmRecorridos}
                  onChange={e => setEditForm({ ...editForm, kmRecorridos: e.target.value })} className="input-premium w-full" />
              </div>
              <div className="rounded-lg bg-black/30 border border-gray-800 px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Gasto de Combustible (calculado)</p>
                <p className="text-sm font-medium text-cyan-400">{formatCOP((Number(editForm.kmRecorridos) / (vehiculo?.rendimientoKmGalon || 1)) * PRECIO_GALON)}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveEdit} disabled={editSaving} className="btn-premium flex-1">
                  {editSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button onClick={() => setEditingTrip(null)} className="btn-ghost flex-1">Cancelar</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ConfirmDialog open={deleteMaintId !== null} title="Eliminar Mantenimiento"
        message="¿Estás seguro de eliminar este mantenimiento?" onConfirm={handleDeleteMaintenance}
        onCancel={() => setDeleteMaintId(null)} />

      <ConfirmDialog open={fuelDeleteId !== null} title="Eliminar Carga"
        message="¿Estás seguro de eliminar esta carga de combustible?" onConfirm={handleDeleteFuel}
        onCancel={() => setFuelDeleteId(null)} />

      <ConfirmDialog open={docDeleteId !== null} title="Eliminar Documento"
        message="¿Estás seguro de eliminar este documento?" onConfirm={handleDeleteDoc}
        onCancel={() => setDocDeleteId(null)} />
    </div>
  );
}
