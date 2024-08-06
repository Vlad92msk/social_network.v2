import { UserInfo } from '@api/users/types/user.type'
import Google from "next-auth/providers/google"
import { NextAuthConfig, Profile } from 'next-auth'
import { getProfileQuery } from "@api/profiles/queries";

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

class AuthManager {
  private _isAuthenticated: boolean = false

  private _userData: UserInfo | null = null

  async saveOrUpdateUser(userData: { email: string, name?: string, provider?: string, providerAccountId?: string }) {
    try {
      const response = await getProfileQuery(userData.email)

      if (response) {

        this._isAuthenticated = true
        this._userData = response
        return true
      }
      this._isAuthenticated = false
      return false
    } catch (error) {
      console.error('Ошибка запроса:', error)
      this._isAuthenticated = false
      return false
    }
  }

  getUserData(): UserInfo | null {
    return this._userData
  }

  isAuthenticated(): boolean {
    return this._isAuthenticated
  }
}

const authManager = new AuthManager()

export default {
  callbacks: {
    async session({ session, token }) {
      if ((token as ExtendedToken).myUserInfo) {
        session.user = { ...session.user, ...(token as ExtendedToken).myUserInfo }
      }
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

      if (profile && account) {
        const userData = {
          email: profile.email,
          name: profile.name,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        }

        // @ts-ignore
        return authManager.saveOrUpdateUser(userData)
      }

      return false
    },
    async jwt({ token, account }) {
      if (account && authManager.isAuthenticated()) {
        const userData = authManager.getUserData()
        if (userData) {
          (token as ExtendedToken).myUserInfo = userData
        }
      }
      return token
    },
  },
  providers: [Google({
    clientId: process.env.GOOGLE_ID as string,
    clientSecret: process.env.GOOGLE_SECRET as string,
  })]
} satisfies NextAuthConfig
