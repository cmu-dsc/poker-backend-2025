import { BotDto } from "@api/generated"
import { BotDao } from "@prisma/client"

/**
 * Convert a bot DAO to a bot DTO
 * @param {BotDao} bot the bot DAO to convert
 * @returns {BotDto} the bot DTO
 */
export const convertBotDaoToDto = (bot: BotDao): BotDto => {
  return {
    botId: bot.id,
    botVersion: bot.version,
    createdAt: bot.created.toISOString(),
  }
}