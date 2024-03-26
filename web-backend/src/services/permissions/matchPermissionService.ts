import { UserDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { MatchDao } from '@prisma/client'
import { getUserByAndrewId } from '../userService'
import { getMatchById } from '../matchService'
import { convertMatchDaoWithTeamMatchDaosToDto } from '../converters/matchConverterService'

export const checkAndrewIdPermissionsForMatch = async (
  andrewId: string,
  matchId: string,
): Promise<boolean> => {
  const user: UserDto = await getUserByAndrewId(andrewId)
  const match: MatchDao = await getMatchById(matchId)

  const matchDto = convertMatchDaoWithTeamMatchDaosToDto(match)

  if (user.teamId === matchDto.team1Id || user.teamId === matchDto.team2Id) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this match',
  )
}
