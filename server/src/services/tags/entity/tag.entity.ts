import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { EntityType } from "src/shared/types";

@Entity({ name: 'tags', comment: 'Теги которыми можно помечать различные сущности' })
export class Tag {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'varchar', length: 50, comment: 'Название тега' })
    name: string

    @Column({
        comment: 'К какому типу сущности чему могут относиться',
        type: 'enum',
        enum: EntityType,
    })
    entityType: EntityType

    @Column({ nullable: true, type: 'varchar', length: 80, comment: 'Id сущности' })
    entity_id: string
}
