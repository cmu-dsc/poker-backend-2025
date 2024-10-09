import { BotDto } from "@api/generated"
import { BotDao } from "@prisma/client"

export const convertBotDaoToDto = (bot: BotDao): BotDto => {
  return {
    botId: bot.id,
    botVersion: bot.version,
    createdAt: bot.created.toISOString(),
  }
}