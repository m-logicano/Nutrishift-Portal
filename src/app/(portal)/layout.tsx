import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserRole } from '@/lib/auth/types';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const role = ((session.user as unknown as { role?: UserRole })?.role || 'free') as UserRole;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar
        userRole={role}
        userName={session.user.name || 'Patient'}
        userEmail={session.user.email || ''}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
