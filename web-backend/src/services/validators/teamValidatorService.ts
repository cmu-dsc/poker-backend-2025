import { TeamDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'

/**
 * A validator for the team dto
 */
const teamValidator = z.object({
  githubUsername: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9-]+$/),
  members: z.array(z.string()).max(4).min(1),
  elo: z.number().int().min(0),
})

/**
 * A validator for team names
 */
const teamNameValidator = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z0-9-]+$/)

/**
 * Validate a team
 * @param {TeamDto} team a team to validate
 * @returns {TeamDto} the validated team
 */
export const validateTeam = (team: TeamDto): TeamDto => {
  try {
    return teamValidator.parse(team)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}

/**
 * Validate a team name
 * @param {string} teamName the team name to validate
 * @returns {string} the validated team name
 */
export const validateTeamName = (teamName: string): string => {
  try {
    return teamNameValidator.parse(teamName)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
