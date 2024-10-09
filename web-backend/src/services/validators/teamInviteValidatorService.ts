import { TeamInviteDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'
import { teamNameValidator } from './teamValidatorService'
import { idValidator } from './idValidatorService'

/**
 * Validates the team invite dto
 */
const teamInviteValidator = z.object({
  teamInviteId: idValidator,
  teamId: idValidator,
  teamName: teamNameValidator.optional(),
  inviteeId: idValidator,
  inviteeEmail: z.string().optional(),
  sendAt: z.string().datetime(),
})

/**
 * Validates a team invite
 * @param {TeamInviteDto} teamInvite the team invite to validate
 * @returns {TeamInviteDto} the validated team invite
 * @throws {ApiError} if the team invite is invalid
 */
export const validateTeamInvite = (
  teamInvite: TeamInviteDto,
): TeamInviteDto => {
  try {
    return teamInviteValidator.parse(teamInvite)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
