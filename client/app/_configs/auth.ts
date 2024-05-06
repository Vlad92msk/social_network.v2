import { UserInfo } from '@api/users/types/user.type'
import { cookies } from 'next/headers'
import type { AuthOptions, Profile } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { CookieType } from '../types/cookie'

interface ExtendedProfile extends Profile {
  email_verified?: boolean
}

// interface ExtendedAccount extends Account {
//   provider?: string
//   providerAccountId?: string
// }

interface ExtendedToken {
  myUserInfo?: UserInfo;
  email?: string
  name?: string
  picture?: string
  sub?: string
  iat?: number
  exp?: number
}

interface UserInfo1 {
  message: string
  token: string
  // Дополнительные поля, если требуются
}

class AuthManager {
  private _isAuthenticated: boolean = false

  private _userData: UserInfo | null = null

  async saveOrUpdateUser(userData: { email?: string, name?: string, provider?: string, providerAccountId?: string }) {
    try {
      const response = await fetch(`http://localhost:3000/api/profiles/${userData.email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        const tokenData = await response.json()

        this._isAuthenticated = true
        this._userData = tokenData
        cookies().set({
          name: CookieType.USER_ID,
          value: tokenData.userInfo.id,
          maxAge: 60 * 60 * 24 * 30, // 30 дней
          path: '/',
        })
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

export const authConfig: AuthOptions = {
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
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
}
