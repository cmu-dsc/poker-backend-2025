import { TeamDto } from '@api/generated'
import { TeamDao } from '@prisma/client'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { dbClient } from 'src/server'
import { getUsersByAndrewIds } from './userService'

/**
 * Get a team from the database by teamId
 * @param {string} teamId the id of the team
 * @returns {TeamDao} the corresponding team
 * @throws {ApiError} if the team is not found
 */
export const getTeamById = async (teamId: string): Promise<TeamDao> => {
  const retrievedTeam: TeamDao | null = dbClient.teamDao.findUnique({
    where: {
      githubUsername: teamId,
    },
    include: {
      members: true,
    },
  }) as any as TeamDao | null

  if (!retrievedTeam) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Team not found')
  }

  return retrievedTeam
}

/**
 * Update a team in the database by teamId
 * @param {string} githubUsername the id of the team
 * @param {TeamDto} team the updated team
 * @returns {TeamDao} the updated team
 * @throws {ApiError} if the team is not found
 */
export const updateTeamByGithubUsername = async (
  githubUsername: string,
  team: TeamDto,
): Promise<TeamDao> => {
  if (team.githubUsername !== githubUsername) {
    throw new ApiError(
      ApiErrorCodes.BAD_REQUEST,
      'Cannot change the github username of a team',
    )
  }

  const updatedTeam = (await dbClient.teamDao.update({
    where: {
      githubUsername,
    },
    data: {
      members: {
        set: team.members.map(member => ({ andrewId: member })),
      },
    },
    include: {
      members: true
    },
  })) as any as TeamDao

  if (!updatedTeam) {
    throw new ApiError(ApiErrorCodes.NOT_FOUND, 'Team not found')
  }

  return updatedTeam
}

/**
 * Create a team in the database
 * @param {TeamDto} team the team to create
 * @returns {TeamDao} the created team
 * @throws {ApiError} if the team already exists
 */
export const createTeam = async (team: TeamDto): Promise<TeamDao> => {
  const retrievedTeam: TeamDao | null = dbClient.teamDao.findUnique({
    where: {
      githubUsername: team.githubUsername,
    },
  }) as any as TeamDao | null

  if (retrievedTeam) {
    throw new ApiError(
      ApiErrorCodes.BUSINESS_LOGIC_ERROR,
      'Team already exists',
    )
  }

  const users = await getUsersByAndrewIds(team.members)
  const membersToAdd = users.filter(user => !user.teamDaoGithubUsername)

  const createdTeam: TeamDao = (await dbClient.teamDao.create({
    data: {
      githubUsername: team.githubUsername,
      members: {
        create: membersToAdd.map(member => ({ andrewId: member.andrewId })),
      }
    },
    include: {
      members: true,
    },
  })) as any as TeamDao

  return createdTeam
}

/**
 * Delete a team from the database by teamId
 * @param {string} githubUsername the id of the team
 */
export const deleteTeam = async (githubUsername: string): Promise<void> => {
  await dbClient.teamDao.delete({
    where: {
      githubUsername,
    }
  })
}
