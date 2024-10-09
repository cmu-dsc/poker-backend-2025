import { UserDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { TeamDao, UserDao } from '@prisma/client'
import { getUserById } from '../userService'

/**
 * Check if the user has permission to access the team based on whether the user is in the team
 * @param {number} userId the id of the user
 * @param {number} teamId the id of the team
 * @throws {ApiError} if the user does not have permission to access the team
 * @returns {Promise<boolean>} whether the user has permission to access the team
 */
export const checkUserIdPermissionsForTeamId = async (
  userId: number,
  teamId: number,
): Promise<boolean> => {
  const user: UserDao = await getUserById(userId)

  if (user.teamId === teamId) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this team',
  )
}

/**
 * Check if the user has permission to access the team based on whether the user is in the team
 * @param {number} userId the id of the user
 * @param {TeamDao & { members: UserDao[] }} team the team to check incl members
 * @throws {ApiError} if the user is not part of the team
 * @returns {Promise<boolean>} whether the user has permission to access the team
 */
export const checkUserIdPartOfTeam = async (
  userId: number,
  team: TeamDao & { members: UserDao[] },
): Promise<boolean> => {
  const user: UserDao = await getUserById(userId)
  if (user.id && team.members.map(member => member.id)?.includes(user.id)) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User has to be part of the team to perform this action',
  )
}
