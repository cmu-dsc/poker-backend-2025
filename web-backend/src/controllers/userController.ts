import { UserDto } from '@api/generated'
import { TeamDao, UserDao } from '@prisma/client'
import { Request, Response } from 'express'
import { convertUserDaoToDto } from 'src/services/converters/userConverterService'
import { getUserByIdInclTeam, leaveTeam } from 'src/services/userService'

/**
 * Get ones own user by auth token
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the user in the header
 * @param {Response<UserDto>} res the response containing the user
 */
export const getUserMe = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<UserDto>,
) => {
  const user: UserDao & { team: TeamDao | null } = await getUserByIdInclTeam(
    req.userId!,
  )
  const userDto: UserDto = await convertUserDaoToDto(user)

  res.status(200).json(userDto)
}

/**
 * Leave the current team
 * @param {Request<any, any, any, any> & { userId?: number }} req the request containing the user in the header
 * @param {Response<any>} res the response indicating success
 */
export const postUserTeamLeave = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<any>,
) => {
  leaveTeam(req.userId!)

  res.status(204).send()
}
