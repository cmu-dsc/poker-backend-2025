import { MatchDto } from '@api/generated'

export const BUCKET_NAME = 'poker-ai-blobs'
export const MATCH_PREFIX = 'match_'
export const ENGINE_LOG = 'engine_log.csv'
export const BOT_LOG = 'debug_log.txt'

const getMatchId = (match: MatchDto): string => {
  return match.matchId
}

/**
 * Get the path to the engine log for a match
 * @param {MatchDto} match the match to get the engine log path for
 * @returns {string} the path to the engine log
 */
export const getEngineLogPath = (match: MatchDto): string => {
  return [MATCH_PREFIX + getMatchId(match), ENGINE_LOG].join('/')
}

/**
 * Get the path to the bot log for a match for a given team
 * @param {MatchDto} match the match to get the log log path for
 * @param {1 | 2} team the team to get the bot log path for
 * @returns {string} the path to the bot log of the given team
 */
export const getBotLogPathTeam = (match: MatchDto, team: 1 | 2): string => {
  return [
    MATCH_PREFIX + getMatchId(match),
    team === 1 ? match.team1Id : match.team2Id,
    BOT_LOG,
  ].join('/')
}
