export class WebRTCError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message)
    this.name = 'WebRTCError'
  }

  static connectionFailed(peerId: string, details?: any) {
    return new WebRTCError(
      `Connection failed with peer: ${peerId}`,
      'CONNECTION_FAILED',
      details,
    )
  }

  static mediaStreamFailed(type: string, details?: any) {
    return new WebRTCError(
      `Failed to get media stream: ${type}`,
      'MEDIA_STREAM_FAILED',
      details,
    )
  }
}
