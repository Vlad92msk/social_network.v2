export interface UserInfo {
  id: string
  contacts?: UserInfo[]
  name?: string
  profileImage?: string
  onlineStatus?: 'online' | 'offline'
}
