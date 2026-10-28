'use client';

import { useEffect, Suspense } from 'react';
import { signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unauthorized';

  useEffect(() => {
    // Terminate local session and clear cookies cleanly
    const timer = setTimeout(() => {
      signOut({ callbackUrl: `/login?reason=${encodeURIComponent(reason)}` });
    }, 1200);

    return () => clearTimeout(timer);
  }, [reason]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold mb-2">Session Expired or Revoked</h2>
        <p className="text-slate-400 text-sm mb-6">
          Your credentials were reset or expired on the ERPNext server. Resetting session and redirecting you to sign in...
        </p>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <AuthErrorContent />
    </Suspense>
  );
}
