var express = require('express');
const axios = require('axios')
require('dotenv').config();
var router = express.Router();
var { isAthleteRegistered, storeUser } = require('./databaseController.js');

/* GET api calls. */
router.get('/login', function(req, res, next) {
    let url = "https://www.strava.com/oauth/authorize?client_id=";
    url += process.env.CLIENT_ID;
    url += "&response_type=code&redirect_uri=";
    url += process.env.AUTH_URL;
    url += "&approval_prompt=force&scope="
    url += process.env.AUTH_SCOPE
    res.redirect(url);
});

// Adds support for GET requests to our webhook
router.get('/exchange_token', async (req, res) => {
    if (req.query.scope.includes(process.env.AUTH_SCOPE)) {
        axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${req.query.code}&grant_type=authorization_code`)
        .then(async function (response) {
            // If user already exit, authenticate him
            // Else create the account and authenticate
            if (await isAthleteRegistered(response.data.athlete.id)) {
                res.sendStatus(200);
            }
            else {
                if (await storeUser(response.data, req.query.scope)) {
                    res.sendStatus(200);
                }
                else {
                    res.sendStatus(500);
                }
            }
         }) 
         .catch(error => {
             console.log('Error when registering user\n', error);
             res.status(500).send(error);
            })

    }
    else
    {
        res.sendStatus(500);
    }
});

module.exports = router;
