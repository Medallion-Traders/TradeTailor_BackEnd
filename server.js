import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import helmet from 'helmet'
import morgan from 'morgan'
import { userRouter } from './routes/users.js'
import stockdata from './routes/stockdata.js'
import verifyToken from './middleware/auth.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

/* Load environment variables from the correct .env file */
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env'
dotenv.config({ path: path.resolve(__dirname, envFile) })

/* CONFIGURATION */
app.use(express.json())
app.use(
  cors({
    origin: process.env.REACT_APP_URL,
  })
)
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }))
app.use(morgan('common'))
app.use(bodyParser.urlencoded({ extended: true }))

/* ROUTES */
app.use('/auth', userRouter)
app.use('/api', verifyToken, stockdata)

mongoose.connect(process.env.MONGODB_URI)
app.listen(process.env.PORT || 3001, () =>
  console.log(`SERVER STARTED ON ${process.env.REACT_APP_SERVER_URL}`)
)
