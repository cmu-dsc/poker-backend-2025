import { TeamDto, UserDto } from '@api/generated'
import { getUserById } from '../userService'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'

export const checkUserIdPermissionsForTeamGithubName = async (
  userId: string,
  githubName: string,
): Promise<boolean> => {
  const user: UserDto = await getUserById(userId)
  if (user.teamId === githubName) {
    return true
  } else {
    throw new ApiError(
      ApiErrorCodes.FROBIDDEN,
      'User does not have permission to access this team',
    )
  }
}

export const checkUserIdPartOfTeam = async (
  userId: string,
  team: TeamDto,
): Promise<boolean> => {
  const user: UserDto = await getUserById(userId)
  if (user.teamId) {
    throw new ApiError(
      ApiErrorCodes.BUSINESS_LOGIC_ERROR,
      'User is already part of a team',
    )
  }
  if (user.andrewId && team.members.includes(user.andrewId)) {
    return true
  } else {
    throw new ApiError(
      ApiErrorCodes.BUSINESS_LOGIC_ERROR,
      'User has to be part of the team to perform this action',
    )
  }
}
