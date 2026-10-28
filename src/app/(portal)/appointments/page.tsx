import { auth } from '@/auth';
import { Calendar, Video, Clock, User, AlertCircle, Plus } from 'lucide-react';
import { getPatientAppointments } from '@/lib/erpnext/services';

export default async function AppointmentsPage() {
  const session = await auth();
  const patientId = (session?.user as unknown as { patient_id?: string })?.patient_id || '';

  const appointments = await getPatientAppointments(patientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Appointments</h1>
          <p className="text-sm text-slate-400">Scheduled consultations, virtual reviews, and clinical encounters</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4" />
          <span>Book Consultation</span>
        </button>
      </div>

      {appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const dateStr = appt.appointment_date || appt.encounter_date || 'Date TBD';
            const timeStr = appt.appointment_time || appt.encounter_time || '';

            return (
              <div
                key={appt.name}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">
                      {appt.notes || appt.clinical_notes || 'Nutritional Consultation'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {dateStr} {timeStr ? `at ${timeStr}` : ''}
                      </span>
                      {appt.practitioner_name && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          Dr. {appt.practitioner_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appt.google_meet_link && (
                    <a
                      href={appt.google_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Join Call</span>
                    </a>
                  )}
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {appt.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Consultations Scheduled</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
            You currently have no upcoming visits. Click below to request a new consultation with your clinical nutritionist.
          </p>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4" />
            <span>Schedule Follow-Up</span>
          </button>
        </div>
      )}
    </div>
  );
}
