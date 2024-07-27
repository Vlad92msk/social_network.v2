export interface UserInfo {
  id: string
  contacts?: Partial<UserInfo>[]
  name?: string
  profileImage?: string
  onlineStatus?: 'online' | 'offline'
}
