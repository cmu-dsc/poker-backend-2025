import { BotDto } from '@api/generated'
import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'

/**
 * A validator for the bot dto
 */
export const botValidator = z.object({
  botId: z.number().int().min(0),
  botVersion: z.number().int().min(1),
  createdAt: z.string().datetime(),
})

/**
 * Validate a bot
 * @param {BotDto} bot a team to validate
 * @returns {TeamDto} the validated team
 * @throws {ApiError} if the bot is invalid
 */
export const validateTeam = (bot: BotDto): BotDto => {
  try {
    return botValidator.parse(bot)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
