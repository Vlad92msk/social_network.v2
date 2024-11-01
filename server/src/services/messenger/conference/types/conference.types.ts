export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

export interface RoomParticipant {
  userId: string;
  joinedAt: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface SignalPayload {
  targetUserId: string;
  signal: WebRTCSignal;
}

export interface RoomInfo {
  dialogId: string;
  participants: RoomParticipant[];
  participantsCount: number;
  createdAt: string;
}
