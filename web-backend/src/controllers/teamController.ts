import { TeamDto } from '@api/generated'
import { Request, Response } from 'express'
import createServiceAccountAndResources from 'src/services/serviceAccountService'
import checkAndrewIdPartOfTeamDto from 'src/services/permissions/teamPermissionService'
import {
  createTeam,
  updateToDeletedTeam,
  getAllTeams,
  getTeamById,
  updateTeamByGithubUsername,
} from 'src/services/teamService'
import {
  validateLastXGames,
  validateTeam,
  validateTeamId,
} from 'src/services/validators/teamValidatorService'
import { TeamDao } from '@prisma/client'
import {
  convertTeamDaoToDto,
  convertTeamDaoWithStatsToDto,
} from 'src/services/converters/teamConverterService'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'

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
  const teamId: number = team.id
  const teamName: string = team.teamName
  //team.teamName = team.teamName.toLowerCase()
  
  const createdTeam: TeamDao = await createTeam(team)
  const teamDto = convertTeamDaoToDto(createdTeam)

  try {
    await createServiceAccountAndResources(teamId, teamName)
  } catch (error) {
    console.error(
      'An error occurred while creating service account and resources:',
      error,
    )
  }

  res.status(201).json(teamDto)
}

/**
 * Get a team by the team id
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<TeamDto>} res the response containing the team
 */
export const getTeamByTeamId = async (
  req: Request<any, any, any, any>,
  res: Response<TeamDto>,
) => {
  const team: TeamDao = await getTeamById(req.params.id)

  const teamDto = await convertTeamDaoWithStatsToDto(team)

  res.status(200).json(teamDto)
}

/**
 * Update a team by the team id
 * @param {Request<any, any, TeamDto>} req the request containing the team to update
 * @param {Response<TeamDto>} res the response containing the updated team
 */
export const putTeamByTeamId = async (
  req: Request<any, any, TeamDto> & { teamId?: number },
  res: Response<TeamDto>,
) => {
  const teamId: number = validateTeamId(req.params.team.teamId)
  const team: TeamDto = validateTeam(req.body)

  req.params.id = team.id
  await checkAndrewIdPartOfTeamDto(req.params.andrewId!, team)

  const updatedTeamDao: TeamDao = await updateTeamByGithubUsername(
    teamId, 
    team,
  )
  const updatedTeam = convertTeamDaoToDto(updatedTeamDao)

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
  const teamToDelete: TeamDto = validateTeam(req.params.id)
  const githubid: number = teamToDelete.id

  const team = await getTeamById(githubid)
  // @ts-ignore
  if (!team.members.map(member => member.andrewId).includes(req.andrewId!)) {
    throw new ApiError(
      ApiErrorCodes.FORBIDDEN,
      'User does not have permission to delete this team',
    )
  }

  await updateToDeletedTeam(teamToDelete.id)

  res.status(204).send()
}

/**
 * Get all teams
 * @param {Request<any, any, any, any> & { andrewId?: string}} req the request
 * @param {Response<TeamDto[]>} res all teams with stats
 */
export const getTeam = async (
  req: Request<any, any, any, any> & { andrewId?: string },
  res: Response<TeamDto[]>,
) => {
  const lastXGames = validateLastXGames(req.query.lastGames)

  const teams = await getAllTeams()
  const teamsDto = await Promise.all(teams.map(t => convertTeamDaoWithStatsToDto(t, lastXGames)))

  res.status(200).json(teamsDto)
}
