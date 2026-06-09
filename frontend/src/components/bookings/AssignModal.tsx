'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Truck, User, Hash } from 'lucide-react';

interface Props {
  bookingId: string;
  onClose: () => void;
}

export function AssignModal({ bookingId, onClose }: Props) {
  const queryClient = useQueryClient();

  const [agentName, setAgentName] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [errors, setErrors] = useState<{ agentName?: string; vehicleId?: string }>({});

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: async () => await api.bookings.assign(bookingId, { agentName, vehicleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Assigned to ${agentName}`);
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Assignment failed');
    },
  });

  function validate() {
    const e: typeof errors = {};
    if (agentName.trim().length < 2) e.agentName = 'Agent name must be at least 2 characters';
    if (!/^[A-Za-z0-9]{2,20}$/.test(vehicleId.trim()))
      e.vehicleId = 'Alphanumeric only, 2–20 chars (e.g. V001)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 w-full max-w-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assign Agent</h2>
              <p className="text-xs text-slate-400 mt-0.5">Set driver and vehicle for this booking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="form-label">
              <User className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
              Agent Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ravi Kumar"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              autoFocus
            />
            {errors.agentName && (
              <p className="form-error">{errors.agentName}</p>
            )}
          </div>

          <div>
            <label className="form-label">
              <Hash className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
              Vehicle ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              className="form-input font-mono uppercase"
              placeholder="V001"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value.toUpperCase())}
            />
            {errors.vehicleId && (
              <p className="form-error">{errors.vehicleId}</p>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Assigning…
                </>
              ) : (
                'Confirm Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
