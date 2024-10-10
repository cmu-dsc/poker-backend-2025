import { Router } from 'express'
import {
  deleteTeamByTeamId,
  getTeam,
  getTeamByTeamId,
  postTeam,
  putTeamByTeamId,
} from 'src/controllers/teamController'
import asyncWrapper from 'src/middleware/errorhandler/asyncWrapper'

/**
 * The router for the team resource.
 */
const teamRouter = () => {
  const router = Router()

  router.post('/', asyncWrapper(postTeam))
  router.get('/', asyncWrapper(getTeam))
  router.get('/:teamId', asyncWrapper(getTeamByTeamId))
  router.put('/:teamId', asyncWrapper(putTeamByTeamId))
  router.delete('/:teamId', asyncWrapper(deleteTeamByTeamId))

  return router
}

export default teamRouter
