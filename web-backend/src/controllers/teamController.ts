import { TeamDto } from '@api/generated'
import { Request, Response } from 'express'
import { checkUserIdPermissionsForTeamId } from 'src/services/permissions/teamPermissionService'
import {
  createTeam,
  deleteTeam,
  getAllTeamsInclMembersAndBot,
  getTeamByIdInclMembersAndBot,
  updateTeamById,
} from 'src/services/teamService'
import {
  validateLastXGames,
  validateTeam,
} from 'src/services/validators/teamValidatorService'
import { BotDao, TeamDao, UserDao } from '@prisma/client'
import {
  convertTeamDaoToDto,
  convertTeamDaoWithStatsToDto,
} from 'src/services/converters/teamConverterService'
import { validateId } from 'src/services/validators/idValidatorService'

/**
 * Create a new team
 * @param {Request<any, any, TeamDto> & { userId?: number }} req the request containing the team to create
 * @param {Response<TeamDto>} res the response containing the created team
 */
export const postTeam = async (
  req: Request<any, any, TeamDto> & { userId?: number },
  res: Response<TeamDto>,
) => {
  const team: TeamDto = validateTeam(req.body)

  const createdTeam: TeamDao & {
    members: UserDao[]
    activeBot: BotDao
  } = await createTeam(team, req.userId!)
  const teamDto = convertTeamDaoToDto(createdTeam)

  // TODO: any post team creation

  res.status(201).json(teamDto)
}

/**
 * Get a team by the team id (github username)
 * @param {Request<any, any, any, any>} req the request containing the team id
 * @param {Response<TeamDto>} res the response containing the team
 */
export const getTeamByTeamId = async (
  req: Request<any, any, any, any>,
  res: Response<TeamDto>,
) => {
  const teamId: number = validateId(req.params.teamId)

  const team: TeamDao & {
    members: UserDao[]
    activeBot: BotDao
  } = await getTeamByIdInclMembersAndBot(teamId)

  const teamDto = await convertTeamDaoWithStatsToDto(team)

  res.status(200).json(teamDto)
}

/**
 * Update a team by the team id (github username)
 * @param {Request<any, any, TeamDto> & { userId?: number }} req the request containing the team to update
 * @param {Response<TeamDto>} res the response containing the updated team
 */
export const putTeamByTeamId = async (
  req: Request<any, any, TeamDto> & { userId?: number },
  res: Response<TeamDto>,
) => {
  const teamId: number = validateId(req.params.teamId)
  const team: TeamDto = validateTeam(req.body)

  team.teamId = teamId
  await checkUserIdPermissionsForTeamId(req.userId!, teamId)

  const updatedTeamDao: TeamDao & {
    members: UserDao[]
    activeBot: BotDao
  } = await updateTeamById(teamId, team)
  const updatedTeam = convertTeamDaoToDto(updatedTeamDao)

  res.status(200).json(updatedTeam)
}

/**
 * (Soft) Delete a team by the team id (github username)
 * @param {Request<any, any, TeamDto> & { userId?: number }} req the request containing the team id
 * @param {Response<any>} res the response
 */
export const deleteTeamByTeamId = async (
  req: Request<any, any, any, any> & { userId?: number },
  res: Response<any>,
) => {
  const teamId: number = validateId(req.params.teamId)

  await checkUserIdPermissionsForTeamId(req.userId!, teamId)

  await deleteTeam(teamId)

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

  const teams = await getAllTeamsInclMembersAndBot()
  const teamsDto = await Promise.all(
    teams.map(t => convertTeamDaoWithStatsToDto(t, lastXGames)),
  )

  res.status(200).json(teamsDto)
}
