import * as http from 'http'
import { logger } from './middleware/logger/logger'
import env from './config/env'
import app from './app'
import { BigQuery } from '@google-cloud/bigquery'
import { Storage } from '@google-cloud/storage'

export const bigqueryClient = new BigQuery({keyFile: env.GCLOUD_ADMIN_KEY})
export const storageClient = new Storage({keyFile: env.GCLOUD_ADMIN_KEY});

const server = http.createServer(app)
server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}.`)
})
