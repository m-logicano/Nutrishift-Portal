import { auth } from '@/auth';
import { Activity, TrendingDown, Scale, Ruler, FileText } from 'lucide-react';
import { getPatientVitalSigns } from '@/lib/erpnext/services';
import { MeasurementForm } from '@/components/portal/MeasurementForm';

export default async function MeasurementsPage() {
  const session = await auth();
  const patientId = (session?.user as unknown as { patient_id?: string })?.patient_id || '';

  const vitals = await getPatientVitalSigns(patientId);
  const latest = vitals[0] || null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Biometric Measurements</h1>
          <p className="text-sm text-slate-400">Track weight, BMI, body circumferences, and metabolic progress</p>
        </div>
        <MeasurementForm />
      </div>

      {/* Metric High-Level Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Current Weight</span>
            <Scale className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{latest?.weight ? `${latest.weight} kg` : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Recorded in ERPNext Vital Signs</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">BMI</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{latest?.bmi || '—'}</p>
          <p className="text-xs text-emerald-400 mt-1">{latest?.bmi_class || latest?.body_mass_classification || 'Clinical index'}</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Height</span>
            <Ruler className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">{latest?.height ? `${latest.height} cm` : '—'}</p>
          <p className="text-xs text-slate-500 mt-1">Stature record</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Waist Circumference</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            {latest?.upper_waist ? `${latest.upper_waist} cm` : latest?.lower_waist ? `${latest.lower_waist} cm` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Metabolic circumference</p>
        </div>
      </div>

      {/* Historical Entries Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Historical Vital Signs & Progress Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Direct records synced from ERPNext Marley HMS</p>
        </div>

        {vitals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Weight (kg)</th>
                  <th className="py-3 px-6">BMI</th>
                  <th className="py-3 px-6">Upper Waist</th>
                  <th className="py-3 px-6">Lower Waist</th>
                  <th className="py-3 px-6">Clinical Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {vitals.map((entry) => (
                  <tr key={entry.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-400">{entry.signs_date}</td>
                    <td className="py-4 px-6 font-bold text-white">{entry.weight || '—'}</td>
                    <td className="py-4 px-6 text-emerald-400">{entry.bmi || '—'}</td>
                    <td className="py-4 px-6">{entry.upper_waist ? `${entry.upper_waist} cm` : '—'}</td>
                    <td className="py-4 px-6">{entry.lower_waist ? `${entry.lower_waist} cm` : '—'}</td>
                    <td className="py-4 px-6 font-sans text-slate-400 max-w-xs truncate">
                      {entry.vital_signs_note || entry.nutrition_note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm">No historical measurements logged yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
