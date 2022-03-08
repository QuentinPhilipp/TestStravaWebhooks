var express = require('express');
var router = express.Router();
var config = require('./databaseConfig.js');
var connection= config.connection

router.get('/', function(req, res, next) {
    res.json({ message: "API is working properly" });
});

router.post('/', function(req, res) {
    var id = req.body.id;
    var username = req.body.username;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var sex = req.body.sex;
    var profile = req.body.profile;
    var country = req.body.country;
    var state = req.body.state;

    let sqlTemp = "INSERT INTO users(athleteID, username, firstname, lastname, sex, profile, country, state) VALUES (?,?,?,?,?,?,?,?)";
    connection.query(sqlTemp, [id, username, firstname, lastname, sex, profile, country, state], (err, results, fields) => {
    if (err) {
        res.status(500).send(err.message);
    }
    else {
        console.log("Registered: "+username+" | ID: "+id);
        res.sendStatus(200);
    }
    });
});

module.exports = router;
