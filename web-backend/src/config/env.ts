import { load } from 'ts-dotenv'

/**
 * Environment variables
 */
export default load({
  PORT: {
    type: String,
    optional: false,
  },
  FIREBASE_ADMIN_KEY: {
    type: String,
    optional: false,
  },
})
