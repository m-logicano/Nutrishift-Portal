import { auth } from '@/auth';
import { User, Shield, KeyRound, ExternalLink } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  const email = session?.user?.email || '';
  const name = session?.user?.name || '';
  const role = (session?.user as unknown as { role?: string })?.role || 'free';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Account & Portal Settings</h1>
        <p className="text-sm text-slate-400">Manage your clinical profile and linked accounts</p>
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl">
            {name ? name[0].toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{name}</h2>
            <p className="text-sm text-slate-400">{email}</p>
            <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              {role} Account
            </span>
          </div>
        </div>

        {/* Linked Integrations */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Linked Ecosystem Services</h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-white">ERPNext HMS Backend</p>
                <p className="text-xs text-slate-400">Clinical identity source of truth & medical records</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-400">Connected</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">Ghost Educational Hub</p>
                <p className="text-xs text-slate-400">Automated SSO access for premium nutrition guides</p>
              </div>
            </div>
            <a
              href="/api/auth/ghost-sso"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              <span>Test SSO</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
