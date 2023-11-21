import type { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
// import AppleProvider from 'next-auth/providers/apple'
// import EmailProvider from 'next-auth/providers/email'
// import FacebookProvider from 'next-auth/providers/facebook'

export const authConfig: AuthOptions = {
  // pages: {
  //   signIn: '/signin',
  // },
  // это асинхронные функции, которые не возвращают ответ, они полезны для ведения журнала аудита.
  events: {
    // async signIn(message) { console.log('зашел', message) },
    // async signOut(message) {},
    // async createUser(message) { /* user created */ },
    // async updateUser(message) { /* user updated - e.g. their email was verified */ },
    // async linkAccount(message) { /* account (e.g. Twitter) linked to a user */ },
    // async session(message) { /* session is active */ },
  },
  callbacks: {
    async session({ session, token, user }) {
      // console.log('session', session)
      // console.log('token', token)
      // console.log('user', user)
      return session
    },
    async signIn({ user, account, profile }) {
      // console.log('user', user)
      // console.log('account', account)
      // console.log('profile', profile)
      return true
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
    // AppleProvider({
    //   clientId: process.env.APPLE_ID,
    //   clientSecret: process.env.APPLE_SECRET,
    // }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_ID,
    //   clientSecret: process.env.FACEBOOK_SECRET,
    // }),
    // EmailProvider({
    //   server: process.env.MAIL_SERVER,
    //   from: 'NextAuth.js <no-reply@example.com>',
    // }),
  ],
}
