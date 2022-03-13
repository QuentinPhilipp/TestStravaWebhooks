var mysql = require('mysql2/promise');
const axios = require('axios')
const fs = require('fs');
const path = require('path');

var config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

const isAthleteRegistered = async function(athleteID) {
    const connection = await mysql.createConnection(config);
    let queryStr = "SELECT id FROM athletes WHERE id = '?' LIMIT 1"
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
    // get the athlete token from the db. If expired, need to refresh, return the new token and store it.
    let activityQuery = "SELECT token, expires_at FROM access_tokens WHERE athleteID = ?"
    const [rows, fields] = await connection.query(activityQuery, [athleteID]);
    if (rows.length == 1) {
        return rows[0].token;
    }
    console.log("Error, token not found");
}

const writeStreams = async function(dataStreams, activityID, connection) {
    var files = {
        watts: "defaultValue",
        altitude: "defaultValue",
        distance: "defaultValue",
        heartrate: "defaultValue"
    }
    dataStreams.forEach( async function(dataStream) {
        var filename = path.join(__dirname, "/../streamdata", activityID.toString() + "_"+ dataStream.type + ".json");
        let data = JSON.stringify(dataStream.data);
        try {
            fs.writeFileSync(filename, data)
            console.log(filename, 'successfully generated');
            files[dataStream.type] = filename;
        } catch (e) {
            throw e;
        }
    });
    console.log("Update path to files");
    sqlUpdateQuery = "UPDATE activities SET power_stream = ?, altitude_stream = ?, distance_stream = ?, heartrate_stream = ? WHERE id = ?";
    await connection.query(sqlUpdateQuery, [files.watts, files.altitude, files.distance, files.heartrate, activityID]);
}

const storeDetailedActivity = async function(detailedActivity) {
    const connection = await mysql.createConnection(config);
    activityObject = [
        detailedActivity.id,
        detailedActivity.athlete.id,
        detailedActivity.name,
        detailedActivity.distance,
        detailedActivity.moving_time,
        detailedActivity.elapsed_time,
        detailedActivity.total_elevation_gain,
        detailedActivity.elev_high,
        detailedActivity.elev_low,
        detailedActivity.type,
        new Date(detailedActivity.start_date_local).toISOString().slice(0,19).replace("T", " "),
        detailedActivity.achievement_count,
        detailedActivity.kudos_count,
        detailedActivity.comment_count,
        detailedActivity.athlete_count,
        detailedActivity.map.polyline,
        detailedActivity.trainer,
        detailedActivity.commute,
        detailedActivity.manual,
        detailedActivity.private,
        detailedActivity.flagged,
        detailedActivity.average_speed,
        detailedActivity.max_speed,
        detailedActivity.gear_id,
        detailedActivity.kilojoules,
        detailedActivity.average_watts,
        detailedActivity.device_watts,
        detailedActivity.max_watts || 0,
        detailedActivity.weighted_average_watts || 0,
        detailedActivity.description || "",
        detailedActivity.calories,
        detailedActivity.device_name,
        detailedActivity.power_stream || "",
        detailedActivity.altitude_stream || "",
        detailedActivity.heartrate_stream || "",
        detailedActivity.distance_stream || ""
    ]
    let storingQuery = `INSERT INTO activities (
        id,
        athleteID,
        name,
        distance,
        moving_time,
        elapsed_time,
        total_elevation_gain,
        elev_high,
        elev_low,
        type,
        start_date_local,
        achievement_count,
        kudos_count,
        comment_count,
        athlete_count,
        map,
        trainer,
        commute,
        manual,
        private,
        flagged,
        average_speed,
        max_speed,
        gear_id,
        kilojoules,
        average_watts,
        device_watts,
        max_watts,
        weighted_average_watts,
        description,
        calories,
        device_name,
        power_stream,
        altitude_stream,
        heartrate_stream,
        distance_stream
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    const [rows, fields] = await connection.query(storingQuery, activityObject)
    console.log(fields)
    console.log(rows)

    const athleteToken = await getAthleteToken(detailedActivity.athlete.id);
    const stravaConfig = {
        headers: {
          Authorization: `Bearer ${ athleteToken }`,
        },
      };

    // Get streams for activity
    axios.get(`https://www.strava.com/api/v3/activities/${detailedActivity.id}/streams?keys=watts,heartrate,altitude`, stravaConfig).then(response => {
        writeStreams(response.data, detailedActivity.id, connection);
    });

}

const storeUser = async function(atheleteRegistrationData, scope) {
    const connection = await mysql.createConnection(config);
    let athlete = atheleteRegistrationData.athlete
    // create user in DB
    let sqlTemp = "INSERT INTO athletes(id, username, firstname, lastname, sex, profile, country, state, city, summit,registration_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
    let registration_date = new Date();
    await connection.query(sqlTemp, [athlete.id, athlete.username, athlete.firstname, athlete.lastname, athlete.sex, athlete.profile, athlete.country, athlete.state, athlete.city, athlete.summit, registration_date]);

    // Store refresh token, access token and expiration date 
    let sqlRefreshTokens = "INSERT INTO refresh_tokens(athleteID, refresh_token, scope) VALUES (?,?,?)";
    await connection.query(sqlRefreshTokens, [athlete.id, atheleteRegistrationData.refresh_token, scope]);

    let sqlAccessTokens = "INSERT INTO access_tokens(athleteID, scope, token, expires_at) VALUES (?,?,?,?)";
    var expireDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
    expireDate.setUTCSeconds(atheleteRegistrationData.expires_at);
    await connection.query(sqlAccessTokens, [athlete.id, scope, atheleteRegistrationData.access_token, expireDate]);
    return true;
}

module.exports = {
    getAthleteToken,
    isAthleteRegistered,
    isActivityInDatabase,
    storeDetailedActivity,
    storeUser
}