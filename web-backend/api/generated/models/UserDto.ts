/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserDto = {
    userId: number;
    email: string;
    permissionLevel: UserDto.permissionLevel;
    teamId?: number;
    teamName?: string;
};
export namespace UserDto {
    export enum permissionLevel {
        ADMIN = 'ADMIN',
        USER = 'USER',
    }
}

