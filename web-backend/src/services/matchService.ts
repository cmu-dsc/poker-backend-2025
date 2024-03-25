import { MatchDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import {
  BUCKET_NAME,
  getBotLogPathTeam,
  getEngineLogPath,
} from 'src/config/bucket'
import { MatchDao } from '@prisma/client'
import { dbClient, storageClient } from 'src/server'
import { convertMatchDaoWithTeamMatchDaosToDto } from './converters/matchConverterService'

/**
 * Retrieve a match from the database by matchId
 * @param {string} matchId the id of the match
 * @returns {Promise<MatchDao>} the corresponding match
 */
export const getMatchById = async (matchId: string): Promise<MatchDao> => {
  const match: MatchDao | null = await dbClient.matchDao.findUnique({
    where: {
      matchId,
    },
    include: {
      teamMatchDaos: true,
    },
  })

  if (!match) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Match not found')
  }

  return match
}

/**
 * Retrieve all matches from the database by TeamId
 * @param {string} teamId the id of the team
 * @returns {Promise<MatchDto[]>} all matches
 */
export const getMatchesByTeamId = async (
  githubUsername: string,
): Promise<MatchDto[]> => {
  const matches: MatchDao[] = await dbClient.matchDao.findMany({
    where: {
      teamMatchDaos: {
        some: {
          teamId: githubUsername,
        },
      },
    },
    include: {
      teamMatchDaos: true,
    },
  })

  return matches.map(convertMatchDaoWithTeamMatchDaosToDto)
}

/**
 * Get the engine logs for a match by the match id
 * @param {string} matchId the id of the match
 * @returns {Promise<string>} the engine logs
 */
export const getEngineLog = async (matchId: string): Promise<string> => {
  const match: MatchDao = await getMatchById(matchId)

  try {
    const content: string = (
      await storageClient
        .bucket(BUCKET_NAME)
        .file(getEngineLogPath(match))
        .download()
    ).toString()
    return content
  } catch (e) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Engine log not found')
  }
}

/**
 * Get the bot logs for a match by the match id
 * @param {string} matchId the id of the match
 * @param {string} teamGithubUsername the github username of the team
 * @returns {Promise<string>} the bot logs
 */
export const getBotLog = async (
  matchId: string,
  teamGithubUsername: string,
): Promise<string> => {
  const match: MatchDao = await getMatchById(matchId)

  try {
    const content: string = (
      await storageClient
        .bucket(BUCKET_NAME)
        .file(getBotLogPathTeam(match, teamGithubUsername))
        .download()
    ).toString()

    return content
  } catch (e) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Bot log not found')
  }
}
