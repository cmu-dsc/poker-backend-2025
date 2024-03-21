import { UserDto } from "@api/generated"

/**
 * Convert a row to a user dto
 * @param {any} row the row to convert
 * @returns {UserDto} the converted user
 */
export const convertRowToUserDto = (row: any): UserDto => {
  return {
    userId: row.userId,
    teamId: row.teamId,
    andrewId: row.andrewId,
  }
}
