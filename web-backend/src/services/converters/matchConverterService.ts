import { MatchDto } from '@api/generated'

const convertRowToMatchDto = (row: any): MatchDto => {
  return {
    matchId: row.matchId,
    team1Id: row.team1Name,
    team2Id: row.team2Name,
    team1Score: row.team1Bankroll,
    team2Score: row.team2Bankroll,
    timestamp: row.timestamp.value,
  }
}

export default convertRowToMatchDto
