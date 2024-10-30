'use client'

import { RemoteVideoOptions, useRemoteVideoStream } from '../useRemoteVideoStream'

interface RemoteVideoProps extends RemoteVideoOptions {
  className?: string;
}

export const RemoteVideo: React.FC<RemoteVideoProps> = ({ className, ...options }) => {
  const videoProps = useRemoteVideoStream(options)
  return <video {...videoProps} className={className} />
}
