var mysql = require('mysql2/promise');
const axios = require('axios')
require('dotenv').config();
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

const getAthleteToken = async function(athleteID) {
    const connection = await mysql.createConnection(config);
    // get the athlete token from the db. If expired, need to refresh, return the new token and store it.
    let activityQuery = "SELECT access_tokens.athleteID, token, expires_at, access_tokens.scope, refresh_token FROM access_tokens INNER JOIN refresh_tokens ON access_tokens.athleteID=refresh_tokens.athleteID WHERE access_tokens.athleteID=?"
    const [rows, fields] = await connection.query(activityQuery, [athleteID]);
    if (rows.length == 1) {
        const now = new Date();
        if (rows[0].expires_at < now) {
            console.log("Expired, need to refresh token")       
            const params = {
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: rows[0].refresh_token
            }
            // Refresh token
            axios.post(`https://www.strava.com/oauth/token`, params).then(async (response) => {
                if (response.status == 200) {
                    const access_token = response.data.access_token;
                    const expires_at = response.data.expires_at;
                    const refresh_token = response.data.refresh_token;
                    await updateAthleteTokens(athleteID, access_token, expires_at, refresh_token)
                    console.log("Returned new token", access_token);
                    return access_token;
                }
                else {
                    console.log("Can't refresh token for athlete:", athleteID);
                }
            });
        }
        else {
            console.log("Returned old token:", rows[0].token);
            return rows[0].token;
        }
    }
    console.log("Error, token not found");
}

const updateAthleteTokens = async function(athleteID, token, expires_at, refresh_token) {
    const connection = await mysql.createConnection(config);
    let updateRefreshTokens = "UPDATE refresh_tokens SET refresh_token=? WHERE athleteID=?";
    await connection.query(updateRefreshTokens, [refresh_token, athleteID]);

    var expireDate = new Date(0); // The 0 there is the key, which sets the date to the epoch
    expireDate.setUTCSeconds(expires_at);
    let updateAccessTokens = "UPDATE access_tokens SET token=?, expires_at=? WHERE athleteID=?";
    await connection.query(updateAccessTokens, [token, expireDate, athleteID]);
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
        detailedActivity.id || "0",
        detailedActivity.athlete.id || "0",
        detailedActivity.name || "no name",
        detailedActivity.distance || 0,
        detailedActivity.moving_time || 0,
        detailedActivity.elapsed_time || 0,
        detailedActivity.total_elevation_gain || 0,
        detailedActivity.elev_high || 0,
        detailedActivity.elev_low || 0,
        detailedActivity.type || "",
        new Date(detailedActivity.start_date_local).toISOString().slice(0,19).replace("T", " "),
        detailedActivity.achievement_count || 0,
        detailedActivity.kudos_count || 0,
        detailedActivity.comment_count || 0,
        detailedActivity.athlete_count || 0,
        detailedActivity.map.polyline || "",
        detailedActivity.trainer || false,
        detailedActivity.commute || false,
        detailedActivity.manual || false,
        detailedActivity.private || false,
        detailedActivity.flagged || false,
        detailedActivity.average_speed || 0,
        detailedActivity.max_speed || 0,
        detailedActivity.gear_id || "0",
        detailedActivity.kilojoules || 0,
        detailedActivity.average_watts || 0,
        detailedActivity.device_watts || 0,
        detailedActivity.max_watts || 0,
        detailedActivity.weighted_average_watts || 0,
        detailedActivity.description || "",
        detailedActivity.calories || 0,
        detailedActivity.device_name || "",
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

    console.log('Get streams with token: ' +athleteToken);
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