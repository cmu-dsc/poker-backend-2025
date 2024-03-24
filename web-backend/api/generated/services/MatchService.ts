/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MatchDto } from '../models/MatchDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MatchService {
    /**
     * Get all matches
     * Get all matches of my team
     * @param githubUsername The github username of the team
     * @returns MatchDto OK
     * @throws ApiError
     */
    public static getMatchTeam(
        githubUsername: string,
    ): CancelablePromise<Array<MatchDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/match/team/{githubUsername}',
            path: {
                'githubUsername': githubUsername,
            },
        });
    }
    /**
     * Get the engine logs of a match by match id
     * Get the engine logs of a match by match id
     * @param matchId The match id
     * @returns string OK
     * @throws ApiError
     */
    public static getMatchLogsEngine(
        matchId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/match/{matchId}/logs/engine',
            path: {
                'matchId': matchId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
    /**
     * Get the bot logs of a match by match id
     * Get the bot logs of a match by match id
     * @param matchId The match id
     * @returns string OK
     * @throws ApiError
     */
    public static getMatchLogsBot(
        matchId: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/match/{matchId}/logs/bot',
            path: {
                'matchId': matchId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }
}
