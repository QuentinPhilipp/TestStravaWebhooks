// Test your connection to database server
// $ node testdb.js
var mysql = require('mysql2');
require('dotenv').config()

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};

var con = mysql.createConnection(config);

console.log(config)

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
