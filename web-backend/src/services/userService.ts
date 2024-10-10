import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { dbClient } from 'src/server'
import { TeamDao, UserDao } from '@prisma/client'

/**
 * Get a user from the database by ID
 * @param {number} id the ID of the user
 * @throws {ApiError} if the user is not found
 * @returns {UserDao & { team: TeamDao | null }} the corresponding user
 */
export const getUserByIdInclTeam = async (
  id: number,
): Promise<UserDao & { team: TeamDao | null }> => {
  let retrievedUser: (UserDao & { team: TeamDao | null }) | null =
    await dbClient.userDao.findUnique({
      where: {
        id,
      },
      include: {
        team: true,
      },
    })

  if (!retrievedUser) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, `User with ID ${id} not found`)
  }
  return retrievedUser
}

/**
 * Get users from the database by IDs
 * @param ids the IDs of the users
 * @returns the corresponding users
 */
export const getUsersByIds = async (ids: number[]): Promise<UserDao[]> => {
  return dbClient.userDao.findMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
}

/**
 * Remove a user from a team
 * @param {number} id the ID of the user
 * @returns {Promise<boolean>}
 */
export const leaveTeam = async (id: number): Promise<boolean> => {
  // TODO delete team if it is empty
  await dbClient.userDao.update({
    where: { id },
    data: { teamId: null },
  })
  return true
}
