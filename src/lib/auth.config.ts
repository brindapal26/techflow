import type { NextAuthConfig } from 'next-auth';

// Edge-safe config — no Node.js modules (no bcrypt, no crypto).
// Used by middleware. The full auth.ts extends this with the credentials provider.
export const authConfig = {
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
