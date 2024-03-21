import { TeamDto } from '@api/generated'
import { Query, SimpleQueryRowsResponse } from '@google-cloud/bigquery'
import { DATASET_ID, TEAM_TABLE } from 'src/config/db'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { bigqueryClient } from 'src/server'
import { convertRowToTeamDto } from './converters/teamConverterService'
import { get } from 'http'
import { updateUserTeamId } from './userService'

const GET_BY_TEAM_ID_QUERY = `SELECT * FROM \`${DATASET_ID}.${TEAM_TABLE}\` WHERE teamId = @teamId LIMIT 1`

/**
 * Get a team from the database by teamId
 * @param {string} teamId the id of the team
 * @returns {TeamDto} the corresponding team
 * @throws {ApiError} if the team is not found
 */
export const getTeamById = async (teamId: string): Promise<TeamDto> => {
  const query: Query = {
    query: GET_BY_TEAM_ID_QUERY,
    location: 'US',
    params: { teamId },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  const teamRow = queryResult[0]
  if (!teamRow) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Team not found')
  }
  return await convertRowToTeamDto(teamRow)
}

export const updateTeamByGithubUsername = async (
  githubUsername: string,
  team: TeamDto,
): Promise<TeamDto> => {
  if (team.githubUsername !== githubUsername) {
    throw new ApiError(
      ApiErrorCodes.BAD_REQUEST,
      'Cannot change the github username of a team',
    )
  }
  await Promise.all(
    team.members
      .map(async member => {
        return await updateUserTeamId(member, team.githubUsername)
      })
      .filter(member => member),
  )

  return getTeamById(team.githubUsername)
}
