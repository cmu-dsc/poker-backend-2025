import { load } from 'ts-dotenv'

/**
 * Environment variables
 */
export default load({
  PORT: {
    type: String,
    optional: false,
  },
})
