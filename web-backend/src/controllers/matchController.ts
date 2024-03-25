import { MatchDto, UserDto } from '@api/generated'
import { Request, Response } from 'express'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import {
  getBotLog,
  getEngineLog,
  getMatchesByTeamId,
} from 'src/services/matchService'
import { checkAndrewIdPermissionsForMatch } from 'src/services/permissions/matchPermissionService'
import { checkUserIdPermissionsForTeamGithubName } from 'src/services/permissions/teamPermissionService'
import { getUserByAndrewId } from 'src/services/userService'
import { validateMatchId } from 'src/services/validators/matchValidatorService'
import { validateTeamName } from 'src/services/validators/teamValidatorService'

/**
 * Get all matches for a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<MatchDto[]>} res the response containing the matches
 */
export const getMatchTeamByGithubUsername = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<MatchDto[]>,
) => {
  const githubName: string = validateTeamName(req.params.githubUsername)

  await checkUserIdPermissionsForTeamGithubName(req.andrewId!, githubName)

  const matches: MatchDto[] = await getMatchesByTeamId(githubName)

  res.status(200).json(matches)
}

/**
 * Get the engine logs for a match by the match id
 * @param {Request<any, any, any, any>} req the request containing the match id
 * @param {Response<string>} res the response containing the engine logs
 */
export const getMatchByMatchIdLogsEngine = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<string>,
) => {
  const matchId: string = validateMatchId(req.params.matchId)

  await checkAndrewIdPermissionsForMatch(req.andrewId!, matchId)

  const logs: string = await getEngineLog(matchId)

  res.status(200).send(logs)
}

/**
 * Get the bot logs for a match by the match id
 * @param {Request<any, any, any, any>} req the request containing the match id
 * @param {Response<string>} res the response containing the bot logs
 */
export const getMatchByMatchIdLogsBot = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<string>,
) => {
  const matchId: string = validateMatchId(req.params.matchId)

  await checkAndrewIdPermissionsForMatch(req.andrewId!, req.params.matchId)

  const user: UserDto = await getUserByAndrewId(req.andrewId!)
  if (!user.teamId) {
    throw new ApiError(
      ApiErrorCodes.FORBIDDEN,
      'User does not have permission to access this match',
    )
  }
  const logs: string = await getBotLog(matchId, user.teamId)

  res.status(200).send(logs)
}
