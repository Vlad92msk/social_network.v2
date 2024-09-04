import { DialogEvents } from './dialog-events-enum'
import { types as mediasoupTypes } from 'mediasoup'

export interface ClientToServerEvents {
    [DialogEvents.JOIN_CONFERENCE]: (data: { dialogId: string; per_page?: number; page?: number }) => void;
    [DialogEvents.LEAVE_CONFERENCE]: (data: { dialogId: string }) => void;
    [DialogEvents.CONNECT_TRANSPORT]: (data: { dialogId: string, transportId: string, dtlsParameters: mediasoupTypes.DtlsParameters }) => void;
    [DialogEvents.PRODUCE]: (data: { dialogId: string, kind: mediasoupTypes.MediaKind, rtpParameters: mediasoupTypes.RtpParameters }) => void;
    [DialogEvents.CONSUME]: (data: { dialogId: string, producerId: string }) => void;
    [DialogEvents.PAUSE_CONSUMER]: (data: { dialogId: string, consumerId: string }) => void;
    [DialogEvents.RESUME_CONSUMER]: (data: { dialogId: string, consumerId: string }) => void;
    [DialogEvents.SET_PREFERRED_LAYERS]: (data: { dialogId: string, producerId: string, spatialLayer: number, temporalLayer: number }) => void;
}
