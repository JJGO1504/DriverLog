import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm mx-4 rounded-2xl border border-gray-700 bg-[#161b22] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button onClick={handleConfirm} disabled={busy}
                className="btn-premium flex-1 bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30">
                {busy ? 'Procesando...' : confirmLabel}
              </button>
              <button onClick={onCancel} disabled={busy}
                className="btn-ghost flex-1">{cancelLabel}</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
