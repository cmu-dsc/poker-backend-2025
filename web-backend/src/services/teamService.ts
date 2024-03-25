import { TeamDto } from '@api/generated'
import { Query, SimpleQueryRowsResponse } from '@google-cloud/bigquery'
import { DATASET_ID, TEAM_TABLE, USER_TABLE } from 'src/config/db'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { bigqueryClient } from 'src/server'
import convertRowToTeamDto from './converters/teamConverterService'
import { updateUserTeamId } from './userService'

const GET_BY_TEAM_ID_QUERY = `SELECT * FROM \`${DATASET_ID}.${TEAM_TABLE}\` WHERE githubUsername = @githubUsername LIMIT 1`
const CREATE_TEAM_QUERY = `INSERT INTO \`${DATASET_ID}.${TEAM_TABLE}\` (githubUsername, elo) VALUES (@githubUsername, 100)`
const SET_TEAM_TO_NULL_FOR_GITHUB_USERNAME = `UPDATE \`${DATASET_ID}.${USER_TABLE}\` SET teamId = NULL WHERE teamId = @githubUsername`
const DELETE_TEAM_QUERY = `DELETE FROM \`${DATASET_ID}.${TEAM_TABLE}\` WHERE githubUsername = @githubUsername`

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
    params: { githubUsername: teamId },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  const teamRow = queryResult[0][0]
  if (!teamRow) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Team not found')
  }
  return convertRowToTeamDto(teamRow)
}

/**
 * Remove all users from a team
 * @param {string} teamId the id of the team
 * @returns {Promise<void>}
 */
const nullAllUsersTeamId = async (teamId: string): Promise<void> => {
  const query: Query = {
    query: SET_TEAM_TO_NULL_FOR_GITHUB_USERNAME,
    location: 'US',
    params: { githubUsername: teamId },
  }
  await bigqueryClient.query(query)
}

/**
 * Update a team in the database by teamId
 * @param {string} teamId the id of the team
 * @param {TeamDto} team the updated team
 * @returns {TeamDto} the updated team
 * @throws {ApiError} if the team is not found
 */
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

  // remove all users
  await nullAllUsersTeamId(githubUsername)

  // and add all those that are in the request (hacky)
  await Promise.all(
    team.members
      .map(async member => {
        return updateUserTeamId(member, team.githubUsername)
      })
      .filter(member => member),
  )

  return getTeamById(team.githubUsername)
}

/**
 * Create a team in the database
 * @param {TeamDto} team the team to create
 * @returns {TeamDto} the created team
 * @throws {ApiError} if the team already exists
 */
export const createTeam = async (team: TeamDto): Promise<TeamDto> => {
  const existingTeam: Query = {
    query: GET_BY_TEAM_ID_QUERY,
    location: 'US',
    params: { githubUsername: team.githubUsername },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(
    existingTeam,
  )

  const teamRow = queryResult[0][0]
  if (teamRow) {
    throw new ApiError(
      ApiErrorCodes.BUSINESS_LOGIC_ERROR,
      'Team already exists',
    )
  }

  const query: Query = {
    query: CREATE_TEAM_QUERY,
    location: 'US',
    params: { githubUsername: team.githubUsername },
  }
  await bigqueryClient.query(query)

  await Promise.all(
    team.members
      .map(async member => {
        return updateUserTeamId(member, team.githubUsername)
      })
      .filter(member => member),
  )

  return getTeamById(team.githubUsername)
}

export const deleteTeam = async (githubUsername: string): Promise<void> => {
  await getTeamById(githubUsername)

  const queryUpdateUsers: Query = {
    query: SET_TEAM_TO_NULL_FOR_GITHUB_USERNAME,
    location: 'US',
    params: { githubUsername },
  }
  await bigqueryClient.query(queryUpdateUsers)

  const query: Query = {
    query: DELETE_TEAM_QUERY,
    location: 'US',
    params: { githubUsername },
  }
  await bigqueryClient.query(query)
}
