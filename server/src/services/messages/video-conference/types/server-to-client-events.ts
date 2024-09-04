import { DialogEvents } from './dialog-events-enum'
import { types as mediasoupTypes } from 'mediasoup'

export interface ServerToClientEvents {
    [DialogEvents.USER_JOINED]: (data: { userId: number }) => void;
    [DialogEvents.USER_LEFT]: (data: { userId: number }) => void;
    [DialogEvents.NEW_PRODUCER]: (data: { userId: number, producerId: string, kind: mediasoupTypes.MediaKind }) => void;
    error: (data: { message: string; error: string }) => void;
}
