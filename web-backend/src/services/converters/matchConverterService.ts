import { MatchDto } from '@api/generated'
import { MatchDao, TeamDao, TeamMatchDao } from '@prisma/client'
import { dbClient } from 'src/server'

/**
 * Convert a match DAO to a match DTO
 * @param {MatchDao & { teamMatchDaos: TeamMatchDao[] }} matchDao the match DAO to convert
 * @returns {MatchDto} the match DTO
 */
export const convertMatchDaoWithTeamMatchDaosToDto = async (
  matchDao: MatchDao & { teamMatch: TeamMatchDao[] },
): Promise<MatchDto> => {
  if (
    matchDao.teamMatch === undefined ||
    matchDao.teamMatch.length !== 2
  ) {
    throw new Error('Invalid TeamMatchDaos in MatchDao')
  }
  const team1Id: number = matchDao.teamMatch[0].id
  const team2Id: number = matchDao.teamMatch[1].id

  const bot1Id: number = matchDao.teamMatch[0].botId
  const bot2Id: number = matchDao.teamMatch[1].botId

  const team1Dao: TeamDao | null = await dbClient.teamDao.findUnique({
    where: { id: team1Id },
  })
  const team2Dao: TeamDao | null = await dbClient.teamDao.findUnique({
    where: { id: team2Id },
  })

  const bot1Dao = await dbClient.botDao.findUnique({
    where: { id: bot1Id },
  })
  const bot2Dao = await dbClient.botDao.findUnique({
    where: { id: bot2Id },
  })

  if (!team1Dao || !team2Dao || !bot1Dao || !bot2Dao) {
    throw new Error('Invalid Team or Bot in MatchDao')
  }

  return {
    matchId: matchDao.matchId,
    timestamp: (matchDao.timestamp as Date).toISOString(),
    isCompleted: matchDao.isCompleted,
    isRequestedMatch: Boolean(matchDao.matchRequestId),
    teamMatches: [
      {
        teamId: team1Dao.id,
        teamName: team1Dao.name,
        botVersion: bot1Dao.version,
        bankroll: matchDao.teamMatch[0].bankroll,
      },
      {
        teamId: team2Dao.id,
        teamName: team2Dao.name,
        botVersion: bot2Dao.version,
        bankroll: matchDao.teamMatch[1].bankroll,
      },
    ]
  }
}
