import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { dbClient } from 'src/server'
import { UserDao } from '@prisma/client'

/**
 * Get a user from the database by email; adds the user if it does not exist
 * @param {string} email the email of the user
 * @returns {UserDto} the corresponding user
 */
export const getUserByEmail = async (email: string): Promise<UserDao> => {
  let retrievedUser: UserDao | null = (await dbClient.userDao.findUnique({
    where: {
      email,
    },
  })) as any as UserDao | null

  if (!retrievedUser) {
    retrievedUser = (await dbClient.userDao.create({
      data: {
        email,
      },
    })) as any as UserDao
  }

  return retrievedUser
}

/**
 * Get users from the database by emails
 * @param emails the emails of the users
 * @returns the corresponding users
 */
export const getUsersByEmails = async (
  emails: string[],
): Promise<UserDao[]> => {
  return dbClient.userDao.findMany({
    where: {
      email: {
        in: emails,
      },
    },
  })
}

/**
 * Remove a user from a team
 * @param {string} email the email of the user
 * @returns {Promise<boolean>}
 */
export const leaveTeam = async (email: string): Promise<boolean> => {
  const teamId = (await getUserByEmail(email)).teamId
  try {
    await dbClient.userDao.update({
      where: {
        email,
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
