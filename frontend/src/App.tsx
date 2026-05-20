import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import RegisterFlow from './pages/RegisterFlow';
import DriverDashboard from './pages/DriverDashboard';
import AdminTorreControl from './pages/AdminTorreControl';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterFlow />} />
          <Route path="/dashboard" element={<DriverDashboard />} />
          <Route path="/admin-torre-control" element={<AdminTorreControl />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
