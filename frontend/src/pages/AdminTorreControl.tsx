import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminTorreControl() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'SUPERUSER') {
      // prevent access
      navigate('/');
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.role !== 'SUPERUSER') return null;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
      <div className="max-w-4xl p-8 rounded-2xl bg-[#0d1117]/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <h1 className="text-2xl font-bold text-white mb-4">Admin Torre de Control</h1>
        <p className="text-sm text-gray-300">Acceso restringido. Usuario autenticado como SUPERUSER.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white/3 p-4">Logs y métricas en tiempo real (placeholder)</div>
          <div className="rounded-lg bg-white/3 p-4">Herramientas administrativas (placeholder)</div>
        </div>
      </div>
    </div>
  );
}
