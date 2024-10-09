import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { MatchDao, TeamMatchDao, UserDao } from '@prisma/client'
import { getUserById } from '../userService'
import { getMatchById } from '../matchService'
import { convertMatchDaoWithTeamMatchDaosToDto } from '../converters/matchConverterService'

export const checkAndrewIdPermissionsForMatch = async (
  userId: number,
  matchId: number,
): Promise<boolean> => {
  const user: UserDao = await getUserById(userId)
  const match: MatchDao & {
    teamMatch: TeamMatchDao[]
  } = await getMatchById(matchId)

  const matchDto = await convertMatchDaoWithTeamMatchDaosToDto(match)

  if (
    user.teamId === matchDto.teamMatches[0].teamId ||
    user.teamId === matchDto.teamMatches[1].teamId
  ) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this match',
  )
}
