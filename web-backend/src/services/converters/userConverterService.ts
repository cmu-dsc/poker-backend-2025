import { UserDto } from '@api/generated'
import { TeamDao, UserDao } from '@prisma/client'

/**
 * Convert a permission level DAO to a permission level DTO
 * @param {string} permissionLevel the permission level to convert
 * @returns {UserDto.permissionLevel} the permission level DTO
 */
const convertPermissionLevelDaoToDto = (
  permissionLevel: string,
): UserDto.permissionLevel => {
  if (permissionLevel.toUpperCase() === 'ADMIN') {
    return UserDto.permissionLevel.ADMIN
  } else {
    return UserDto.permissionLevel.USER
  }
}

/**
 * Convert a user DAO to a user DTO
 * @param {UserDao & { team: TeamDao | null | undefined }} userDao the user DAO to convert
 * @returns {UserDto} the user DTO
 */
export const convertUserDaoToDto = (
  userDao: UserDao & { team: TeamDao | null | undefined },
): UserDto => {
  return {
    userId: userDao.id,
    email: userDao.email,
    permissionLevel: convertPermissionLevelDaoToDto(userDao.permissionLevel),
    teamId: userDao.team?.id || undefined,
    teamName: userDao.team?.name || undefined,
  }
}
