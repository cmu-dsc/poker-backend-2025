/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BotDto } from './BotDto';
export type TeamDto = {
    teamId: number;
    teamName: string;
    activeBot?: BotDto;
    members: Array<number>;
    wins?: number;
    losses?: number;
    elo?: number;
    isDeleted?: boolean;
};

