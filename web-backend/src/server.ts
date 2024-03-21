import * as http from 'http'
import { logger } from './middleware/logger/logger'
import env from './config/env'
import app from './app'

const server = http.createServer(app)
server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}.`)
})
