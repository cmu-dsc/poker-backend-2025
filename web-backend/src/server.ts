import * as http from 'http'
import { BigQuery } from '@google-cloud/bigquery'
import { Storage } from '@google-cloud/storage'
import logger from './middleware/logger/logger'
import env from './config/env'
import app from './app'

export const bigqueryClient = new BigQuery({
  credentials: JSON.parse(env.GCLOUD_ADMIN_KEY!),
  projectId: 'pokerai-417521',
})
export const storageClient = new Storage({
  credentials: JSON.parse(env.GCLOUD_ADMIN_KEY!),
  projectId: 'pokerai-417521',
})

const server = http.createServer(app)
server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}.`)
})
