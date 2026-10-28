import { Calendar, Plus } from 'lucide-react';

export default function AppointmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Appointments</h1>
          <p className="text-sm text-slate-400">View and manage your scheduled consultations</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-white">Comprehensive Nutritional Follow-up</p>
              <p className="text-xs text-slate-400">Scheduled for Tomorrow at 4:00 PM • Virtual (Google Meet)</p>
            </div>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Confirmed
          </span>
        </div>
      </div>
    </div>
  );
}
