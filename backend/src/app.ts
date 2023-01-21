import express from 'express'
import dotenv from 'dotenv'
import { routes } from './routes'


const app = express()
dotenv.config()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))




app.use('/', routes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Express is listening at http://localhost:${port}`)
})

