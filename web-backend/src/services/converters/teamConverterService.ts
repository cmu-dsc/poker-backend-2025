import { BotDto, TeamDto } from '@api/generated'
import { BotDao, PrismaClient, TeamDao, UserDao } from '@prisma/client'
import { dbClient } from 'src/server'
import { convertBotDaoToDto } from './botConverterService'

/**
 * Convert a team DAO to a team DTO
 * @param teamDao
 * @returns the team DTO
 */
export const convertTeamDaoToDto = (
  teamDao: TeamDao & { members: UserDao[]; activeBot: BotDao },
): TeamDto => {
  return {
    teamId: teamDao.id,
    teamName: teamDao.name,
    // TODO add bot converter
    activeBot: convertBotDaoToDto(teamDao.activeBot),
    members: teamDao.members
      ? teamDao.members.map((member: UserDao) => member.id)
      : [],
    isDeleted: teamDao.isDeleted,
    elo: teamDao.elo,
  }
}

/**
 * Return the team including the number of wins and losses
 * @param {TeamDao & { members: UserDao[], activeBot: BotDao }} teamDao the team Dao to convert
 * @returns {TeamDto} the team DTO
 */
export const convertTeamDaoWithStatsToDto = async (
  teamDao: TeamDao & { members: UserDao[]; activeBot: BotDao },
  lastXGames: undefined | number = undefined,
): Promise<TeamDto> => {
  let teamMatches = await dbClient.teamMatchDao.findMany({
    where: {
      teamId: teamDao.id,
    },
    include: {
      match: {
        select: {
          teamMatches: true,
          timestamp: true,
        },
      },
    },
  })

  if (lastXGames) {
    teamMatches = teamMatches.slice(lastXGames * -1)
  }

  const wonMatches = teamMatches.filter(teamMatchDao => {
    const { teamMatches } = teamMatchDao.match
    if (
      teamMatches.length !== 2 &&
      !teamMatches.map(tmd => tmd.teamId).includes(teamDao.id)
    ) {
      return false
    }
    return teamMatches[0].teamId === teamDao.id
      ? teamMatches[0].bankroll > teamMatches[1].bankroll
      : teamMatches[1].bankroll > teamMatches[0].bankroll
  }).length

  const lostMatches = teamMatches.filter(teamMatchDao => {
    const { teamMatches } = teamMatchDao.match
    if (
      teamMatches.length !== 2 &&
      !teamMatches.map(tmd => tmd.teamId).includes(teamDao.id)
    ) {
      return false
    }
    return teamMatches[0].teamId === teamDao.id
      ? teamMatches[0].bankroll < teamMatches[1].bankroll
      : teamMatches[1].bankroll < teamMatches[0].bankroll
  }).length

  return {
    ...convertTeamDaoToDto(teamDao),
    wins: wonMatches,
    losses: lostMatches,
  }
}
