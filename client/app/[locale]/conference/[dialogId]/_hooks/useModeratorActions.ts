// hooks/useModeratorActions.ts

import { useCallback } from 'react'
import { WebRTCSignal } from '../types/media'

interface UseModeratorActionsProps {
  sendSignal: (targetUserId: string, signal: WebRTCSignal) => void;
  participants: string[];
  isModerator: boolean;
}

export function useModeratorActions({
  sendSignal,
  participants,
  isModerator,
}: UseModeratorActionsProps) {
  const muteParticipant = useCallback((participantId: string) => {
    if (!isModerator) return

    sendSignal(participantId, {
      type: 'moderator-action',
      action: 'mute',
      target: 'audio',
    })
  }, [isModerator, sendSignal])

  const muteAllParticipants = useCallback(() => {
    if (!isModerator) return

    participants.forEach((participantId) => {
      sendSignal(participantId, {
        type: 'moderator-action',
        action: 'mute',
        target: 'audio',
      })
    })
  }, [isModerator, participants, sendSignal])

  const kickParticipant = useCallback((participantId: string) => {
    if (!isModerator) return

    sendSignal(participantId, {
      type: 'moderator-action',
      action: 'kick',
    })
  }, [isModerator, sendSignal])

  return {
    muteParticipant,
    muteAllParticipants,
    kickParticipant,
  }
}
