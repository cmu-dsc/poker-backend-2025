import { ApiError, ApiErrorCodes } from 'src/middleware/errorhandler/APIError'
import { z } from 'zod'

/**
 * Validates any type of id
 */
export const idValidator = z.number().int().min(0)

/**
 * Validates the match request id
 * @param {number} id the id to validate
 * @returns {number} the validated id
 * @throws {ApiError} if the id is invalid
 */
export const validateId = (id: number): number => {
  try {
    return idValidator.parse(id)
  } catch (error) {
    throw new ApiError(ApiErrorCodes.BAD_REQUEST, String(error))
  }
}
