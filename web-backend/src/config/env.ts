import { load } from 'ts-dotenv'

/**
 * Environment variables
 */
export default load({
  PORT: String,
  DB_READER_ENDPOINT: String
})
