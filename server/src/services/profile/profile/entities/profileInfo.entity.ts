import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { ProfileInfoType, ProfileType } from "../../_interfaces";
import { UserInfo } from "@src/services/users/user/entities/user.entity";
import { UserInfoType } from "@src/services/users/_interfaces";
import { Settings } from "./settings.entity";
import { ProfileSettings } from "../../_interfaces/settings";

@Entity({ comment: 'Профиль пользователя' })
export class UserProfileInfo implements ProfileInfoType {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 40, nullable: false, unique: true })
    email: string;

    @Column({ type: 'enum', nullable: false, enum: ProfileType, default: ProfileType.USER })
    type: ProfileType

    //__________________
    // Связи

    @OneToOne(type => UserInfo, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_info_id', referencedColumnName: 'id' })
    user_info: UserInfoType

    @OneToOne(type => Settings, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'settings_id', referencedColumnName: 'id' })
    settings: ProfileSettings
}
