var express = require('express');
require('dotenv').config();
var router = express.Router();

/* GET api calls. */
router.get('/', function(req, res, next) {
    res.json({ message: "API is working properly" });
});

// Strava webhooks
// Creates the endpoint for our webhook
router.post('/webhook', (req, res) => {
    console.log("webhook event received!", req.query, req.body);
    res.status(200).send('EVENT_RECEIVED');
  });

// Adds support for GET requests to our webhook
router.get('/webhook', (req, res) => {
    // Your verify token. Should be a random string.
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
    // Parses the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    // Checks if a token and mode is in the query string of the request
    
    console.log(mode, token, challenge);
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

module.exports = router;
