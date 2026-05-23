import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import * as api from '../services/api';
import { Users, DollarSign, Wrench, BarChart3, Shield, ShieldOff, Search, Plus, X, Eye, EyeOff } from 'lucide-react';

const formatCOP = (v: number) => Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v);

interface AdminMetrics {
  totalUsers: number;
  totalIncome: number;
  totalMaintenanceCost: number;
  netBalance: number;
  users: { id: number; nombre: string; email: string; role: string; avatarUrl: string | null }[];
  recentMaintenances: {
    id: number;
    descripcion: string;
    categoria: string;
    costoReal: number | null;
    fechaEjecucion: string | null;
    vehicle: { marca: string; modelo: string; placa: string } | null;
  }[];
}

export default function AdminTorreControl() {
  const { currentUser, authReady } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({ nombre: '', email: '', password: '' });
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [showAdminPwd, setShowAdminPwd] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!currentUser || currentUser.role !== 'SUPERUSER') {
      navigate('/');
      return;
    }
    loadMetrics();
  }, [currentUser, authReady]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Error cargando métricas:', err?.response?.data || err?.message || err);
      addToast('Error cargando métricas: ' + (err?.response?.data?.error || err?.message || 'Error desconocido'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'SUPERUSER' ? 'USER' : 'SUPERUSER';
    try {
      await api.updateUserRole(userId, newRole);
      setMetrics(prev => prev ? {
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, role: newRole } : u),
      } : prev);
      addToast(`Usuario ${newRole === 'SUPERUSER' ? 'promovido' : 'degradado'}`, 'success');
    } catch (err: any) {
      console.error('Error actualizando rol:', err?.response?.data || err?.message || err);
      addToast('Error actualizando rol', 'error');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminForm.nombre.trim() || !adminForm.email.trim() || !adminForm.password.trim()) return;
    setAdminSubmitting(true);
    try {
      const user = await api.createAdminUser(adminForm);
      setMetrics(prev => prev ? { ...prev, totalUsers: prev.totalUsers + 1, users: [...prev.users, user] } : prev);
      setAdminForm({ nombre: '', email: '', password: '' });
      setShowAdminForm(false);
      addToast(`Admin ${user.nombre} creado`, 'success');
    } catch (err: any) {
      console.error('Error creando admin:', err?.response?.data || err?.message || err);
      addToast(err?.response?.data?.error || 'Error creando admin', 'error');
    } finally {
      setAdminSubmitting(false);
    }
  };

  if (!currentUser || currentUser.role !== 'SUPERUSER') return null;

  const filteredUsers = metrics?.users.filter(u =>
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Torre de Control</h1>
            <p className="text-sm text-gray-500 mt-1">Panel administrativo — métricas globales de la flota</p>
          </div>
          <button onClick={() => navigate('/dashboard')}
            className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-400/30 px-4 py-2 rounded-xl transition">
            Volver al Dashboard
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-cyan-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : metrics ? (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
                <Users size={20} className="text-cyan-400 mb-2" />
                <p className="text-2xl font-bold text-white">{metrics.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">Usuarios Registrados</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
                <DollarSign size={20} className="text-green-400 mb-2" />
                <p className="text-2xl font-bold text-green-400">{formatCOP(metrics.totalIncome)}</p>
                <p className="text-xs text-gray-500 mt-1">Ingresos Totales</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
                <Wrench size={20} className="text-red-400 mb-2" />
                <p className="text-2xl font-bold text-red-400">{formatCOP(metrics.totalMaintenanceCost)}</p>
                <p className="text-xs text-gray-500 mt-1">Gastos Mantenimientos</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
                <BarChart3 size={20} className={`mb-2 ${metrics.netBalance >= 0 ? 'text-cyan-400' : 'text-red-400'}`} />
                <p className={`text-2xl font-bold ${metrics.netBalance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{formatCOP(metrics.netBalance)}</p>
                <p className="text-xs text-gray-500 mt-1">Balance Neto Global</p>
              </div>
            </div>

            {/* Users table */}
            <div className="rounded-xl border border-gray-800 bg-black/30 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-semibold text-white">Gestión de Usuarios</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowAdminForm(!showAdminForm)}
                    className="text-[10px] flex items-center gap-1 text-cyan-400 border border-cyan-400/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition">
                    {showAdminForm ? <X size={12} /> : <Plus size={12} />} {showAdminForm ? 'Cerrar' : 'Nuevo Admin'}
                  </button>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar usuario..." className="bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 outline-none w-48" />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800/50">
                      <th className="text-left px-5 py-3 font-medium">Nombre</th>
                      <th className="text-left px-5 py-3 font-medium">Email</th>
                      <th className="text-center px-5 py-3 font-medium">Rol</th>
                      <th className="text-center px-5 py-3 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-gray-800/30 hover:bg-white/[0.02] transition">
                        <td className="px-5 py-3 text-gray-300">{u.nombre}</td>
                        <td className="px-5 py-3 text-gray-500">{u.email}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                            u.role === 'SUPERUSER' ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-400/20' : 'text-gray-400 bg-gray-800 border border-gray-700'
                          }`}>
                            {u.role === 'SUPERUSER' ? 'ADMIN' : 'USER'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleToggleRole(u.id, u.role)}
                            className={`text-[10px] px-3 py-1.5 rounded-lg border transition ${
                              u.role === 'SUPERUSER'
                                ? 'border-red-400/30 text-red-400 hover:bg-red-500/10'
                                : 'border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10'
                            }`}>
                            {u.role === 'SUPERUSER' ? <span className="flex items-center gap-1"><ShieldOff size={12} /> Degradar</span> : <span className="flex items-center gap-1"><Shield size={12} /> Promover</span>}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-600">No se encontraron usuarios.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Admin Form */}
            {showAdminForm && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Registrar Nuevo Administrador</h3>
                <form onSubmit={handleCreateAdmin} className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Nombre</label>
                    <input type="text" value={adminForm.nombre}
                      onChange={e => setAdminForm({ ...adminForm, nombre: e.target.value })}
                      required placeholder="Nombre completo" className="input-premium w-full text-sm" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Email</label>
                    <input type="email" value={adminForm.email}
                      onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                      required placeholder="correo@ejemplo.com" className="input-premium w-full text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <label className="block text-[10px] text-gray-500 mb-1">Contraseña</label>
                      <input type={showAdminPwd ? 'text' : 'password'} value={adminForm.password}
                        onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                        required placeholder="••••••••" className="input-premium w-full text-sm pr-10" />
                      <button type="button" onClick={() => setShowAdminPwd(!showAdminPwd)}
                        className="absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 text-gray-500 hover:text-white transition">
                        {showAdminPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button type="submit" disabled={adminSubmitting}
                      className="btn-premium text-xs py-3 px-4 self-end whitespace-nowrap">
                      {adminSubmitting ? 'Creando...' : 'Crear Admin'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent maintenances */}
            <div className="rounded-xl border border-gray-800 bg-black/30 p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Últimos Mantenimientos Realizados</h2>
              {metrics.recentMaintenances.length === 0 ? (
                <p className="text-sm text-gray-600">No hay mantenimientos registrados.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.recentMaintenances.map(m => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-800/50 bg-black/20 px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-3">
                        <Wrench size={14} className="text-gray-600" />
                        <span className="text-gray-300">{m.descripcion}</span>
                        <span className="text-[10px] text-gray-600">[{m.categoria}]</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {m.vehicle && <span>{m.vehicle.marca} {m.vehicle.modelo} ({m.vehicle.placa})</span>}
                        <span>{m.costoReal != null ? formatCOP(m.costoReal) : '—'}</span>
                        <span>{m.fechaEjecucion?.slice(0, 10)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-12">Error cargando datos.</p>
        )}
      </div>
    </div>
  );
}
