import { UserDto } from '@api/generated'

/**
 * Convert a row to a user dto
 * @param {any} row the row to convert
 * @returns {UserDto} the converted user
 */
const convertRowToUserDto = (row: any): UserDto => {
  return {
    teamId: row.teamId,
    andrewId: row.andrewId,
  }
}

export default convertRowToUserDto
