const { pool } = require("../services/db");

// function to check if a game exists
async function checkGameExists(gameId) {
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT 1 FROM games WHERE id = ?", [gameId]);
		return rows.length > 0;
	} catch (error) {
		throw error;
	}
}

module.exports = checkGameExists;
