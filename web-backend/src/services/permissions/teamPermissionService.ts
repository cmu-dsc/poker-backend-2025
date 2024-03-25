import { TeamDto, UserDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { getUserByAndrewId } from '../userService'
import { TeamDao } from '@prisma/client'

export const checkUserIdPermissionsForTeamGithubName = async (
  userId: string,
  githubName: string,
): Promise<boolean> => {
  const user: UserDto = await getUserByAndrewId(userId)
  if (user.teamId === githubName) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this team',
  )
}

export const checkAndrewIdPartOfTeam = async (
  andrewId: string,
  team: TeamDao & { members?: string[] },
): Promise<boolean> => {
  const user: UserDto = await getUserByAndrewId(andrewId)
  if (user.andrewId && team.members?.includes(user.andrewId)) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User has to be part of the team to perform this action',
  )
}
