const { pool } = require("../services/db");

// function to check role if it exists, resolve true if it does, false if it doesn't
async function checkBadgesExists(badgeId) {
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT 1 FROM badges WHERE id = ?", [badgeId]);
		return rows.length > 0;
	} catch (err) {
		throw err;
	}
}

module.exports = checkBadgesExists;
