import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { EntityType } from 'src/shared/types'
import { MediaEntity } from '@services/media/info/entities/media.entity'
import { PostEntity } from '@services/posts/post/entities/post.entity'
import { ApiProperty } from '@nestjs/swagger'


@Entity({ name: 'tags', comment: 'Теги которыми можно помечать различные сущности' })
export class Tag {
    @ApiProperty({ description: 'Уникальный идентификатор тега' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Название тега' })
    @Column({ nullable: false, type: 'varchar', length: 50, comment: 'Название тега' })
    name: string

    @ApiProperty({ description: 'Значение тега' })
    @Column({ nullable: false, type: 'varchar', length: 50, comment: 'Значение' })
    value: string

    @ApiProperty({ description: 'Тип сущности, к которой относится тег', enum: EntityType })
    @Column({
        comment: 'К какому типу сущности чему могут относиться',
        type: 'enum',
        enum: EntityType,
    })
    entity_type: EntityType

    @ApiProperty({ description: 'Связанные медиа-файлы', type: () => [MediaEntity], nullable: true })
    @ManyToMany(() => MediaEntity, media => media.tags)
    media: MediaEntity[]

    @ApiProperty({ description: 'Связанные посты', type: () => [PostEntity], nullable: true })
    @ManyToMany(() => PostEntity, media => media.tags)
    posts: PostEntity[]

    @ApiProperty({ description: 'Дата создания' })
    @CreateDateColumn()
    date_created: Date

    @ApiProperty({ description: 'Дата обновления' })
    @UpdateDateColumn()
    date_updated: Date
}
