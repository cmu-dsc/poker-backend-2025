import { load } from 'ts-dotenv'

/**
 * Environment variables
 */
export default load({
  PORT: String,
  DB_READER_ENDPOINT: String,
  COGNITO_USER_POOL_ID: String,
  COGNITO_APP_CLIENT_ID: String,
  GOOGLE_CLIENT_ID: String
})
