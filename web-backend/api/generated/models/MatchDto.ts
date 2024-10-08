/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamMatchDto } from './TeamMatchDto';
export type MatchDto = {
    matchId: number;
    timestamp: string;
    isRequestedMatch?: boolean;
    teamMatches: Array<TeamMatchDto>;
};

