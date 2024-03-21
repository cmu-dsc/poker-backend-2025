import { UserDto } from '@api/generated'
import { Request, Response } from 'express'

/**
 * Get ones own user by auth token
 * @param {Request<any, any, any, any>} req the request containing the user
 * @param {Response<UserDto>} res the response containing the user
 */
export const getUserMe = async (
  req: Request<any, any, any, any>,
  res: Response<UserDto>,
) => {
  res.status(501).json(undefined)
}

/**
 * Leave the current team
 * @param {Request<any, any, any, any>} req the request containing the user
 * @param {Response<>} res the response indicating success
 */
export const postUserTeamLeave = async (
  req: Request<any, any, any, any>,
  res: Response<any>,
) => {
  res.status(501).json(undefined)
}
