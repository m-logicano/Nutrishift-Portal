'use client';

import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  UtensilsCrossed,
  Activity,
  BookOpen,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  userRole?: string;
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userRole = 'free', userName = 'Patient', userEmail = '' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Diet Plan', href: '/diet-plan', icon: UtensilsCrossed },
    { name: 'Measurements', href: '/measurements', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-white tracking-tight">Nutrishift</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            {userRole}
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </a>
          );
        })}

        {/* Ghost Blog Native SSO Link */}
        <div className="pt-4 mt-4 border-t border-slate-800/80">
          <span className="px-3.5 text-[11px] font-semibold tracking-wider uppercase text-slate-500 block mb-2">
            Knowledge & Hub
          </span>
          <a
            href="/api/auth/ghost-sso"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 transition-colors border border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4" />
              <span>Nutrition Guides</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        </div>
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
