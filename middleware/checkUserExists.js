const { pool } = require("../services/db");

//function to check if a user exists
async function checkUserExists(gamer_id) {
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT 1 FROM gamers WHERE gamer_id = ?", [gamer_id]);
		return rows.length > 0;
	} catch (error) {
		throw error;
	}
}

module.exports = checkUserExists;
