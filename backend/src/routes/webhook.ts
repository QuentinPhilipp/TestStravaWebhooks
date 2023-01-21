import { Router } from 'express'
import firestore from '../db';
import logger from '../logger';

export const webhookRoute = Router()

// Authorize webhook
webhookRoute.get('/', (req, res) => {
    // Your verify token. Should be a random string.
    console.log("registering webhook")
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
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
  });


// Strava webhooks
// Creates the endpoint for our webhook
webhookRoute.post('/', (req, res) => {
  processCallback(req)
  res.status(200).send('EVENT_RECEIVED')
})

async function processCallback (req): Promise<void> {
  const type: string = req.body.object_type;

  // don't register athlete events for now.   
  if (type === 'activity') {
    const activityID: string = req.body.object_id;  
    logger.info(`register webhook for activityID: ${activityID}`);
    const docRef = firestore.collection('activities').doc(activityID.toString());
    await docRef.set(req.body);
  }
}
