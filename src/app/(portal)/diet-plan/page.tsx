import { auth } from '@/auth';
import { Utensils, CheckCircle2, FileDown, FileText, Download } from 'lucide-react';
import { getPatientFiles } from '@/lib/erpnext/services';

export default async function DietPlanPage() {
  const session = await auth();
  const patientId = (session?.user as unknown as { patient_id?: string })?.patient_id || '';

  const files = await getPatientFiles(patientId);

  const defaultMeals = [
    {
      time: 'Breakfast (8:30 AM)',
      items: [
        { name: 'Oatmeal with chia seeds & unsweetened almond milk', qty: '1 bowl' },
        { name: 'Boiled pasture-raised eggs', qty: '2 large' },
        { name: 'Green tea or black coffee', qty: '1 cup' },
      ],
    },
    {
      time: 'Lunch (2:00 PM)',
      items: [
        { name: 'Grilled chicken breast or wild-caught fish', qty: '180g' },
        { name: 'Steamed Mediterranean leafy greens', qty: '1 cup' },
        { name: 'Quinoa or brown basmati rice', qty: '1/2 cup' },
      ],
    },
    {
      time: 'Dinner (8:00 PM)',
      items: [
        { name: 'Low-fat Greek yogurt with sliced cucumber & mint', qty: '1 cup' },
        { name: 'Raw mixed vegetable salad with cold-pressed olive oil', qty: '1 large bowl' },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinical Nutrition Protocol</h1>
          <p className="text-sm text-slate-400">Dietary prescriptions, timing, and custom PDF meal plans</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Clinical Diet Protocol</span>
        </div>
      </div>

      {/* Clinical Files & PDF Downloads */}
      {files.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-white text-base">Prescribed Diet Documents & Attachments</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {files.map((f) => (
              <a
                key={f.name}
                href={f.file_url.startsWith('http') ? f.file_url : `${process.env.ERPNEXT_URL || ''}${f.file_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-colors group"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                      {f.file_name}
                    </p>
                    <p className="text-xs text-slate-500">{f.creation ? f.creation.split(' ')[0] : 'Prescribed Document'}</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Meal Protocol Breakdown */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">Daily Nutritional Timing & Portions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {defaultMeals.map((meal) => (
            <div key={meal.time} className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <h2 className="font-semibold text-white text-sm">{meal.time}</h2>
              </div>
              <ul className="space-y-3">
                {meal.items.map((item) => (
                  <li key={item.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <p className="font-medium text-slate-200">{item.name}</p>
                    <p className="text-emerald-400 mt-0.5">{item.qty}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
