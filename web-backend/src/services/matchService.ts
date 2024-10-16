import { MatchDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import {
  BUCKET_NAME,
  getBotLogPathTeam,
  getEngineLogPath,
} from 'src/config/bucket'
import { MatchDao, TeamMatchDao } from '@prisma/client'
import { dbClient } from 'src/server'
import { convertMatchDaoWithTeamMatchesToDto } from './converters/matchConverterService'

/**
 * Retrieve a match from the database by matchId
 * @param {string} matchId the id of the match
 * @returns {Promise<MatchDao>} the corresponding match
 */
export const getMatchById = async (
  matchId: number,
): Promise<MatchDao & { teamMatches: TeamMatchDao[] }> => {
  const match: (MatchDao & { teamMatches: TeamMatchDao[] }) | null =
    await dbClient.matchDao.findUnique({
      where: {
        matchId,
      },
      include: {
        teamMatches: true,
      },
    })

  if (!match) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Match not found')
  }

  return match
}

/**
 * Retrieve all matches from the database by TeamId
 * @param {number} teamId the id of the team
 * @returns {Promise<MatchDto[]>} all matches
 */
export const getMatchesByTeamId = async (
  teamId: number,
): Promise<MatchDto[]> => {
  const matches = await dbClient.matchDao.findMany({
    where: {
      teamMatches: {
        some: {
          teamId,
        },
      },
    },
    include: {
      teamMatches: {
        include: {
          team: true,
          bot: true,
        },
      },
    },
  })

  return matches.map(convertMatchDaoWithTeamMatchesToDto)
}

/**
 * Get the engine logs download link for a match by the match id
 * @param {number} matchId the id of the match
 * @returns {Promise<string>} the engine logs
 */
export const getEngineLogDownloadLinkCSV = async (
  matchId: number,
): Promise<string> => {
  const match: MatchDao = await getMatchById(matchId)

  try {
    return await getEngineLogPath(match, 'csv')
  } catch (e) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Engine log not found')
  }
}

/**
 * Get the engine logs download link for a match by the match id
 * @param {number} matchId the id of the match
 * @returns {Promise<string>} the engine logs
 */
export const getEngineLogDownloadLinkTXT = async (
  matchId: number,
): Promise<string> => {
  const match: MatchDao = await getMatchById(matchId)

  try {
    return await getEngineLogPath(match, 'txt') // TODO: get S3 key
  } catch (e) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Engine log not found')
  }
}

/**
 * Get the bot logs download link for a match by the match id
 * @param {string} matchId the id of the match
 * @param {string} teamGithubUsername the github username of the team
 * @returns {Promise<string>} the bot logs
 */
export const getBotLogDownloadLink = async (
  matchId: number,
  teamId: number,
): Promise<string> => {
  const match: MatchDao = await getMatchById(matchId)

  try {
    return await getBotLogPathTeam(match, teamId) // TODO: get S3 key
  } catch (e) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Bot log not found')
  }
}
