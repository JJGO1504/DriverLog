import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { createUser, createVehicleForUser } from '../services/api';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { stiffness: 300, damping: 24 } },
};

export default function RegisterFlow() {
  const [step, setStep] = useState(1);
  const [person, setPerson] = useState({ nombre: '', email: '', password: '' });
  const [vehicle, setVehicle] = useState({ marca: '', modelo: '', anio: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const next = () => setStep(s => Math.min(2, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerson({ ...person, [e.target.name]: e.target.value });
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async () => {
    // validation
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
    // validation
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
      const res = await createVehicleForUser(userId, payload);
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setSubmitting(false);
      alert(err?.response?.data?.error || 'Error creando vehículo');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
      <style>{`
        @keyframes streak {0%{transform:translateX(-30%)}50%{transform:translateX(30%)}100%{transform:translateX(-30%)}}
      `}</style>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-[#02121f] via-[#070713] to-[#050005]" />
      <div aria-hidden className="absolute -z-20 h-full w-full opacity-60" style={{background: 'linear-gradient(90deg, rgba(6,182,212,0.07) 0%, rgba(168,85,247,0.04) 30%, rgba(56,189,248,0.06) 60%, rgba(168,85,247,0.04) 100%)', filter: 'blur(40px)'}} />
      <div aria-hidden className="absolute -z-10 h-1/2 w-[140%] left-[-20%] top-10 opacity-40" style={{background: 'linear-gradient(90deg, rgba(6,182,212,0.12), rgba(168,85,247,0.08), rgba(56,189,248,0.12))', transformOrigin: 'center', animation: 'streak 8s linear infinite'}} />
      <div className="w-full max-w-3xl">
        <motion.div className="neon-panel p-8 bg-[#0d1117]/80 backdrop-blur-md border border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] rounded-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -200 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -200 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">Registro: Datos Personales</h2>

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
                    <label className="block text-sm text-cyan-200 mb-1">Nombre Completo</label>
                    <input
                      name="nombre"
                      required
                      value={person.nombre}
                      onChange={handlePersonChange}
                      className={`neon-input w-full ${errors.nombre ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-cyan-200 mb-1">Correo Electrónico</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={person.email}
                      onChange={handlePersonChange}
                      className={`neon-input w-full ${errors.email ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="block text-sm text-cyan-200 mb-1">Contraseña</label>
                    <input
                      name="password"
                      type="password"
                      required
                      value={person.password}
                      onChange={handlePersonChange}
                      className={`neon-input w-full ${errors.password ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
                    <button type="submit" disabled={submitting} className="neon-btn px-5 py-2">
                      Siguiente
                    </button>
                    <button type="button" onClick={back} className="neon-btn outlined px-4 py-2">
                      Volver
                    </button>
                  </motion.div>
                </motion.form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 200 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 200 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">Registro: Vehículo</h2>

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
                    <label className="block text-sm text-cyan-200 mb-1">Marca</label>
                    <input
                      name="marca"
                      required
                      value={vehicle.marca}
                      onChange={handleVehicleChange}
                      className={`neon-input w-full ${errors.marca ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-4">
                    <label className="block text-sm text-cyan-200 mb-1">Modelo</label>
                    <input
                      name="modelo"
                      required
                      value={vehicle.modelo}
                      onChange={handleVehicleChange}
                      className={`neon-input w-full ${errors.modelo ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="mb-6">
                    <label className="block text-sm text-cyan-200 mb-1">Año</label>
                    <input
                      name="anio"
                      type="number"
                      required
                      value={vehicle.anio}
                      onChange={handleVehicleChange}
                      className={`neon-input w-full ${errors.anio ? 'border-red-400 ring-2 ring-red-500/60 animate-pulse' : ''}`}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="flex items-center justify-between gap-4">
                    <button type="submit" disabled={submitting} className="neon-btn px-5 py-2 flex items-center gap-2">
                      Finalizar Registro
                    </button>
                    <button type="button" onClick={back} className="neon-btn outlined px-4 py-2">
                      Volver
                    </button>
                  </motion.div>
                </motion.form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
