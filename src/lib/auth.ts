// ============================================
// CONFIGURATION NEXTAUTH - LOGIN/MOT DE PASSE
// ============================================

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Types de rôles disponibles
export type UserRole = 'admin' | 'user';

// Utilisateurs definis dans les variables d'environnement
// Format: USER_1=email:password:nom:role
// Exemple: USER_1=admin@kly.com:motdepasse123:Admin KLY:admin
// Exemple: USER_2=user@kly.com:motdepasse456:Utilisateur:user
// Si le rôle n'est pas spécifié, "user" est utilisé par défaut
function getUsers(): Array<{ email: string; password: string; name: string; role: UserRole }> {
  const users: Array<{ email: string; password: string; name: string; role: UserRole }> = [];

  // Parcourir les variables USER_1, USER_2, etc.
  for (let i = 1; i <= 20; i++) {
    const userEnv = process.env[`USER_${i}`];
    if (userEnv) {
      const [email, password, name, role] = userEnv.split(':');
      if (email && password) {
        users.push({
          email,
          password,
          name: name || email,
          role: (role === 'admin' ? 'admin' : 'user') as UserRole,
        });
      }
    }
  }

  // Utilisateur par defaut si aucun configure (admin)
  if (users.length === 0) {
    users.push({
      email: 'admin@stock.local',
      password: 'admin123',
      name: 'Administrateur',
      role: 'admin',
    });
  }

  return users;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Connexion',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'votre@email.com' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const users = getUsers();
        const user = users.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase() && u.password === credentials.password
        );

        if (user) {
          return {
            id: user.email,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = (token.role as UserRole) || 'user';
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 heures
  },

  debug: process.env.NODE_ENV === 'development',
};

// Extension des types NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
  }
}
