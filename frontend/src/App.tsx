import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './hooks/useToast';
import LandingPage from './pages/LandingPage';
import RegisterFlow from './pages/RegisterFlow';
import DriverDashboard from './pages/DriverDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminTorreControl from './pages/AdminTorreControl';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="min-h-screen bg-black text-white">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterFlow />} />
            <Route path="/login" element={<RegisterFlow />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['USER', 'SUPERUSER']}>
                <DriverDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin-torre-control" element={
              <ProtectedRoute allowedRoles={['SUPERUSER']}>
                <AdminTorreControl />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}
