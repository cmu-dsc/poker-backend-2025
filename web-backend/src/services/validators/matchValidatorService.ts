import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'

/**
 * A validator for match IDs
 */
const matchIdValidator = z.string().uuid()

/**
 * Validate a match ID
 * @param {string} matchId a match ID to validate
 * @returns {string} the validated match ID
 */
export const validateMatchId = (matchId: string): string => {
  try {
    return matchIdValidator.parse(matchId)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
