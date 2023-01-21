var express = require('express');
var router = express.Router();
var { storeUser, getAthleteToken } = require('./databaseController.js');

router.post('/add-user', async function(req, res) {
    var athlete = {
        id: req.body.id,
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname, 
        sex: req.body.sex,
        profile: req.body.profile,
        country: req.body.country,
        state: req.body.state,
        city: req.body.city,
        summit: req.body.summit
    }
    var atheleteRegistrationData = {
        athlete: athlete,
        refresh_token: "random_token",
        expires_at: "1647201935",
        access_token: "access_token"
    }
    console.log("Test store athlete:", athlete)
    if (await storeUser(atheleteRegistrationData, req.body.scope)) {
        res.sendStatus(200);
    }
    else {
        res.sendStatus(500);
    }
});

router.get('/user', async function (req, res) {
    var userId = req.body.userId;
    const result = await getAthleteToken(userId);
    console.log(result);
    res.status(200).send(result);
})

module.exports = router;
