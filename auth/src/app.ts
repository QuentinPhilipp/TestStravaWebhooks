import express from 'express'
import dotenv from 'dotenv'
import firestore from './db'
import logger from './logger'
import axios from 'axios'

const app = express()
dotenv.config({ path: '../.env' })
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))


async function isAthleteRegistered(athleteId: string): Promise<boolean> {
  const athlete = await firestore.collection("athletes").doc(athleteId).get();
  if (!athlete.exists) {
    return false
  } else {
    return true
  }
}

async function storeUser(userData): Promise<boolean> {
  return firestore.collection("athletes").doc(userData.athlete.id.toString()).set(userData)
    .then(() => { return true })
    .catch(error => {
      logger.error(error)
      return false
    })
}

app.get('/login', function(req, res, next) {
  let url = "https://www.strava.com/oauth/authorize?client_id=";
  url += process.env.CLIENT_ID;
  url += "&response_type=code&redirect_uri=";
  url += process.env.AUTH_URL;
  url += "&approval_prompt=force&scope="
  url += process.env.AUTH_SCOPE
  res.redirect(url);
});

app.get('/exchange_token', async (req, res) => {
  const scope = req.query.scope.toString()
  if (scope.includes(process.env.AUTH_SCOPE)) {
      axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${req.query.code}&grant_type=authorization_code`)
      .then(async function (response) {
          // If user already exit, skip
          // Else create the account
          if (await isAthleteRegistered(response.data.athlete.id.toString())) {
              res.sendStatus(200);
          }
          else {
              if (await storeUser(response.data)) {
                  res.sendStatus(200);
              }
              else {
                  res.sendStatus(500);
              }
          }
       }) 
       .catch(error => {
           logger.error('Error when registering user\n', error);
           res.status(500).send(error);
          })

  }
  else
  {
      res.sendStatus(500);
  }
});

app.listen(port, () => {
  const CLIENT_ID = process.env.CLIENT_ID;
  console.log(`Express is listening at http://localhost:${port} Strava APP: ${CLIENT_ID}`)
})

