import { auth } from '@/auth';
import { Calendar, Utensils, Activity, ArrowUpRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { getPatientProfile, getPatientVitalSigns, getPatientAppointments } from '@/lib/erpnext/services';

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || 'Patient';
  const patientId = (session?.user as unknown as { patient_id?: string })?.patient_id || '';
  const role = (session?.user as unknown as { role?: string })?.role || 'free';

  // Parallel live fetching from ERPNext
  const [profile, vitals, appointments] = await Promise.all([
    getPatientProfile(patientId),
    getPatientVitalSigns(patientId),
    getPatientAppointments(patientId),
  ]);

  const latestVital = vitals[0] || null;
  const previousVital = vitals[1] || null;

  let weightChangeText = 'Initial recording';
  if (latestVital?.weight && previousVital?.weight) {
    const diff = latestVital.weight - previousVital.weight;
    weightChangeText = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg since last check-in`;
  }

  const nextAppointment = appointments[0] || null;

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-900/40 border border-slate-800 shadow-xl">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Nutrishift Clinical Hub
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-1">
            Welcome back, {profile?.patient_name || userName}!
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Patient ID: <span className="font-mono text-slate-300">{patientId || 'Unlinked'}</span> • Status:{' '}
            <span className="capitalize font-semibold text-emerald-400">{profile?.status || role}</span>
            {profile?.blood_group ? ` • Blood: ${profile.blood_group}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/auth/ghost-sso"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-sm font-semibold transition-all"
          >
            <span>Exclusive Guides</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Diet Protocol */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-semibold text-slate-400">Prescribed Protocol</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">Metabolic Nutrition</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active clinical care plan</span>
          </div>
        </div>

        {/* Next Appointment */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-semibold text-slate-400">Next Consultation</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          {nextAppointment ? (
            <>
              <p className="text-xl font-bold text-white truncate">
                {nextAppointment.appointment_date || nextAppointment.encounter_date || 'Upcoming'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {nextAppointment.practitioner_name ? `Dr. ${nextAppointment.practitioner_name}` : 'Clinical Specialist'}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-400">None Scheduled</p>
              <p className="text-xs text-slate-500 mt-2">Book your next follow-up review</p>
            </>
          )}
        </div>

        {/* Vitals & Weight */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-semibold text-slate-400">Latest Biometrics</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          {latestVital?.weight ? (
            <>
              <p className="text-2xl font-bold text-white">{latestVital.weight} kg</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-purple-400">
                <span>{weightChangeText}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-400">No Vitals Yet</p>
              <p className="text-xs text-slate-500 mt-2">Log your first weekly measurement</p>
            </>
          )}
        </div>
      </div>

      {/* Clinical Schedule & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Upcoming Schedule</h2>
          {nextAppointment ? (
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                  {(nextAppointment.appointment_date || nextAppointment.encounter_date || 'NOW').slice(5)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {nextAppointment.notes || 'Nutritional Consultation'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {nextAppointment.practitioner_name ? `Dr. ${nextAppointment.practitioner_name}` : 'Specialist'}
                    {nextAppointment.appointment_time ? ` • ${nextAppointment.appointment_time}` : ''}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {nextAppointment.status}
              </span>
            </div>
          ) : (
            <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-slate-800/60 text-slate-400 text-sm">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p>No active consultations scheduled right now.</p>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h2 className="text-lg font-bold text-white mb-4">Quick Health Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/appointments"
              className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 transition-colors block"
            >
              <Calendar className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm font-semibold text-white">Appointments</p>
              <p className="text-xs text-slate-400 mt-1">Review clinical schedule</p>
            </a>
            <a
              href="/measurements"
              className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 transition-colors block"
            >
              <Activity className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm font-semibold text-white">Log Metrics</p>
              <p className="text-xs text-slate-400 mt-1">Record weight & vitals</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
