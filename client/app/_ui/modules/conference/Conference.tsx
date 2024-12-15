'use client'

import React, { useCallback, useState } from 'react'
import { makeCn } from '@utils/others'
import { CallControls } from './components'
import { LocalPreview } from './components/LocalPreview'
import { LocalScreenShare } from './components/LocalScreenShare'
import { RemoteStream } from './components/RemoteStream'
import styles from './Conference.module.scss'
import { useConference } from './context'

export const cn = makeCn('Conference', styles)

export function Conference() {
  const {
    screenShare: { isVideoEnabled },
    roomInfo: { s: remoteStreams },
  } = useConference()

  const [pinnedStreamId, setPinnedStreamId] = useState<string | null>(null)
  const [isLocalPinned, setIsLocalPinned] = useState(false)
  const [isLocalScreenPinned, setIsLocalScreenPinned] = useState(false)

  const handleStreamClick = useCallback((streamId: string | undefined) => {
    if (!streamId) return
    setIsLocalPinned(false)
    setIsLocalScreenPinned(false)
    setPinnedStreamId(pinnedStreamId === streamId ? null : streamId)
  }, [pinnedStreamId])

  const handleLocalPreviewClick = useCallback(() => {
    setPinnedStreamId(null)
    setIsLocalScreenPinned(false)
    setIsLocalPinned(!isLocalPinned)
  }, [isLocalPinned])

  const handleLocalScreenClick = useCallback(() => {
    setPinnedStreamId(null)
    setIsLocalPinned(false)
    setIsLocalScreenPinned(!isLocalScreenPinned)
  }, [isLocalScreenPinned])

  const pinnedStream = remoteStreams.find((props) => props.stream?.id === pinnedStreamId)
  const unpinnedStreams = remoteStreams.filter((props) => props.stream?.id !== pinnedStreamId)

  const renderMainContent = () => {
    if (isLocalPinned) {
      return <LocalPreview className={cn('Pin')} onClick={handleLocalPreviewClick} />
    }
    if (isLocalScreenPinned) {
      return <LocalScreenShare className={cn('Pin')} onClick={handleLocalPreviewClick} />
    }
    if (pinnedStream) {
      return <RemoteStream {...pinnedStream} className={cn('Pin')} onClick={() => handleStreamClick(pinnedStream.stream?.id)} />
    }
    return (
      <>
        <LocalPreview onClick={handleLocalPreviewClick} />
        {remoteStreams.map((props) => (
          <RemoteStream key={props.stream?.id} onClick={() => handleStreamClick(props.stream?.id)} {...props} />
        ))}
        <LocalScreenShare onClick={handleLocalScreenClick} />
      </>
    )
  }

  const renderParticipantList = () => {
    if (!isLocalPinned && !isLocalScreenPinned && !pinnedStream) return null

    const streamsCount = remoteStreams.length
    return (
      <div className={cn('ParticipantList')}>
        <div className={cn('ParticipantsInfo')}>
          {`Участники (${streamsCount})`}
        </div>
        {!isLocalPinned && <div onClick={handleLocalPreviewClick}><LocalPreview /></div>}
        {unpinnedStreams.map((props) => (
          <div key={props.stream?.id}>
            <RemoteStream onClick={() => handleStreamClick(props.stream?.id)} {...props} />
          </div>
        ))}
        {!isLocalScreenPinned && isVideoEnabled && <div onClick={handleLocalScreenClick}><LocalScreenShare /></div>}
      </div>
    )
  }

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        <div className={cn('RemoteStreams')}>
          {renderMainContent()}
        </div>
        {renderParticipantList()}
      </div>

      <div className={cn('ActionsContainer')}>
        <div className={cn('MediaControls')}>
          <CallControls />
        </div>
      </div>
    </div>
  )
}
