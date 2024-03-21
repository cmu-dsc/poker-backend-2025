import { TeamDto } from '@api/generated'
import { Request, Response } from 'express'

/**
 * Create a new team
 * @param {Request<any, any, TeamDto>} req the request containing the team to create
 * @param {Response<TeamDto>} res the response containing the created team
 */
export const postTeam = async (
  req: Request<any, any, TeamDto>,
  res: Response<TeamDto>,
) => {
  res.status(501).json(undefined)
}

/**
 * Get a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<TeamDto>} res the response containing the team
 */
export const getTeamByGithubUsername = async (
  req: Request<any, any, any, any>,
  res: Response<TeamDto>,
) => {
  res.status(501).json(undefined)
}

/**
 * Update a team by the team id (github username)
 * @param {Request<any, any, TeamDto>} req the request containing the team to update
 * @param {Response<TeamDto>} res the response containing the updated team
 */
export const putTeamByGithubUsername = async (
  req: Request<any, any, TeamDto>,
  res: Response<TeamDto>,
) => {
  res.status(501).json(undefined)
}

/**
 * Delete a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<any>} res the response
 */
export const deleteTeamByGithubUsername = async (
  req: Request<any, any, any, any>,
  res: Response<any>,
) => {
  res.status(501).json(undefined)
}
