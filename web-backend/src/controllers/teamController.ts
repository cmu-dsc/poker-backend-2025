import { TeamDto } from '@api/generated'
import { Request, Response } from 'express'
import { checkAndrewIdPartOfTeam } from 'src/services/permissions/teamPermissionService'
import {
  createTeam,
  deleteTeam,
  getTeamById,
  updateTeamByGithubUsername,
} from 'src/services/teamService'
import {
  validateTeam,
  validateTeamName,
} from 'src/services/validators/teamValidatorService'

/**
 * Create a new team
 * @param {Request<any, any, TeamDto>} req the request containing the team to create
 * @param {Response<TeamDto>} res the response containing the created team
 */
export const postTeam = async (
  req: Request<any, any, TeamDto> & { andrewId?: string },
  res: Response<TeamDto>,
) => {
  const team: TeamDto = validateTeam(req.body)

  await checkAndrewIdPartOfTeam(req.andrewId!, team)

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
  const githubName: string = validateTeamName(req.params.githubUsername)

  const team: TeamDto = await getTeamById(githubName)

  res.status(200).json(team)
}

/**
 * Update a team by the team id (github username)
 * @param {Request<any, any, TeamDto>} req the request containing the team to update
 * @param {Response<TeamDto>} res the response containing the updated team
 */
export const putTeamByGithubUsername = async (
  req: Request<any, any, TeamDto> & { andrewId?: string },
  res: Response<TeamDto>,
) => {
  const githubName: string = validateTeamName(req.params.githubUsername)
  const team: TeamDto = validateTeam(req.body)

  team.githubUsername = githubName
  await checkAndrewIdPartOfTeam(req.andrewId!, team)

  const updatedTeam: TeamDto = await updateTeamByGithubUsername(
    githubName,
    team,
  )

  res.status(200).json(updatedTeam)
}

/**
 * Delete a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<any>} res the response
 */
export const deleteTeamByGithubUsername = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<any>,
) => {
  const githubName: string = validateTeamName(req.params.githubUsername)

  const team: TeamDto = await getTeamById(githubName)
  await checkAndrewIdPartOfTeam(req.andrewId!, team)

  await deleteTeam(githubName)

  res.status(204).send()
}
