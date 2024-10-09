import { UserDto } from '@api/generated'
import { TeamDao, UserDao } from '@prisma/client'

const convertPermissionLevelDaoToDto = (permissionLevel: string): UserDto.permissionLevel => {
  if (permissionLevel.toUpperCase() === "ADMIN") {
    return UserDto.permissionLevel.ADMIN
  } else {
    return UserDto.permissionLevel.USER
  }
}

export const convertUserDaoToDto = (userDao: UserDao & {teamDao: TeamDao}): UserDto => {
  return {
    userId: userDao.id,
    email: userDao.email,
    permissionLevel: convertPermissionLevelDaoToDto(userDao.permissionLevel),
    teamId: userDao.teamDao.id,
    teamName: userDao.teamDao.name,
  }
}
