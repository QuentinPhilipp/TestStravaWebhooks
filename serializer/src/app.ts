import express from 'express'
import dotenv from 'dotenv'
import firestore from './db';
import logger from './logger';

const app = express()
dotenv.config()
const port = 3000

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Authorize webhook
app.get('/', (req, res) => {
  // Your verify token. Should be a random string.
  console.log("registering webhook")
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  console.log("VERIFY_TOKEN", VERIFY_TOKEN);
  // Parses the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
  // Checks if a token and mode is in the query string of the request
  
  if (mode && token) {
    // Verifies that the mode and token sent are valid
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {     
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.json({"hub.challenge":challenge});  
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
  else {
    res.sendStatus(404);
  }
});


// Strava webhooks
// Creates the endpoint for our webhook
app.post('/', (req, res) => {
processCallback(req)
res.status(200).send('EVENT_RECEIVED')
})

async function processCallback (req): Promise<void> {
const type: string = req.body.object_type;

// don't register athlete events for now.   
if (type === 'activity') {
  const activityID: string = req.body.object_id;  
  logger.info(`register webhook for activityID: ${activityID}`);
  const database_id = `${activityID}_${Date.now()}`
  const docRef = firestore.collection('raw_activities').doc(database_id);
  await docRef.set(req.body);
}
}
app.listen(port, () => {
  const CLIENT_ID = process.env.CLIENT_ID;
  console.log(`Express is listening at http://localhost:${port} Strava APP: ${CLIENT_ID}`)
})

