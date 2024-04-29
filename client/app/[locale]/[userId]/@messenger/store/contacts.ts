import { create } from 'zustand'

const CONTACTS = [
  { id: '1', contactImg: 'base/me', name: 'Friend 1', lastContactMessage: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '2', contactImg: 'base/me', name: 'Friend 2', lastContactMessage: 'Friend 3', lastMessage: 'last long message last long message last long message last long message' },
  { id: '3', contactImg: 'base/me', name: 'Friend 3', lastContactMessage: 'Friend 3', lastMessage: 'last long message last long message last long message last long message' },
  { id: '4', contactImg: 'base/me', name: 'Friend 4', lastContactMessage: 'Friend 7', lastMessage: 'last long message last long message last long message last long message' },
  { id: '5', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '6', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '7', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '8', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '9', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '10', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '11', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '12', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '13', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '14', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '15', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '16', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
]

const GROUPS = [
  { id: '10', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '11', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '12', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '13', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '14', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '15', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '16', contactImg: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
]

type Contacts = typeof CONTACTS
type Groups = typeof GROUPS

export enum SelectType {
  CONTACTS,
  GROUPS
}

interface MessengerContacts {
  contacts: Contacts;
  groups: Groups;
  selectType: SelectType
  setSelectType: (select: SelectType) => void
  filter: string;
  setFilter: (s: string) => void;
  filteredContacts: () => Contacts;
}

export const useMessengerContacts = create<MessengerContacts>((set, get) => ({
  contacts: CONTACTS,
  groups: GROUPS,
  selectType: SelectType.CONTACTS,
  setSelectType: (select: SelectType) => set({ selectType: select }),
  filter: '',
  setFilter: (newFilter) => set({ filter: newFilter }),
  filteredContacts: () => {
    const { filter, contacts, groups, selectType } = get()

    const target = selectType === SelectType.CONTACTS ? contacts : groups

    return target.filter((contact) => contact.name.toLowerCase().includes(filter))
  },
}))
