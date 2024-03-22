import { TeamDto } from '@api/generated'
import { Request, Response } from 'express'
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier'
import { checkUserIdPartOfTeam } from 'src/services/permissions/teamPermissionService'
import { createTeam } from 'src/services/teamService'
import { validateTeam } from 'src/services/validators/teamValidatorService'

/**
 * Create a new team
 * @param {Request<any, any, TeamDto>} req the request containing the team to create
 * @param {Response<TeamDto>} res the response containing the created team
 */
export const postTeam = async (
  req: Request<any, any, TeamDto>,
  res: Response<TeamDto>,
) => {
  const team: TeamDto = validateTeam(req.body)

  await checkUserIdPartOfTeam(
    ((req as any).decodedToken as DecodedIdToken).uid,
    team,
  )

  const createdTeam: TeamDto = await createTeam(team)

  res.status(201).json(createdTeam)
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
