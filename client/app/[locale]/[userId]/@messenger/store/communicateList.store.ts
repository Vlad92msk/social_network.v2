import { create } from 'zustand'
import { GetResultFromPromise } from '@utils/tsUtils'
import { getContactsQuery, getGroupsQuery } from '../_query/communicateList'

/**
 * Отображаемый способ коммуникации - контакты/группы
 */
export enum SelectCommunicateType {
  CONTACTS,
  GROUPS
}

export type CommunicateContacts = GetResultFromPromise<ReturnType<typeof getContactsQuery>>
export type CommunicateGroups = GetResultFromPromise<ReturnType<typeof getGroupsQuery>>

/**
 * Стейт
 */
interface CommunicateState {
  contacts: CommunicateContacts
  groups: CommunicateGroups
  selectType: SelectCommunicateType
  filter: string;
}
export type CommunicateInitial = Partial<CommunicateState>

/**
 * Сеттеры
 */
interface CommunicateSetters {
  setSelectType: (select: SelectCommunicateType) => void
  setFilter: (s: string) => void;
  filteredContacts: () => CommunicateContacts | CommunicateGroups
}

/**
 * Геттеры
 */
interface CommunicateGetters {
  filteredContacts: () => CommunicateContacts | CommunicateGroups
}

/**
 * Итоговый Слайс
 */
export type MessengerCommunicateSlice = CommunicateState & CommunicateSetters & CommunicateGetters

const defaultInitState = {
  contacts: [],
  groups: [],
  filter: '',
  selectType: SelectCommunicateType.CONTACTS,
}
export const createContactsStore = (
  initState: CommunicateInitial = {},
) => create<MessengerCommunicateSlice>((set, get) => ({
  ...defaultInitState,
  ...initState,
  setSelectType: (select: SelectCommunicateType) => set({ selectType: select }),
  setFilter: (newFilter) => set({ filter: newFilter }),
  filteredContacts: () => {
    const { filter, contacts, groups, selectType } = get()

    const target = selectType === SelectCommunicateType.CONTACTS ? contacts : groups

    return target.filter((contact) => contact.name.toLowerCase().includes(filter))
  },
}))
