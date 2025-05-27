import { createSynapseCtx } from 'synapse-storage/react'
import { notificationsSynapse } from './notifications.synapse'

export const notificationsSynapseCtx = createSynapseCtx(notificationsSynapse)
