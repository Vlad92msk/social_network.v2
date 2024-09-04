import { VideoConferenceEvents } from './video-conference-events-enum'
import { types as mediasoupTypes } from 'mediasoup'

export interface ClientToServerEvents {
    [VideoConferenceEvents.JOIN_CONFERENCE]: (data: { dialogId: string; per_page?: number; page?: number }) => void;
    [VideoConferenceEvents.LEAVE_CONFERENCE]: (data: { dialogId: string }) => void;
    [VideoConferenceEvents.CONNECT_TRANSPORT]: (data: { dialogId: string, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters }) => void;
    [VideoConferenceEvents.PRODUCE]: (data: { dialogId: string, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters }) => void;
    [VideoConferenceEvents.CONSUME]: (data: { dialogId: string, producerId: string }) => void;
    [VideoConferenceEvents.PAUSE_CONSUMER]: (data: { dialogId: string, consumerId: string }) => void;
    [VideoConferenceEvents.RESUME_CONSUMER]: (data: { dialogId: string, consumerId: string }) => void;
    [VideoConferenceEvents.SET_PREFERRED_LAYERS]: (data: { dialogId: string, producerId: string, spatialLayer: number, temporalLayer: number }) => void;
    [VideoConferenceEvents.START_SCREEN_SHARE]: (data: { dialogId: string, rtpParameters: mediasoupTypes.RtpParameters }) => void;
    [VideoConferenceEvents.STOP_SCREEN_SHARE]: (data: { dialogId: string, producerId: string }) => void;
    [VideoConferenceEvents.SET_VIDEO_QUALITY]: (data: { dialogId: string, producerId: string, quality: 'low' | 'medium' | 'high' }) => void;
}
