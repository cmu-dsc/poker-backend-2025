import { UserDto } from '@api/generated'
import { UserDao } from '@prisma/client'

export const convertUserDaoToDto = async (userDao: UserDao): Promise<UserDto> => {
  return {
    teamId:
      userDao.teamId == null
        ? undefined
        : userDao.teamId,
    email: userDao.email,
    permissionLevel:
      userDao.permissionLevel == "Admin"
      ? UserDto.permissionLevel.ADMIN
      : UserDto.permissionLevel.USER,
  }
}
