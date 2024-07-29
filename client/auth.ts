import authConfig from './app/_configs/auth.config'
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export default { providers: [Google] } satisfies NextAuthConfig



export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
})

