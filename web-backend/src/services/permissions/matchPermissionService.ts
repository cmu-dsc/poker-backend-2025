import { MatchDto, UserDto } from '@api/generated'
import { getUserById } from '../userService'
import { getMatchById } from '../matchService'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'

export const checkUserIdPermissionForMatch = async (
  userId: string,
  matchId: string,
): Promise<boolean> => {
  const user: UserDto = await getUserById(userId)
  const match: MatchDto = await getMatchById(matchId)

  if (user.teamId === match.team1Id || user.teamId === match.team2Id) {
    return true
  } else {
    throw new ApiError(
      ApiErrorCodes.FORBIDDEN,
      'User does not have permission to access this match',
    )
  }
}
