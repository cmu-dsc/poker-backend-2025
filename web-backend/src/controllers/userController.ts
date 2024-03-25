import { UserDto } from '@api/generated'
import { Request, Response } from 'express'
import { getUserByAndrewId, leaveTeam } from 'src/services/userService'

/**
 * Get ones own user by auth token
 * @param {Request<any, any, any, any>} req the request containing the user
 * @param {Response<UserDto>} res the response containing the user
 */
export const getUserMe = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<UserDto>,
) => {
  const user: UserDto = await getUserByAndrewId(req.andrewId!)

  res.status(200).json(user)
}

/**
 * Leave the current team
 * @param {Request<any, any, any, any> & { andrewId: string}} req the request containing the user
 * @param {Response<>} res the response indicating success
 */
export const postUserTeamLeave = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<any>,
) => {
  leaveTeam(req.andrewId!)

  res.status(204).send()
}
