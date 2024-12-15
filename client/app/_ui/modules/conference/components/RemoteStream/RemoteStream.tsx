import React, { useEffect, useMemo, useRef } from 'react'
import { makeCn } from '@utils/others'
import style from './RemoteStream.module.scss'
import { UserInfo } from '../../../../../../../swagger/userInfo/interfaces-userInfo'
import { Name, Participant, Picture } from '../../elements'
import { Mic } from '../Mic'

export const cn = makeCn('RemoteStream', style)

interface RemoteStreamProps {
  stream?: MediaStream;
  className?: string;
  isVideoEnabled: boolean,
  isAudioEnabled: boolean,
  currentUser?: UserInfo
  streamType?: 'screen' | 'camera'
  onClick?: VoidFunction
}

export function RemoteStream(props: RemoteStreamProps) {
  const {
    stream,
    className,
    isVideoEnabled,
    currentUser,
    streamType,
    isAudioEnabled,
    onClick,
  } = props
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasVideo = isVideoEnabled && (stream?.getVideoTracks().length || 0) > 0

  useEffect(() => {
    if (stream && videoRef.current && isVideoEnabled) {
      console.log('stream', stream.getVideoTracks())
      videoRef.current.srcObject = stream
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [isVideoEnabled, stream])

  const mediaProps = useMemo(() => ({
    ref: videoRef,
    autoPlay: true,
    playsInline: true,
    muted: true,
  }), [])

  return (
    <Participant onClick={onClick} className={className}>
      <video
        {...mediaProps}
        style={{ display: !isVideoEnabled ? 'none' : 'block' }}
      />

      {!hasVideo && (
        <Picture src={currentUser?.profile_image} name={currentUser?.name} />
      )}

      <Name name={`${currentUser?.name} ${streamType === 'screen' ? '(screen)' : ''}`} />
      {streamType === 'camera' && (
        <Mic userId={String(currentUser?.id)} isMicActive={isAudioEnabled} />
      )}
    </Participant>
  )
}
