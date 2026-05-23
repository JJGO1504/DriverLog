import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/Header';

const streakBg = {
  background: `
    radial-gradient(ellipse 100% 40% at 0% 50%, rgba(6,182,212,0.30) 0%, transparent 65%),
    radial-gradient(ellipse 100% 35% at 100% 45%, rgba(236,72,153,0.25) 0%, transparent 60%),
    radial-gradient(ellipse 80% 25% at 20% 30%, rgba(56,189,248,0.18) 0%, transparent 55%),
    radial-gradient(ellipse 70% 20% at 85% 60%, rgba(168,85,247,0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 30% at 35% 70%, rgba(6,182,212,0.10) 0%, transparent 45%),
    radial-gradient(ellipse 50% 20% at 60% 20%, rgba(236,72,153,0.08) 0%, transparent 40%),
    linear-gradient(180deg, #030712 0%, #030712 100%)
  `,
};

const features = [
  {
    title: 'Monitoreo en Tiempo Real',
    desc: 'Seguimiento preciso de rutas, tiempos de viaje y estados de conexión. Controla cada kilómetro de tu trayecto con sincronización en la nube.',
  },
  {
    title: 'Análisis Financiero Avanzado',
    desc: 'Optimiza tus ingresos y reduce costos operativos. Visualiza gráficos detallados de gastos de combustible, mantenimiento y rendimiento neto por ruta.',
  },
  {
    title: 'Optimización del Vehículo',
    desc: 'Registra y programa alertas de mantenimiento preventivo basado en el kilometraje real. Prolonga la vida útil de tu herramienta de trabajo.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-white overflow-hidden" style={streakBg}>
      {/* Traffic light streak lines */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[-5%] top-[18%] h-[2px] w-[55%] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent blur-sm rotate-[-6deg]" />
        <div className="absolute right-[-5%] top-[32%] h-[2px] w-[55%] bg-gradient-to-l from-transparent via-fuchsia-400/35 to-transparent blur-sm rotate-[4deg]" />
        <div className="absolute left-[10%] top-[48%] h-[2px] w-[45%] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent blur-sm rotate-[-2deg]" />
        <div className="absolute right-[5%] top-[62%] h-[2px] w-[50%] bg-gradient-to-l from-transparent via-pink-400/30 to-transparent blur-sm rotate-[3deg]" />
        <div className="absolute left-[-3%] top-[78%] h-[2px] w-[50%] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent blur-sm rotate-[5deg]" />
        <div className="absolute right-[0%] top-[12%] h-[1.5px] w-[35%] bg-gradient-to-l from-transparent via-fuchsia-300/20 to-transparent blur-[2px] rotate-[8deg]" />
        <div className="absolute left-[40%] top-[88%] h-[1.5px] w-[30%] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent blur-[2px] rotate-[-4deg]" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/12 blur-[160px]" />
        <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-fuchsia-500/10 blur-[150px]" />
      </div>

      {/* Navbar */}
      <Header />

      {/* Hero + Content */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl flex-col items-center justify-center px-6 py-16">
        {/* Statistics row */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 grid w-full max-w-3xl grid-cols-3 gap-4"
        >
          {[
            { value: '1,500+', label: 'Conductores Activos' },
            { value: '2.4M', label: 'Kilómetros Monitoreados' },
            { value: '99.9%', label: 'Precisión de Datos' },
          ].map((s) => (
            <div key={s.label} className="card py-4 text-center">
              <div className="text-xl font-bold text-cyan-300 sm:text-2xl">{s.value}</div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-gray-500">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-12 text-center"
        >
          <h1 className="heading-xl sm:text-5xl md:text-6xl">
            Bienvenido a <span className="text-cyan-400">DriverLog</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
            Tu Solución Integral para la Gestión de Flotas y Control de Rutas
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid w-full gap-6 sm:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="card p-6 transition hover:border-cyan-400/40"
            >
              <h3 className="heading-lg mb-3 text-cyan-300">{f.title}</h3>
              <p className="text-sm leading-relaxed text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button onClick={() => navigate('/register')}
            className="btn-premium px-8 py-3.5 text-base w-full sm:w-auto">
            Registrar Usuario
          </button>
          <button onClick={() => navigate('/login')}
            className="btn-ghost px-8 py-3.5 text-base w-full sm:w-auto border border-gray-700 hover:border-cyan-400/40 hover:text-cyan-300">
            Iniciar Sesión
          </button>
        </motion.div>
      </main>
    </div>
  );
}
