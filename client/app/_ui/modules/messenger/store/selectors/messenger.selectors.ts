import { createSelector } from '@reduxjs/toolkit'
import { uniq } from 'lodash'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { RootReducer } from '../../../../../../store/root.reducer'

const selectSelf = (state: RootReducer) => state.messenger

export const selectIsConnected = createSelector(selectSelf, (messenger) => messenger.isConnected)
export const selectChatingPanelStatus = createSelector(selectSelf, (messenger) => messenger.chatingPanelStatus)
export const selectDrawerStatus = createSelector(selectSelf, (messenger) => messenger.drawerStatus)
export const selectInfoPanelStatus = createSelector(selectSelf, (messenger) => messenger.infoPanelStatus)
export const selectSelectType = createSelector(selectSelf, (messenger) => messenger.selectType)

export const selectCurrentDialogId = createSelector(selectSelf, (messenger) => messenger.currentDialogId)
export const selectActiveConference = createSelector(selectSelf, (messenger) => messenger.activeConference)

export const selectTargetNewUserToDialog = createSelector(selectSelf, (messenger) => messenger.targetNewUserToDialog)
export const selectCurrentDialog = createSelector(selectSelf, (messenger) => messenger.currentDialog)
export const selectCurrentDialogFixedMessages = createSelector(selectCurrentDialog, (currentDialog) => currentDialog?.fixed_messages || [])
export const selectCurrentDialogParticipants = createSelector(selectCurrentDialog, (currentDialog) => {
  const participantsMap = new Map<number, UserInfo>()
  currentDialog?.participants.forEach((participant) => {
    participantsMap.set(participant.id, participant)
  })
  return participantsMap
})

export const selectCurrentDialogActiveParticipants = createSelector(
  [selectSelf, selectCurrentDialogId],
  (messenger, id) => uniq(messenger.activeParticipants[id] || []),
)

export const selectCurrentDialogUsersTyping = createSelector(
  [selectSelf, selectCurrentDialogId],
  (messenger, id) => messenger.typing[id] || {},
)
