'use client'

import { RemoteVideoOptions, useRemoteVideoStream } from '../useRemoteVideoStream'

interface RemoteVideoProps extends RemoteVideoOptions {
  className?: string;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({ className, ...options }) => {
  const videoProps = useRemoteVideoStream(options)
  console.log('RemoteVideo', videoProps)
  return <video {...videoProps} className={className} />
}
