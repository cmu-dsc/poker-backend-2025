import { MatchDto } from '@api/generated'
import { Request, Response } from 'express'

/**
 * Get all matches for a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<MatchDto[]>} res the response containing the matches
 */
export const getMatchTeamByGithubUsername = async (
  req: Request<any, any, any, any>,
  res: Response<MatchDto[]>,
) => {
  res.status(501).json(undefined)
}

/**
 * Get the engine logs for a match by the match id
 * @param {Request<any, any, any, any>} req the request containing the match id
 * @param {Response<string>} res the response containing the engine logs
 */
export const getMatchByMatchIdLogsEngine = async (
  req: Request<any, any, any, any>,
  res: Response<string>,
) => {
  res.status(501).json(undefined)
}

/**
 * Get the bot logs for a match by the match id
 * @param {Request<any, any, any, any>} req the request containing the match id
 * @param {Response<string>} res the response containing the bot logs
 */
export const getMatchByMatchIdLogsBot = async (
  req: Request<any, any, any, any>,
  res: Response<string>,
) => {
  res.status(501).json(undefined)
}
