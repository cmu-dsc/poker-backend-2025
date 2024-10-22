import { HelloWorldResponseDto } from '@api/generated'
import cors from 'cors'
import express, { Request, Response } from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import cognitoAuthMiddleware from './middleware/auth/cognitoAuth'
import errorHandler from './middleware/errorhandler/errorhandler'
import { requestLogger } from './middleware/logger/httplogger'
import matchRouter from './routes/matchRouter'
import teamRouter from './routes/teamRouter'
import userRouter from './routes/userRouter'

const app = express()

const swaggerDocument = YAML.load('./api/src/api.yaml')
app.use('/api-spec', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors())

app.use(requestLogger)

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ msg: 'Hello World!' } as HelloWorldResponseDto)
})

app.use('/', cognitoAuthMiddleware);

app.use('/user', [userRouter()])

app.use('/team', [teamRouter()])

app.use('/match', [matchRouter()])

app.use(errorHandler)

export default app
