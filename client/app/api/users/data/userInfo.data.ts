import { UserInfo } from '../types/user.type'


export const ALL_USERS: UserInfo[] = [
  {
    id: '1',
    name: 'Vlad',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'offline',
  },
  {
    id: '2',
    name: 'Contact id 2',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '3',
    name: 'Contact id 3',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '4',
    name: 'Contact id 4',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '5',
    name: 'Contact id 5',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '6',
    name: 'Contact id 6',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '7',
    name: 'Contact id 7',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
]

export const USER_INFO: UserInfo[] = [
  {
    id: '1',
    name: 'Vlad',
    profileImage: 'base/me',
    contacts: ALL_USERS.splice(1, 5),
    onlineStatus: 'offline',
  },
  {
    id: '2',
    name: 'Contact id 2',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '3',
    name: 'Contact id 3',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '4',
    name: 'Contact id 4',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '5',
    name: 'Contact id 5',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '6',
    name: 'Contact id 6',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
  {
    id: '7',
    name: 'Contact id 7',
    profileImage: 'base/me',
    contacts: [],
    onlineStatus: 'online',
  },
]
