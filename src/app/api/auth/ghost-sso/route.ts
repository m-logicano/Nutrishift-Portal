import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { buildGhostSSOUrl } from '@/lib/ghost/sso';

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }

  const ssoUrl = await buildGhostSSOUrl(
    session.user.email,
    session.user.name || session.user.email.split('@')[0]
  );

  return NextResponse.redirect(ssoUrl);
}
