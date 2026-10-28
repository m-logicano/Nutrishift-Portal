'use client';

import { useState } from 'react';
import { Activity, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitMeasurementAction } from '@/actions/portal';

export function MeasurementForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await submitMeasurementAction(formData);

    setLoading(false);
    if (res.success) {
      setMessage(res.message || 'Saved successfully!');
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setIsOpen(false), 2000);
    } else {
      setError(res.error || 'Failed to save measurement.');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
      >
        <Plus className="w-4 h-4" />
        <span>Record New Entry</span>
      </button>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="font-semibold text-white text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>New Biometric Entry</span>
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-slate-400 hover:text-white"
        >
          Cancel
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Weight (kg) <span className="text-purple-400">*</span>
            </label>
            <input
              name="weight"
              type="number"
              step="0.1"
              required
              placeholder="e.g. 78.5"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Height (cm)
            </label>
            <input
              name="height"
              type="number"
              step="0.5"
              placeholder="e.g. 175"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Upper Waist (cm)
            </label>
            <input
              name="upperWaist"
              type="number"
              step="0.5"
              placeholder="e.g. 84"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Lower Waist (cm)
            </label>
            <input
              name="lowerWaist"
              type="number"
              step="0.5"
              placeholder="e.g. 90"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">
            Weekly Notes / Observations
          </label>
          <textarea
            name="notes"
            rows={2}
            placeholder="e.g. Adhered strictly to plan, improved morning energy..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all"
        >
          {loading ? 'Submitting to Medical Chart...' : 'Save Measurements'}
        </button>
      </form>
    </div>
  );
}
