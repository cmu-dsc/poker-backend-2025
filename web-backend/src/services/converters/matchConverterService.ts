import { MatchDto } from "@api/generated"

export const convertRowToMatchDto = (row: any): MatchDto => {
  return {
    matchId: row.matchId,
    team1Id: row.team1,
    team2Id: row.team2,
    team1Score: row.team1Score,
    team2Score: row.team2Score,
    timestamp: new Date(row.date).toISOString(),
  }
}
