import { TeamDto } from '@api/generated'
import { PrismaClient, TeamDao } from '@prisma/client'
import { dbClient } from 'src/server'

/**
 * Convert a team DAO to a team DTO
 * @param teamDao
 * @returns the team DTO
 */
export const convertTeamDaoToDto = (
  teamDao: TeamDao & { members?: { andrewId: string }[] },
): TeamDto => {
  return {
    id: teamDao.id,
    teamName: teamDao.teamName,
    members: teamDao.members
      ? teamDao.members.map((member: any) => member.andrewId)
      : [],
    deleted: teamDao.deleted
  }
}

/**
 * Return the team with the given github username including the number of wins and losses
 * @param teamDao the team Dao to convert
 * @returns the team DTO
 */
export const convertTeamDaoWithStatsToDto = async (
  teamDao: TeamDao & { members?: { andrewId: string }[] },
  lastXGames: undefined | number = undefined,
): Promise<TeamDto> => {
  let teamMatches = await dbClient.teamMatchDao.findMany({
    where: {
      teamId: teamDao.id,
    },
    include: {
      match: {
        select: {
          teamMatchDaos: true,
          timestamp: true,
        },
      },
    },
  })

  if (lastXGames) {
    teamMatches = teamMatches.slice(lastXGames * -1)
  }

  const wonMatches = teamMatches.filter(teamMatch => {
    const { teamMatchDaos } = teamMatch.match
    if (
      teamMatchDaos.length !== 2 &&
      !teamMatchDaos.map(tmd => tmd.teamId).includes(teamDao.id)
    ) {
      return false
    }
    return teamMatchDaos[0].teamId === teamDao.id
      ? teamMatchDaos[0].bankroll > teamMatchDaos[1].bankroll
      : teamMatchDaos[1].bankroll > teamMatchDaos[0].bankroll
  }).length

  const lostMatches = teamMatches.filter(teamMatch => {
    const { teamMatchDaos } = teamMatch.match
    if (
      teamMatchDaos.length !== 2 &&
      !teamMatchDaos.map(tmd => tmd.teamId).includes(teamDao.id)
    ) {
      return false
    }
    return teamMatchDaos[0].teamId === teamDao.id
      ? teamMatchDaos[0].bankroll < teamMatchDaos[1].bankroll
      : teamMatchDaos[1].bankroll < teamMatchDaos[0].bankroll
  }).length

  return {
    id: teamDao.id,
    teamName: teamDao.teamName,
    members: teamDao.members
      ? teamDao.members.map((member: any) => member.andrewId)
      : [],
    wins: wonMatches,
    losses: lostMatches,
    deleted: teamDao.deleted
  }
}
