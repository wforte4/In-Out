import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
    updateAge: 60 * 60, // 1 hour - update session if older than 1 hour
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          // Return a special error to handle in the frontend
          throw new Error('EMAIL_NOT_VERIFIED')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.profileImage,
        }
      }
    })
  ],
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: async ({ session, token }: any) => {
      if (token.uid) {
        // Fetch fresh user data from database
        const user = await prisma.user.findUnique({
          where: { id: token.uid },
          select: { id: true, name: true, email: true, profileImage: true }
        })
        
        if (user) {
          session.user = {
            ...session.user,
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.profileImage,
          }
        }
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt: ({ user, token }: any) => {
      if (user) {
        token.uid = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.lastActivity = Date.now();
      }
      
      // Check for session timeout (8 hours of inactivity)
      const now = Date.now();
      const lastActivity = token.lastActivity || now;
      const sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      
      if (now - lastActivity > sessionTimeout) {
        // Session expired, return null to force re-authentication
        return null;
      }
      
      // Update last activity timestamp on each token refresh
      token.lastActivity = now;
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
}