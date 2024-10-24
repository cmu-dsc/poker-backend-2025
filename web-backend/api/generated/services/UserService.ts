/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamInviteDto } from '../models/TeamInviteDto';
import type { UserDto } from '../models/UserDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserService {
    /**
     * Get the current user
     * Get the current user
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getUserMe(): CancelablePromise<UserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/me',
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Leave the current team
     * Leave the current team
     * @returns void
     * @throws ApiError
     */
    public static postUserTeamLeave(): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/user/team/leave',
            errors: {
                401: `Unauthorized`,
                422: `Not in a team`,
            },
        });
    }
    /**
     * Get all team invites
     * Get all team invites for a user
     * @returns TeamInviteDto OK
     * @throws ApiError
     */
    public static getUserTeamInvite(): CancelablePromise<Array<TeamInviteDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/team/invite',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
    /**
     * Accept a team invite
     * Accept a team invite
     * @param teamInviteId The team invite id
     * @returns void
     * @throws ApiError
     */
    public static putUserTeamInviteAccept(
        teamInviteId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/user/team/invite/{teamInviteId}/accept',
            path: {
                'teamInviteId': teamInviteId,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                422: `Team invite already accepted`,
            },
        });
    }
    /**
     * Reject a team invite
     * Reject a team invite
     * @param teamInviteId The team invite id
     * @returns void
     * @throws ApiError
     */
    public static putUserTeamInviteReject(
        teamInviteId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/user/team/invite/{teamInviteId}/reject',
            path: {
                'teamInviteId': teamInviteId,
            },
            errors: {
                401: `Unauthorized`,
                404: `Not Found`,
                422: `Team invite already rejected`,
            },
        });
    }
    /**
     * Get all users
     * Get all users
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getUser(): CancelablePromise<Array<UserDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user',
        });
    }
    /**
     * Get a user by user id
     * Get a user by user id
     * @param userId The user id
     * @returns UserDto OK
     * @throws ApiError
     */
    public static getUser1(
        userId: number,
    ): CancelablePromise<UserDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/user/{userId}',
            path: {
                'userId': userId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }
    /**
     * Update a user by user id
     * Update a user by user id
     * @param userId The user id
     * @param requestBody
     * @returns UserDto OK
     * @throws ApiError
     */
    public static putUser(
        userId: number,
        requestBody: UserDto,
    ): CancelablePromise<UserDto> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/user/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
