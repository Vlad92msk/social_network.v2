import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { MediaItemType } from "../interfaces/mediaItemType";

@Entity()
export class MediaMetadata {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    src: string;

    @Column()
    mimeType: string;

    @Column('int')
    size: number;

    @Column()
    lastModified: Date;

    @Column({
        type: 'enum',
        enum: MediaItemType,
    })
    type: MediaItemType;

    @Column()
    user_id: string;

    @CreateDateColumn()
    date_upload: Date;
}
