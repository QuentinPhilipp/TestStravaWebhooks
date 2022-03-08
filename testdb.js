var mysql = require('mysql2');
require('dotenv').config()

var con = mysql.createConnection({
  host: "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database:"explore"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
