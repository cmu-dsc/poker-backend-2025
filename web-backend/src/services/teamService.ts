import { TeamDto } from '@api/generated'
import { BotDao, TeamDao, UserDao } from '@prisma/client'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { dbClient } from 'src/server'
import { getUsersByIds } from './userService'

/**
 * Get a team from the database by teamId
 * @param {number} teamId the id of the team
 * @returns {TeamDao & { members: UserDao[], activeBot: BotDao }} the corresponding team
 * @throws {ApiError} if the team is not found
 */
export const getTeamByIdInclMembersAndBot = async (
  teamId: number,
): Promise<TeamDao & { members: UserDao[]; activeBot: BotDao }> => {
  const retrievedTeam:
    | (TeamDao & { members: UserDao[]; activeBot: BotDao })
    | null = await dbClient.teamDao.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: true,
      activeBot: true,
    },
  })

  if (!retrievedTeam) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Team not found')
  }

  return retrievedTeam
}

/**
 * Get all teams from the database
 * @returns {TeamDao[]} all teams
 */
export const getAllTeamsInclMembersAndBot = async (
  force: boolean = false,
): Promise<(TeamDao & { members: UserDao[]; activeBot: BotDao })[]> => {
  return dbClient.teamDao.findMany({
    where: {
      isDeleted: false || force,
    },
    include: {
      members: true,
      activeBot: true,
    },
  })
}

/**
 * Update a team in the database by teamId
 * @param {number} teamId the id of the team
 * @param {TeamDto} team the updated team
 * @returns {TeamDao & { members: UserDao[]; activeBot: BotDao }} the updated team
 * @throws {ApiError} if the team or the bot is not found
 */
export const updateTeamById = async (
  teamId: number,
  team: TeamDto,
): Promise<TeamDao & { members: UserDao[]; activeBot: BotDao }> => {
  const teamMebers = await getUsersByIds(team.members)
  const activeBot = await dbClient.botDao.findUnique({
    where: { id: team.activeBot?.botId, teamId },
  })

  if (!activeBot) {
    throw new ApiError(
      ApiErrorCodes.NOT_FOUND,
      'Bot not found (does not exist or does not belong to the team)',
    )
  }

  const updatedTeam = await dbClient.teamDao.update({
    where: { id: teamId },
    data: {
      name: team.teamName,
      members: {
        connect: teamMebers,
      },
      activeBot: {
        connect: { id: activeBot.id },
      },
    },
    include: {
      members: true,
      activeBot: true,
    },
  })

  if (team.members.length === 0) {
    deleteTeam(teamId)
  }

  return updatedTeam
}

/**
 * Create a team in the database
 * @param {TeamDto} team the team to create
 * @returns {TeamDao} the created team
 * @throws {ApiError} if the team already exists
 */
export const createTeam = async (
  team: TeamDto,
  teamFounderId: number,
): Promise<TeamDao & { members: UserDao[]; activeBot: BotDao }> => {
  const teamFounder: UserDao | null = await dbClient.userDao.findUnique({
    where: { id: teamFounderId },
  })

  if (!teamFounder) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'User not found')
  }

  const fullyCreatedTeam = await dbClient.$transaction(async tx => {
    // Step 1: Create the team without any bots initially
    const createdTeam = await tx.teamDao.create({
      data: {
        id: 0,
        name: team.teamName,
        isDeleted: false,
        elo: 1000,
        members: {
          connect: teamFounder,
        },
        activeBotId: 0, // No active bot initially, will be fixed in step 3
      },
    })

    // Step 2: Create the activeBot and associate it with the team
    const createdActiveBot = await tx.botDao.create({
      data: {
        version: 0,
        storageLocation: 'some/location', // TODO change this
        created: new Date(),
        team: {
          connect: { id: createdTeam.id },
        },
      },
    })

    // Step 3: Update the team to set the activeBot and include it in the bots array
    const updatedTeam = await tx.teamDao.update({
      where: { id: createdTeam.id },
      data: {
        activeBotId: createdActiveBot.id,
        bots: {
          connect: { id: createdActiveBot.id },
        },
      },
      include: { members: true, activeBot: true },
    })

    return updatedTeam
  })

  return fullyCreatedTeam
}

/**
 * Soft delete a team by teamId
 * @param {number} teamId the id of the team
 */
export const deleteTeam = async (teamId: number): Promise<void> => {
  await dbClient.$transaction(async tx => {
    await tx.teamDao.update({
      where: { id: teamId },
      data: { isDeleted: true },
    })

    await tx.teamInviteDao.deleteMany({
      where: { teamId },
    })

    await tx.matchRequestDao.updateMany({
      where: { requestedTeamId: teamId },
      data: { isAccepted: false },
    })

    await tx.matchRequestDao.deleteMany({
      where: { requestingTeamId: teamId },
    })
  })
}
