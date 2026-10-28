import { Activity, Plus, TrendingDown } from 'lucide-react';

export default function MeasurementsPage() {
  const metrics = [
    { label: 'Current Weight', value: '78.4 kg', change: '-3.2 kg overall', trend: 'down' },
    { label: 'Body Mass Index (BMI)', value: '24.2', change: 'Normal range', trend: 'stable' },
    { label: 'Blood Pressure', value: '118/76', change: 'Optimal', trend: 'stable' },
    { label: 'Resting Heart Rate', value: '68 bpm', change: '-4 bpm', trend: 'down' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Biometric Measurements</h1>
          <p className="text-sm text-slate-400">Track weight, vitals, and metabolic progress</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-purple-500/20">
          <Plus className="w-4 h-4" />
          <span>Record New Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs uppercase font-semibold text-slate-400 block mb-2">{metric.label}</span>
            <p className="text-2xl font-bold text-white">{metric.value}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{metric.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
