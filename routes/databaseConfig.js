var mysql = require('mysql2/promise');

var config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

const isAthleteRegistered = async function(athleteID) {
    const connection = await mysql.createConnection(config);
    let queryStr = "SELECT athleteID FROM users WHERE athleteID = '?' LIMIT 1"
    const [rows, fields] = await connection.query(queryStr, athleteID);
    if (rows.length == 1) {
        return true;
    }
    return false;
}

const isActivityInDatabase = async function(activityID) {
    const connection = await mysql.createConnection(config);
    let queryStr = "SELECT id FROM activities WHERE id = '?' LIMIT 1"
    const [rows, fields] = await connection.query(queryStr, activityID);
    if (rows.length == 1) {
        return true;
    }
    return false;
} 

const getAthleteToken = async function(athleteId) {
    const connection = await mysql.createConnection(config);
    // get the athlete token from the db. If expired, refresh, return the new token and store it.
    let activityQuery = "SELECT token, expires_at FROM access_tokens WHERE athleteID = ?"
    const [rows, fields] = await connection.query(activityQuery, [athleteID]);
    if (rows.length == 1) {
        return rows[0].token;
    }
    console.log("Error, token not found");
}

const storeDetailedActivity = async function(detailedActivity) {
    const connection = await mysql.createConnection(config);
    activityObject = [
        detailedActivity.athlete.id,
        detailedActivity.id,
        detailedActivity.average_speed,
        detailedActivity.commute,
        detailedActivity.description,
        detailedActivity.distance,
        detailedActivity.elapsed_time,
        detailedActivity.flagged,
        detailedActivity.map.polyline,
        detailedActivity.moving_time,
        detailedActivity.name,
        detailedActivity.private,
        detailedActivity.start_date_local,
        detailedActivity.total_elevation_gain,
        detailedActivity.type
    ]
    let storingQuery = "INSERT INTO activities (athleteid, id, average_speed, commute, description, distance, elapsed_time, flagged, map, moving_time, name, private, start_date_local, total_elevation_gain, type) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    const [rows, fields] = await connection.query(storingQuery, activityObject)
    console.log(fields)
    console.log(rows)
}

const storeUser = async function(atheleteRegistrationData, scope) {
    const connection = await mysql.createConnection(config);
    let athlete = atheleteRegistrationData.athlete
    // create user in DB
    let sqlTemp = "INSERT INTO users(athleteID, username, firstname, lastname, sex, profile, country, state, registration_date) VALUES (?,?,?,?,?,?,?,?,?)";
    let registration_date = new Date();
    const [rows1, fields1] = await connection.query(sqlTemp, [athlete.id, athlete.username, athlete.firstname, athlete.lastname, athlete.sex, athlete.profile, athlete.country, athlete.state, registration_date]);

    // Store refresh token, access token and expiration date 
    let sqlRefreshTokens = "INSERT INTO refresh_tokens(athleteID, refresh_token, scope) VALUES (?,?,?)";
    const [rows2, fields2] = await connection.query(sqlRefreshTokens, [athlete.id, atheleteRegistrationData.refresh_token, scope]);

    let sqlAccessTokens = "INSERT INTO access_tokens(athleteID, scope, token, expires_at) VALUES (?,?,?,?)";
    var expireDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
    expireDate.setUTCSeconds(atheleteRegistrationData.expires_at);
    const [rows3, fields3] = await connection.query(sqlAccessTokens, [athlete.id, scope, atheleteRegistrationData.access_token, expireDate]);
    return true;
}

module.exports = {
    getAthleteToken,
    isAthleteRegistered,
    isActivityInDatabase,
    storeDetailedActivity,
    storeUser
}