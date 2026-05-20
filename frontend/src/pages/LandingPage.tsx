import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_14%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400/70 via-transparent to-purple-400/70 blur-xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-6">
        <header className="flex items-center justify-between rounded-full px-2 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
            <span className="text-sm font-semibold text-cyan-300">DriverLog</span>
          </div>
          <div />
        </header>

        <main className="flex min-h-[calc(100vh-120px)] items-center justify-center py-12">
          <div className="w-full max-w-6xl">
            <section className="mb-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-[#0d1117]/40 border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-cyan-300">1,240+</div>
                <div className="text-xs text-gray-400 mt-1">Conductores Activos</div>
              </div>
              <div className="bg-[#0d1117]/40 border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-green-400">45.2K</div>
                <div className="text-xs text-gray-400 mt-1">Viajes Monitoreados</div>
              </div>
              <div className="bg-[#0d1117]/40 border border-cyan-500/20 rounded-xl p-4 text-center">
                <div className="text-2xl font-extrabold text-cyan-300">99.8%</div>
                <div className="text-xs text-gray-400 mt-1">Precisión del Sistema</div>
              </div>
            </section>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative mx-auto w-full rounded-[32px] border border-cyan-400/30 bg-[#0c1320]/80 p-8 shadow-[0_0_30px_rgba(6,182,212,0.25)] backdrop-blur-md"
            >
              <div className="space-y-6 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/90">Comienza tu Viaje en DriverLog</p>
                <h1 className="text-white text-4xl font-extrabold sm:text-5xl">Bienvenido a DriverLog</h1>
                <h2 className="text-cyan-200 text-lg font-medium">Tu Solución Integral para la Gestión de Flotas</h2>
                </h1>
                <p className="mx-auto max-w-xl text-sm text-gray-400 leading-7">
                  Ingresa los datos clave para crear la cuenta del conductor y activar el flujo de control de viajes.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_30px_rgba(0,255,255,0.06)]">
                  <label className="block text-xs uppercase tracking-[0.35em] text-cyan-300 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej. Ana Gómez"
                    className="neon-input w-full bg-transparent border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400/80"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_30px_rgba(0,255,255,0.06)]">
                  <label className="block text-xs uppercase tracking-[0.35em] text-cyan-300 mb-2">Correo Electrónico</label>
                  <p className="text-[11px] text-slate-500 mb-2">(Para estadísticas)</p>
                  <input
                    type="email"
                    placeholder="ana.gomez@email.com"
                    className="neon-input w-full bg-transparent border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400/80"
                  />
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[inset_0_0_30px_rgba(0,255,255,0.06)]">
                  <label className="block text-xs uppercase tracking-[0.35em] text-cyan-300 mb-2">Modelo del Vehículo</label>
                  <input
                    type="text"
                    placeholder="Ej. Toyota Hilux 2024"
                    className="neon-input w-full bg-transparent border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:border-cyan-400/80"
                  />
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white/3 p-4 text-left">
                  <div className="text-cyan-300 font-semibold">Monitoreo Financiero</div>
                  <div className="text-sm text-gray-300 mt-2">Control exacto de ingresos y gastos de ruta en tiempo real.</div>
                </div>
                <div className="rounded-lg bg-white/3 p-4 text-left">
                  <div className="text-cyan-300 font-semibold">Optimización</div>
                  <div className="text-sm text-gray-300 mt-2">Métricas avanzadas para mejorar el rendimiento de tu vehículo.</div>
                </div>
                <div className="rounded-lg bg-white/3 p-4 text-left">
                  <div className="text-cyan-300 font-semibold">Privacidad</div>
                  <div className="text-sm text-gray-300 mt-2">Cifrado de extremo a extremo en tus registros históricos.</div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => navigate('/register')}
                  className="w-full rounded-full bg-cyan-400 px-6 py-4 text-lg font-bold text-black shadow-[0_8px_30px_rgba(34,211,238,0.5)] hover:scale-[1.02] transition"
                >
                  Registrar Usuario
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-slate-400">¿Ya tienes cuenta? <span className="font-semibold text-cyan-300">Inicia Sesión</span></p>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
