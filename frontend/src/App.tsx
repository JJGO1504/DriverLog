import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import DriverDashboard from './pages/DriverDashboard';
import AdminPanel from './pages/AdminPanel';
import { Role, User } from './types';

function Home({ currentUser }: { currentUser: User | null }) {
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-bold">DriverLog</h1>
      <p className="max-w-2xl text-gray-600">
        Sistema financiero para conductores con roles diferenciados: <strong>USER</strong> y <strong>SUPERUSER</strong>.
      </p>
      {currentUser ? (
        <div className="rounded-xl bg-slate-50 p-4 shadow-sm">
          <p className="text-slate-900">
            Sesión activa como <strong>{currentUser.nombre}</strong> ({currentUser.role})
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {currentUser.role === 'USER' ? <Link to="/dashboard" className="btn">Ir al Dashboard</Link> : <Link to="/admin" className="btn">Ir al Panel de Administración</Link>}
          </div>
        </div>
      ) : (
        <p className="text-slate-700">Selecciona un rol en la barra superior para comenzar.</p>
      )}
    </div>
  );
}

function Unauthorized() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Acceso denegado</h2>
      <p className="mt-2 text-slate-600">No tienes permisos para ver esta pantalla.</p>
      <Link to="/" className="btn mt-4 inline-block">Volver al inicio</Link>
    </div>
  );
}

function AppContent() {
  const { currentUser, loginAsUser, loginAsSuperuser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-white/90 px-6 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">DriverLog</h1>
            <p className="text-sm text-slate-500">Gestión financiera para conductores y administradores.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-3">
            <button onClick={loginAsUser} className="btn btn-secondary">
              Conectar como Conductor
            </button>
            <button onClick={loginAsSuperuser} className="btn btn-secondary">
              Conectar como Superuser
            </button>
            <button onClick={logout} className="btn btn-outline">
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <Routes>
          <Route path="/" element={<Home currentUser={currentUser} />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPERUSER']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
