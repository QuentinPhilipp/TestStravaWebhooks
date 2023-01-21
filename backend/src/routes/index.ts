import express from 'express'
import { defaultRoute } from './defaultRoute'
import { webhookRoute } from './webhook'

export const routes = express.Router()

routes.use(defaultRoute)
routes.use('/webhook', webhookRoute)
