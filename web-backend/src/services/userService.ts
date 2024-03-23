import { UserDto } from '@api/generated'
import { Query, SimpleQueryRowsResponse } from '@google-cloud/bigquery'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { bigqueryClient } from 'src/server'
import { convertRowToUserDto } from './converters/userConverterService'
import { DATASET_ID, USER_TABLE } from 'src/config/db'

const GET_BY_ANDREWID_QUERY: string = `SELECT * FROM \`${DATASET_ID}.${USER_TABLE}\` WHERE andrewId = @andrewId LIMIT 1`
const GET_USER_BY_TEAM_ID_QUERY: string = `SELECT * FROM \`${DATASET_ID}.${USER_TABLE}\` WHERE teamId = @teamId`
const UPDATE_TEAM_BY_ANDREW_ID_QUERY: string = `UPDATE \`${DATASET_ID}.${USER_TABLE}\` SET teamId = @teamId WHERE andrewId = @andrewId`
const INSERT_USER_QUERY: string = `INSERT INTO \`${DATASET_ID}.${USER_TABLE}\` (andrewId) VALUES (@andrewId)`

/**
 * Get a user from the database by userId
 * @param {string} userId the id of the user
 * @param {boolean} force whether to overwrite potential errors
 * @returns {UserDto} the corresponding user
 */
export const getUserByAndrewId = async (andrewId: string, force = false): Promise<UserDto> => {
  const query: Query = {
    query: GET_BY_ANDREWID_QUERY,
    location: 'US',
    params: { andrewId },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  const userRow = queryResult[0][0]
  if (!userRow && !force) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'User not found')
  } if (!userRow && force) {
    const insertQuery: Query = {
      query: INSERT_USER_QUERY,
      location: 'US',
      params: { andrewId },
    }
    await bigqueryClient.query(insertQuery)
    return getUserByAndrewId(andrewId, false)
  }
  return convertRowToUserDto(userRow)
}

/**
 * Get all users of a team from the database by teamId
 * @param {string} teamId the id of the team
 * @returns {UserDto[]} the corresponding users
 */
export const getUsersByTeamId = async (teamId: string): Promise<UserDto[]> => {
  const query: Query = {
    query: GET_USER_BY_TEAM_ID_QUERY,
    location: 'US',
    params: { teamId },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  return queryResult[0].map(convertRowToUserDto)
}

/**
 * Update the teamId of a user in the database
 * @param {string} andrewId the andrew id of the user
 * @param {string} githubUsername the github username of the team
 * @returns {string} the andrew id of the user added to the team
 * @throws {ApiError} if the user is already in a team
 */
export const updateUserTeamId = async (
  andrewId: string,
  githubUsername: string,
): Promise<string | undefined> => {
  const user = await getUserByAndrewId(andrewId, true)
  if (user.teamId && user.teamId !== githubUsername) {
    return undefined
  }

  const query: Query = {
    query: UPDATE_TEAM_BY_ANDREW_ID_QUERY,
    location: 'US',
    params: { andrewId, teamId: githubUsername },
  }

  await bigqueryClient.query(query)

  return andrewId
}

export const leaveTeam = async (andrewId: string): Promise<boolean> => {
  const query: Query = {
    query: UPDATE_TEAM_BY_ANDREW_ID_QUERY,
    location: 'US',
    params: { andrewId, teamId: null },
  }

  await bigqueryClient.query(query)

  return true
}
