/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
const NextAuth = require('next-auth').default
import { authOptions } from '@/lib/auth'

const handler: any = NextAuth(authOptions)

export { handler as GET, handler as POST }