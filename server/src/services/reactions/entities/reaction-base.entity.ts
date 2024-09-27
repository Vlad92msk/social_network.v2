import { ApiProperty } from '@nestjs/swagger'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'reactions_base', comment: 'Объект реакции' })
export class ReactionBaseEntity {
    @ApiProperty({ description: 'Уникальный идентификатор реакции' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Название', type: String, nullable: false })
    @Column({ comment: 'Название', type: 'varchar', length: 40, nullable: false })
    name: string

    @ApiProperty({ description: 'Дата создания реакции', type: Date })
    @CreateDateColumn({ comment: 'Дата создания' })
    created_at: Date
}
