import * as http from 'http'
import { PrismaClient } from '@prisma/client'
import { readReplicas } from '@prisma/extension-read-replicas'
import logger from './middleware/logger/logger'
import env from './config/env'
import app from './app'

export const dbClient: PrismaClient = new PrismaClient()
  .$extends(
    readReplicas({
      url: env.DB_READER_ENDPOINT,
    }),
  )

const server = http.createServer(app)
server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}.`)
})
