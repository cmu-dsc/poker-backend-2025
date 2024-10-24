import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { MatchDao, TeamMatchDao, UserDao } from '@prisma/client'
import { getUserByIdInclTeam } from '../userService'
import { getMatchById } from '../matchService'

/**
 * Check if the user has permission to access the match based on whether the user is in one of the teams
 * @param {number} userId the id of the user
 * @param {number} matchId the id of the match
 * @returns {Promise<boolean>} whether the user has permission to access the match
 */
export const checkUserIdPermissionForMatchId = async (
  userId: number,
  matchId: number,
): Promise<boolean> => {
  const user: UserDao = await getUserByIdInclTeam(userId)
  const match: MatchDao & {
    teamMatches: TeamMatchDao[]
  } = await getMatchById(matchId)

  if (
    user.teamId === match.teamMatches[0].teamId ||
    user.teamId === match.teamMatches[1].teamId
  ) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this match',
  )
}
