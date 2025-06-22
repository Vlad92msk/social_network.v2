export interface User {
  id: string
  email: string
  name: string | null
  avatar: string | null
  emailVerified: boolean
  provider: AuthProvider
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
}

export type FirebaseProvider = 'google' | 'email' | 'github' | 'microsoft' | 'apple' | 'facebook' | 'twitter' | 'yahoo'
export type ExternalProvider = 'auth0' | 'okta' | 'supabase' | 'cognito' | 'clerk'
export type AuthProvider = FirebaseProvider | ExternalProvider

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface AuthResult {
  user?: User
  error?: string
  success: boolean
}

export interface AuthRedirects {
  afterSignIn: string
  afterSignOut: string
  whenUnauthenticated: string
  onAccessDenied?: string
}

export interface AuthConfig {
  redirects: AuthRedirects
  autoRedirect: boolean
  providers: AuthProvider[]
  authPages?: string[]
  sessionTimeout?: number
  guards: { // Убираем optional - всегда должен быть
    enabled: boolean
    globalTimeout?: number
    fallback?: 'redirect' | 'component'
    fallbackComponent?: React.ComponentType<{ reason?: string }>
  }
}

export interface AuthMethods {
  signInWithGoogle(): Promise<AuthResult>
  signInWithEmail(email: string, password: string): Promise<AuthResult>
  signUpWithEmail(email: string, password: string, name: string): Promise<AuthResult>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
  onAuthStateChanged(callback: (user: User | null) => void): () => void
}

export interface AuthProviderInterface {
  name: AuthProvider
  methods: Partial<AuthMethods & Record<string, any>>
}

// Экспортируем типы guards
export * from './guards'
