import { MatchRequestDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'
import { idValidator } from './idValidatorService'

/**
 * Validates the match request dto
 */
const matchRequestValidator = z.object({
  matchRequestId: idValidator,
  requestingTeamId: idValidator,
  requestedTeamId: idValidator,
  requestedAt: z.string().datetime(),
  isAccepted: z.boolean(),
})

/**
 * Validates a match request
 * @param {MatchRequestDto} matchRequest the match request to validate
 * @returns {MatchRequestDto} the validated match request
 * @throws {ApiError} if the match request is invalid
 */
export const validateMatchRequest = (
  matchRequest: MatchRequestDto,
): MatchRequestDto => {
  try {
    return matchRequestValidator.parse(matchRequest)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
