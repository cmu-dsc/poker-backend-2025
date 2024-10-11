import { MatchDto } from '@api/generated'
import { BotDao, MatchDao, TeamDao, TeamMatchDao } from '@prisma/client'

/**
 * Convert a match DAO to a match DTO
 * @param {MatchDao & { teamMatchDaos: TeamMatchDao[] }} matchDao the match DAO to convert
 * @returns {MatchDto} the match DTO
 */
export const convertMatchDaoWithTeamMatchesToDto = (
  matchDao: MatchDao & {
    teamMatches: (TeamMatchDao & { bot: BotDao; team: TeamDao })[]
  },
): MatchDto => {
  if (matchDao.teamMatches === undefined || matchDao.teamMatches.length !== 2) {
    throw new Error('Invalid TeamMatchDaos in MatchDao')
  }

  return {
    matchId: matchDao.matchId,
    timestamp: (matchDao.timestamp as Date).toISOString(),
    isCompleted: matchDao.isCompleted,
    isRequestedMatch: Boolean(matchDao.matchRequestId),
    teamMatches: matchDao.teamMatches.map(tm => ({
      teamId: tm.team.id,
      teamName: tm.team.name,
      botVersion: tm.bot.version,
      bankroll: tm.bankroll,
    })),
  }
}
