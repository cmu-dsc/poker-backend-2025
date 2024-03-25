import { TeamDto } from '@api/generated'
import { getUsersByTeamId } from '../userService'

/**
 * Convert a row to a team dto
 * @param {any} row the row to convert
 * @returns {TeamDto} the converted team
 */
const convertRowToTeamDto = async (row: any): Promise<TeamDto> => {
  const members: string[] = (await getUsersByTeamId(row.githubUsername))
    .map(user => user.andrewId)
    .filter(andrewId => andrewId) as string[]
  return {
    githubUsername: row.githubUsername,
    elo: row.elo,
    members,
  }
}

export default convertRowToTeamDto
