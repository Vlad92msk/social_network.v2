import { UserInfo } from '@api/users/types/user.type'
import Google from "next-auth/providers/google"
import { NextAuthConfig, Profile } from 'next-auth'

interface ExtendedProfile extends Profile {
  email_verified?: boolean
}


interface ExtendedToken {
  myUserInfo?: UserInfo;
  email?: string
  name?: string
  picture?: string
  sub?: string
  iat?: number
  exp?: number
}


export default {
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async signIn({ account, profile }) {
      if (!account || !profile) return false

      switch (account.provider) {
        case 'google':
          if (!(profile as ExtendedProfile).email_verified) return false
          break

        case 'facebook':
          // Здесь может быть специфическая проверка для Facebook
          break
        // Логика по умолчанию или для неизвестных провайдеров
        default: return false
      }

      return !!(profile && account);
    },
    async jwt({ token, account }) {
      return token
    },
  },
  providers: [Google({
    clientId: process.env.GOOGLE_ID as string,
    clientSecret: process.env.GOOGLE_SECRET as string,
  })]
} satisfies NextAuthConfig
