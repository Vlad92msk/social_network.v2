import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { EntityType } from 'src/shared/types'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { PostEntity } from '@services/posts/post/entities/post.entity'

@Entity({ name: 'tags', comment: 'Теги которыми можно помечать различные сущности' })
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'varchar', length: 50, comment: 'Название тега' })
    name: string

    @Column({ nullable: false, type: 'varchar', length: 50, comment: 'Значение' })
    value: string


    @Column({
        comment: 'К какому типу сущности чему могут относиться',
        type: 'enum',
        enum: EntityType,
    })
    entity_type: EntityType

    /**
     * К каким меда-файлам относится тег
     */
    @ManyToMany(() => MediaEntity, media => media.tags)
    media: MediaEntity[]

    /**
     * К каким постам относится тег
     */
    @ManyToMany(() => PostEntity, media => media.tags)
    posts: PostEntity[]

    @CreateDateColumn()
    date_created: Date

    @UpdateDateColumn()
    date_updated: Date
}
