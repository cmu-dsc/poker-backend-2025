import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { dbClient } from 'src/server'
import { UserDao } from '@prisma/client'

/**
 * Get a user from the database by ID
 * @param {number} id the ID of the user
 * @returns {UserDto} the corresponding user
 */
export const getUserById = async (id: number): Promise<UserDao> => {
  let retrievedUser: UserDao | null = (await dbClient.userDao.findUnique({
    where: {
      id,
    },
  })) as any as UserDao | null

  if (!retrievedUser) {
    throw new ApiError(
      ApiErrorCodes.NOT_FOUND,
      `User with ID ${id} not found`,
    )
  }
  return retrievedUser
}

/**
 * Get users from the database by IDs
 * @param ids the IDs of the users
 * @returns the corresponding users
 */
export const getUsersByIds = async (
  ids: number[],
): Promise<UserDao[]> => {
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
  const teamId = (await getUserById(id)).teamId
  try {
    await dbClient.userDao.update({
      where: {
        id,
      },
      data: {
        teamId: null,
      },
    })

    if (teamId) {
      await dbClient.teamDao.deleteMany({
        where: {
          id: teamId,
          members: {
            none: {},
          },
        },
      })
    }
  } catch {
    throw new ApiError(
      ApiErrorCodes.BUSINESS_LOGIC_ERROR,
      'Failed to leave team',
    )
  }

  return true
}
