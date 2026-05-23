import { useNavigate, Link } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="relative z-20 flex justify-between items-center px-6 py-4 bg-gray-900">
      <Link to="/" className="flex items-center gap-x-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/40">
          <span className="text-cyan-400 text-sm font-black">D</span>
        </span>
        <span className="text-2xl font-bold tracking-tight text-cyan-400">DriverLog</span>
      </Link>
      <div className="flex items-center gap-x-4">
        <button onClick={() => navigate('/login')} className="text-white hover:text-gray-300 text-sm font-medium">Iniciar Sesión</button>
        <button onClick={() => navigate('/register')} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 text-sm font-medium">Registrarse</button>
      </div>
    </header>
  );
}
