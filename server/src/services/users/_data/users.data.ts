import { UserAboutType, UserInfoType } from "../_interfaces";

export const ABOUT_INFO: UserAboutType = {
    id: 1,
    description: "About",
    study: 'mgpu',
    working: '42',
    position: 'frontend-developer',
    banner_image: 'front_developer.jpg',
}

export const USER: UserInfoType = {
    id: 1,
    name: 'vlad',
    profile_image: 'front_developer.jpg',
    public_id: 'ppppppp__pppp',
    about_info: ABOUT_INFO
}

export const USERS: UserInfoType[] = [USER]
