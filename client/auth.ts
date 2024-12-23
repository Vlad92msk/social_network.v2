import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import authConfig from './app/_configs/auth.config'

export default { providers: [Google] } satisfies NextAuthConfig

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
})
