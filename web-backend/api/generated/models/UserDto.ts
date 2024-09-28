/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserDto = {
    email?: string;
    teamId?: number;
    permissionLevel?: UserDto.permissionLevel;
};
export namespace UserDto {
    export enum permissionLevel {
        ADMIN = 'Admin',
        USER = 'User',
    }
}

