import { MatchDto, UserDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { getUserByAndrewId } from '../userService'
import { getMatchById } from '../matchService'

const checkAndrewIdPermissionsForMatch = async (
  andrewId: string,
  matchId: string,
): Promise<boolean> => {
  const user: UserDto = await getUserByAndrewId(andrewId)
  const match: MatchDto = await getMatchById(matchId)

  if (user.teamId === match.team1Id || user.teamId === match.team2Id) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this match',
  )
}

export default checkAndrewIdPermissionsForMatch
