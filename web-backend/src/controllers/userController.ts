import { UserDto } from '@api/generated'
import { UserDao } from '@prisma/client'
import { Request, Response } from 'express'
import { convertUserDaoToDto } from 'src/services/converters/userConverterService'
import { getUserById, leaveTeam } from 'src/services/userService'

/**
 * Get ones own user by auth token
 * @param {Request<any, any, any, any>} req the request containing the user
 * @param {Response<UserDto>} res the response containing the user
 */
export const getUserMe = async (
  req: Request<any, any, any, any> & { id?: number },
  res: Response<UserDto>,
) => {
  const user: UserDao = await getUserById(req.id!)
  const userDto: UserDto = await convertUserDaoToDto(user)

  res.status(200).json(userDto)
}

/**
 * Leave the current team
 * @param {Request<any, any, any, any> & { email: string}} req the request containing the user
 * @param {Response<>} res the response indicating success
 */
export const postUserTeamLeave = async (
  req: Request<any, any, any, any> & { id?: number },
  res: Response<any>,
) => {
  leaveTeam(req.id!)

  res.status(204).send()
}
