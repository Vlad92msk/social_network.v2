import { Icon } from '@components/ui'
import { useAuth } from '../../../auth/AuthProvider'

export const LogoutButton = () => {
  const { signOut, isLoading, user } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (!user) return null

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {user.name || user.email}
      </span>

      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <Icon name="sign-out" size={16} />
        )}
        Выйти
      </button>
    </div>
  )
}
