const mysql = require("mysql2/promise");
require("dotenv").config();

const host = process.env.HOST;
const user = process.env.USER;
const password = process.env.PASSWORD;
const database = process.env.DATABASE;

const pool = mysql.createPool({
	connectionLimit: 10,
	host: host,
	user: user,
	password: password,
	database: database
});

// Get a connection from the pool and test the connection
pool
	.getConnection()
	.then((connection) => {
		console.log("Connection successful!");
		connection.release();
	})
	.catch((error) => {
		console.error("Connection error:", error);
	});

module.exports = pool;
