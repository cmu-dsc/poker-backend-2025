import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { UserDao } from '@prisma/client'
import { getUserByIdInclTeam } from '../userService'

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
  const user: UserDao = await getUserByIdInclTeam(userId)

  if (user.teamId === teamId) {
    return true
  }
  throw new ApiError(
    ApiErrorCodes.FORBIDDEN,
    'User does not have permission to access this team',
  )
}
