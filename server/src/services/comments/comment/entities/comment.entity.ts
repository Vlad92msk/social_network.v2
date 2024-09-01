import { Entity, JoinColumn, ManyToOne } from 'typeorm'
import { PublicationEntity, PublicationType } from '@shared/entity/publication.entity'
import { MediaEntity } from '@services/media/info/entities/media.entity'

@Entity({ name: 'comments', comment: 'Комментарии, которые пользователь может оставлять под те или иные сущности' })
export class CommentEntity extends PublicationEntity {

    /**
     * Обратная ссылка на медиа-файл к которому относится комментарий
     * PS: это не сами прикрепленные файлы к комментарию!
     */
    @ManyToOne(() => MediaEntity, { nullable: true })
    @JoinColumn({ name: 'media_id' })
    mediaRef: MediaEntity

    constructor() {
        super()
        this.type = PublicationType.COMMENTARY
    }
}
