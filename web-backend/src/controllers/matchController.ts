import { DownloadLinkDto, MatchDto } from '@api/generated'
import { Request, Response } from 'express'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import {
  getBotLogDownloadLink,
  getEngineLogDownloadLinkCSV,
  getEngineLogDownloadLinkTXT,
  getMatchesByTeamId,
} from 'src/services/matchService'
import { checkUserIdPermissionForMatchId } from 'src/services/permissions/matchPermissionService'
import { UserDao } from '@prisma/client'
import { checkUserIdPermissionsForTeamId } from 'src/services/permissions/teamPermissionService'
import { validateId } from 'src/services/validators/idValidatorService'
import { getUserByIdInclTeam } from 'src/services/userService'

/**
 * Get all matches for a team by the team id
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the team id
 * @param {Response<MatchDto[]>} res the response containing the matches
 */
export const getMatchTeamByTeamId = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<MatchDto[]>,
) => {
  const teamId: number = validateId(req.params.teamId)

  await checkUserIdPermissionsForTeamId(req.userId!, teamId)

  const matches: MatchDto[] = await getMatchesByTeamId(teamId)

  res.status(200).json(matches)
}

/**
 * Get the engine CSV logs for a match by the match id
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the match id
 * @param {Response<DownloadLinkDto>} res the response containing the engine logs download link
 */
export const getMatchByMatchIdLogsEngineCSV = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<DownloadLinkDto>,
) => {
  const matchId: number = validateId(req.params.matchId)

  await checkUserIdPermissionForMatchId(req.userId!, matchId)

  const downloadUrlCSV: string = await getEngineLogDownloadLinkCSV(matchId)

  res
    .status(200)
    .json({ downloadUrl: downloadUrlCSV, filetype: 'csv' } as DownloadLinkDto)
}

/**
 * Get the engine TXT logs for a match by the match id
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the match id
 * @param {Response<DownloadLinkDto>} res the response containing the engine logs download link
 */
export const getMatchByMatchIdLogsEngineTXT = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<DownloadLinkDto>,
) => {
  const matchId: number = validateId(req.params.matchId)

  await checkUserIdPermissionForMatchId(req.userId!, matchId)

  const downloadUrlTXT: string = await getEngineLogDownloadLinkTXT(matchId)

  res
    .status(200)
    .json({ downloadUrl: downloadUrlTXT, filetype: 'txt' } as DownloadLinkDto)
}

/**
 * Get the bot logs for a match by the match id
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the match id
 * @param {Response<DownloadLinkDto>} res the response containing the bot logs download link
 */
export const getMatchByMatchIdLogsBot = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<DownloadLinkDto>,
) => {
  const matchId: number = validateId(req.params.matchId)

  await checkUserIdPermissionForMatchId(req.userId!, matchId)

  const user: UserDao = await getUserByIdInclTeam(req.userId!)
  if (!user.teamId) {
    throw new ApiError(
      ApiErrorCodes.FORBIDDEN,
      'User does not have permission to access this match',
    )
  }
  const downloadUrl: string = await getBotLogDownloadLink(matchId, user.teamId)

  res.status(200).json({ downloadUrl, filetype: 'txt' } as DownloadLinkDto)
}
