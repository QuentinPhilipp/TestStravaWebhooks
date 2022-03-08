var express = require('express');
const axios = require('axios')
require('dotenv').config();
var router = express.Router();
var config = require('./databaseConfig.js');
var connection = config.connection

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
router.get('/exchange_token', (req, res) => {
    console.log("Exchange token for auth")
    console.log(req.query.code);
    if (req.query.scope.includes(process.env.AUTH_SCOPE)) {
        axios.post(`https://www.strava.com/api/v3/oauth/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${req.query.code}&grant_type=authorization_code`).then(response => {
            console.log(response.data)
            // If user already exit, authenticate him
            // Else create the account and authenticate
            let queryStr = "SELECT * FROM users WHERE athleteID = '?'"
            connection.query(queryStr, response.data.athlete.id, (err, rows) => {
                if (err) {
                    res.status(500).send(err.message);
                }
                else {
                    if (rows.length == 1){
                        console.log("Found user");
                        res.sendStatus(200);
                    }
                    else {
                        console.log("User not found");
                        if (createAccount(response.data, req.query.scope)) {
                            res.sendStatus(200);
                        }
                        else {
                            res.sendStatus(500);
                        }
                    }
                }
                });

         }) 
         .catch(error => {
             console.log('Error to fetch data\n');
             res.sendStatus(500);
            })

    }
    else
    {
        res.sendStatus(500);
    }
});


async function createAccount(atheleteRegistrationData, scope) {
    athlete = atheleteRegistrationData.athlete

    // create user in DB
    let sqlTemp = "INSERT INTO users(athleteID, username, firstname, lastname, sex, profile, country, state, registration_date) VALUES (?,?,?,?,?,?,?,?,?)";
    let registration_date = new Date();
    connection.query(sqlTemp, [athlete.id, athlete.username, athlete.firstname, athlete.lastname, athlete.sex, athlete.profile, athlete.country, athlete.state, registration_date], (err, results, fields) => {
        if (err) {
            console.log(err.message);
            return false;
        }
        else {
            console.log("Registered: "+athlete.username+" | ID: "+athlete.id);
        }
    });

    // Store refresh token, access token and expiration date 
    let sqlRefreshTokens = "INSERT INTO refresh_tokens(athleteID, refresh_token, scope) VALUES (?,?,?)";
    connection.query(sqlRefreshTokens, [athlete.id, atheleteRegistrationData.refresh_token, scope], (err, results, fields) => {
        if (err) {
            console.log(err.message);
            return false;
        }
    });
    let sqlAccessTokens = "INSERT INTO access_tokens(athleteID, scope, token, expires_at) VALUES (?,?,?,?)";
    var expireDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
    expireDate.setUTCSeconds(atheleteRegistrationData.expires_at);
    connection.query(sqlAccessTokens, [athlete.id, scope, atheleteRegistrationData.access_token, expireDate], (err, results, fields) => {
        if (err) {
            console.log(err.message);
            return false;
        }
    });
}

module.exports = router;
