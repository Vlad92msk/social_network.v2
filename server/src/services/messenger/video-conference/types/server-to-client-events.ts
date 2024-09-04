import { VideoConferenceEvents } from './video-conference-events-enum'
import { types as mediasoupTypes } from 'mediasoup'

export interface ServerToClientEvents {
    [VideoConferenceEvents.USER_JOINED]: (data: { userId: number }) => void;
    [VideoConferenceEvents.USER_LEFT]: (data: { userId: number }) => void;
    [VideoConferenceEvents.NEW_PRODUCER]: (data: { userId: number, producerId: string, kind: mediasoupTypes.MediaKind }) => void;
    [VideoConferenceEvents.SCREEN_SHARE_STARTED]: (data: { userId: number, producerId: string }) => void;
    [VideoConferenceEvents.SCREEN_SHARE_STOPPED]: (data: { userId: number, producerId: string }) => void;
    [VideoConferenceEvents.VIDEO_QUALITY_CHANGED]: (data: { producerId: string, spatialLayer: number, temporalLayer: number }) => void;
    [VideoConferenceEvents.CONFERENCE_ENDED]: () => void;
    error: (data: { message: string; error: string }) => void;
}
