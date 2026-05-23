import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUser, createVehicleForUser } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 24 } },
};

export default function RegisterFlow() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(false);
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState({ nombre: '', email: '', password: '' });
  const [vehicle, setVehicle] = useState({ marca: '', modelo: '', anio: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loginError, setLoginError] = useState('');

  const next = () => setStep(s => Math.min(2, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson({ ...person, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError('Completa todos los campos.');
      return;
    }
    setSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (err: any) {
      setLoginError(err?.response?.data?.error || 'Credenciales inválidas');
      setSubmitting(false);
    }
  };

  const handleCreateUser = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!person.nombre.trim()) newErrors.nombre = true;
    if (!person.email.trim()) newErrors.email = true;
    if (!person.password.trim()) newErrors.password = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert('Completa los campos requeridos antes de continuar.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createUser(person);
      const id = res?.user?.id;
      setUserId(id ?? null);
      setSubmitting(false);
      next();
    } catch (err: any) {
      setSubmitting(false);
      alert(err?.response?.data?.error || 'Error creando usuario');
    }
  };

  const handleFinish = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!vehicle.marca.trim()) newErrors.marca = true;
    if (!vehicle.modelo.trim()) newErrors.modelo = true;
    if (!vehicle.anio || Number(vehicle.anio) <= 0) newErrors.anio = true;
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      alert('Completa los datos del vehículo correctamente antes de finalizar.');
      return;
    }
    setSubmitting(true);
    try {
      if (!userId) {
        setSubmitting(false);
        return alert('Usuario no creado correctamente.');
      }
      const payload = { marca: vehicle.marca, modelo: vehicle.modelo, anio: Number(vehicle.anio) };
      await createVehicleForUser(userId, payload);
      setSubmitting(false);
      await login(person.email, person.password);
      navigate('/dashboard');
    } catch (err: any) {
      setSubmitting(false);
      alert(err?.response?.data?.error || 'Error creando vehículo');
    }
  };

  const toggleView = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setErrors({});
    setLoginError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#030712]" style={streakBg}>
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

      <div className="w-full max-w-lg">
        <motion.div className="glass-card-accent p-8">
          <AnimatePresence mode="wait">
            {/* Login form */}
            {isLogin && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -60 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Iniciar Sesión en DriverLog</h2>
                  <p className="text-sm text-gray-400 mt-1">Accede a tu panel de control</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="correo@ejemplo.com"
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      className="input-premium w-full"
                    />
                  </div>

                  {loginError && (
                    <p className="text-sm text-red-400 text-center">{loginError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-premium w-full"
                  >
                    {submitting ? 'Ingresando...' : 'Ingresar \u2794'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  ¿No tienes cuenta?{' '}
                  <button type="button" onClick={toggleView} className="text-cyan-400 hover:text-cyan-300 transition font-medium">
                    Regístrate
                  </button>
                </p>
              </motion.div>
            )}

            {/* Register: Step 1 */}
            {!isLogin && step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -200 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -200 }}
                transition={{ duration: 0.35 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Registrar Conductor</h2>
                  <p className="text-sm text-gray-400 mt-1">Datos Personales</p>
                </div>

                <motion.form
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  onSubmit={e => {
                    e.preventDefault();
                    handleCreateUser();
                  }}
                >
                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Nombre Completo</label>
                    <input
                      name="nombre"
                      required
                      value={person.nombre}
                      onChange={handlePersonChange}
                      className={`input-premium w-full ${
                        errors.nombre
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Correo Electrónico</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={person.email}
                      onChange={handlePersonChange}
                      className={`input-premium w-full ${
                        errors.email
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="block text-sm text-gray-400 mb-1">Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={person.password}
                      onChange={handlePersonChange}
                      className={`input-premium w-full ${
                        errors.password
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-premium w-full"
                    >
                      {submitting ? 'Creando...' : 'Siguiente'}
                    </button>
                    <button type="button" onClick={back} className="btn-ghost w-full">
                      Volver
                    </button>
                  </motion.div>
                </motion.form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={toggleView} className="text-cyan-400 hover:text-cyan-300 transition font-medium">
                    Inicia Sesión
                  </button>
                </p>
              </motion.div>
            )}

            {/* Register: Step 2 */}
            {!isLogin && step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 200 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 200 }}
                transition={{ duration: 0.35 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">Datos del Vehículo</h2>
                  <p className="text-sm text-gray-400 mt-1">Finaliza el registro del conductor</p>
                </div>

                <motion.form
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  onSubmit={e => {
                    e.preventDefault();
                    handleFinish();
                  }}
                >
                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Marca</label>
                    <input
                      name="marca"
                      required
                      value={vehicle.marca}
                      onChange={handleVehicleChange}
                      className={`input-premium w-full ${
                        errors.marca
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Modelo</label>
                    <input
                      name="modelo"
                      required
                      value={vehicle.modelo}
                      onChange={handleVehicleChange}
                      className={`input-premium w-full ${
                        errors.modelo
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="block text-sm text-gray-400 mb-1">Año</label>
                    <input
                      name="anio"
                      type="number"
                      required
                      value={vehicle.anio}
                      onChange={handleVehicleChange}
                      className={`input-premium w-full ${
                        errors.anio
                          ? '!border-red-400 !ring-2 !ring-red-500/60 animate-pulse'
                          : ''
                      }`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-premium w-full"
                    >
                      {submitting ? 'Finalizando...' : 'Finalizar Registro'}
                    </button>
                    <button type="button" onClick={back} className="btn-ghost w-full">
                      Volver
                    </button>
                  </motion.div>
                </motion.form>

                <p className="mt-6 text-center text-sm text-gray-400">
                  ¿Ya tienes cuenta?{' '}
                  <button type="button" onClick={toggleView} className="text-cyan-400 hover:text-cyan-300 transition font-medium">
                    Inicia Sesión
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
