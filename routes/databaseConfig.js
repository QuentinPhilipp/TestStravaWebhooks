var mysql = require('mysql2');

var config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

var connection =mysql.createConnection(config); 
connection.connect(function(err) {
    if (err) throw err;
    console.log("Database connected!");
});
  
module.exports = {
    connection: mysql.createConnection(config)
}