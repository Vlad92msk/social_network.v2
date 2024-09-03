import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { MessageEntity } from '@services/messages/message/entity/message.entity'
import { UserInfo } from '@services/users/user-info/entities'

@Entity({name: 'reactions', comment: 'Реакции'})
export class ReactionEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    emoji: string

    @ManyToOne(() => MessageEntity, message => message.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: MessageEntity

    @ManyToOne(() => UserInfo)
    @JoinColumn({ name: 'user_id' })
    user: UserInfo

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date
}
