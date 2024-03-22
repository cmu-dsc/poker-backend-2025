import { MatchDto } from '@api/generated'
import { Request, Response } from 'express'
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { getMatchesByTeamId } from 'src/services/matchService'
import { checkUserIdPermissionForMatch } from 'src/services/permissions/matchPermissionService'
import { checkUserIdPermissionsForTeamGithubName } from 'src/services/permissions/teamPermissionService'
import {
  validateLimit,
  validateMatchId,
  validateOffset,
  validateOrder,
  validateSortBy,
} from 'src/services/validators/matchValidatorService'
import { validateTeamName } from 'src/services/validators/teamValidatorService'

/**
 * Get all matches for a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<MatchDto[]>} res the response containing the matches
 */
export const getMatchTeamByGithubUsername = async (
  req: Request<any, any, any, any>,
  res: Response<MatchDto[]>,
) => {
  const githubName: string = validateTeamName(req.params.githubName)
  const limit: number = validateLimit(req.query.limit)
  const offset: number = validateOffset(req.query.offset)
  const sortBy: string = validateSortBy(req.query.sortBy)
  const order: 'asc' | 'desc' = validateOrder(req.query.order)

  await checkUserIdPermissionsForTeamGithubName(
    ((req as any).decodedToken as DecodedIdToken).uid,
    githubName,
  )

  const matches: MatchDto[] = await getMatchesByTeamId(
    githubName,
    sortBy,
    limit,
    offset,
    order,
  )

  res.status(200).json(matches)
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
  const matchId: string = validateMatchId(req.params.matchId)

  await checkUserIdPermissionForMatch(
    ((req as any).decodedToken as DecodedIdToken).uid,
    matchId,
  )

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
  const matchId: string = validateMatchId(req.params.matchId)

  await checkUserIdPermissionForMatch(
    ((req as any).decodedToken as DecodedIdToken).uid,
    req.params.matchId,
  )

  res.status(501).json(undefined)
}
