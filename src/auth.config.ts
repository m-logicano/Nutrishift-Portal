import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { z } from 'zod';
import { UserRole } from '@/lib/auth/types';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isPortalRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/appointments') ||
        pathname.startsWith('/diet-plan') ||
        pathname.startsWith('/measurements') ||
        pathname.startsWith('/settings');

      const isPaidContentRoute = pathname.startsWith('/content');
      const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

      if (isPortalRoute) {
        if (!isLoggedIn) return false; // Redirect to /login
        return true;
      }

      if (isPaidContentRoute) {
        if (!isLoggedIn) return false;
        const role = (auth?.user as { role?: string })?.role;
        if (role !== 'paid' && role !== 'admin') {
          return Response.redirect(new URL('/pricing', nextUrl));
        }
        return true;
      }

      if (isLoggedIn && isAuthRoute) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          role?: UserRole;
          patient_id?: string;
          customer_id?: string;
          erp_api_key?: string;
          erp_api_secret?: string;
          ghost_member_id?: string;
        };
        token.role = u.role || 'free';
        token.patient_id = u.patient_id || '';
        token.customer_id = u.customer_id || '';
        token.erp_api_key = u.erp_api_key || '';
        token.erp_api_secret = u.erp_api_secret || '';
        token.ghost_member_id = u.ghost_member_id || '';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) || '';
        (session.user as unknown as { role: UserRole }).role = (token.role as UserRole) || 'free';
        (session.user as unknown as { patient_id: string }).patient_id = (token.patient_id as string) || '';
        (session.user as unknown as { customer_id: string }).customer_id = (token.customer_id as string) || '';
        (session.user as unknown as { ghost_member_id: string }).ghost_member_id =
          (token.ghost_member_id as string) || '';
      }
      return session;
    },
  },

  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const credentialsSchema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        });

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Dynamic import keeps auth.config.ts edge-compatible
        const { loginWithERPNext } = await import('@/lib/auth/erpnext-login');
        const user = await loginWithERPNext(parsed.data.email, parsed.data.password);
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          patient_id: user.patient_id,
          customer_id: user.customer_id,
          erp_api_key: user.erp_api_key,
          erp_api_secret: user.erp_api_secret,
          ghost_member_id: user.ghost_member_id,
        };
      },
    }),
  ],
};
