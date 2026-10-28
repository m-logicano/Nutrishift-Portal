import { Utensils, CheckCircle2 } from 'lucide-react';

export default function DietPlanPage() {
  const meals = [
    {
      time: 'Breakfast (8:30 AM)',
      items: [
        { name: 'Oatmeal with chia seeds & almond milk', qty: '1 bowl' },
        { name: 'Boiled eggs', qty: '2 large' },
        { name: 'Black coffee or green tea', qty: '1 cup' },
      ],
    },
    {
      time: 'Lunch (2:00 PM)',
      items: [
        { name: 'Grilled chicken breast or salmon fillet', qty: '180g' },
        { name: 'Steamed Mediterranean vegetables', qty: '1 cup' },
        { name: 'Quinoa or brown basmati rice', qty: '1/2 cup' },
      ],
    },
    {
      time: 'Dinner (8:00 PM)',
      items: [
        { name: 'Greek yogurt with cucumber & mint', qty: '1 cup' },
        { name: 'Raw mixed greens with cold-pressed olive oil', qty: '1 large bowl' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Prescribed Diet Plan</h1>
          <p className="text-sm text-slate-400">Clinical dietary guidelines assigned in ERPNext</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Protocol</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {meals.map((meal) => (
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
  );
}
