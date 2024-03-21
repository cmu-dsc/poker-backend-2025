import { MatchDto } from '@api/generated'
import { Query, SimpleQueryRowsResponse } from '@google-cloud/bigquery'
import { DATASET_ID, MATCH_TABLE } from 'src/config/db'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { bigqueryClient } from 'src/server'
import { convertRowToMatchDto } from './converters/matchConverterService'

const GET_BY_MATCH_ID_QUERY: string = `SELECT * FROM \`${DATASET_ID}.${MATCH_TABLE}\` WHERE matchId = @matchId LIMIT 1`
const GET_ALL_FILTERED_MATCH_QUERY: string = `SELECT * FROM \`${DATASET_ID}.${MATCH_TABLE}\` WHERE team1 = @teamId OR team2 = @teamId ORDER BY @sortby @order LIMIT @limit OFFSET @offset`

/**
 * Retrieve a match from the database by matchId
 * @param {string} matchId the id of the match
 * @returns {Promise<MatchDto>} the corresponding match
 */
export const getMatchById = async (matchId: string): Promise<MatchDto> => {
  const query: Query = {
    query: GET_BY_MATCH_ID_QUERY,
    location: 'US',
    params: { matchId },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  const matchRow = queryResult[0]
  if (!matchRow) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Match not found')
  }
  return convertRowToMatchDto(matchRow)
}

/**
 * Retrieve all matches from the database by TeamId
 * @param {string} teamId the id of the team
 * @param {string} sortBy the column to sort by @default timestamp
 * @param {number} limit the maximum number of matches to return
 * @param {number} offset the number of matches to skip
 * @param {"dec" | "asc"} order the order to sort by
 * @returns {Promise<MatchDto[]>} all matches
 */
export const getMatchesByTeamId = async (
  teamId: string,
  sortBy: string = 'timestamp',
  limit: number = 10,
  offset: number = 0,
  order: 'desc' | 'asc' = 'desc',
): Promise<MatchDto[]> => {
  const query: Query = {
    query: GET_ALL_FILTERED_MATCH_QUERY,
    location: 'US',
    params: { teamId, limit, offset, sortBy, order },
  }

  const queryResult: SimpleQueryRowsResponse = await bigqueryClient.query(query)

  return queryResult.map(convertRowToMatchDto)
}
