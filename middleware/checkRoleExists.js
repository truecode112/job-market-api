const { pool } = require("../services/db");

// function to check role if it exists, resolve true if it does, false if it doesn't
async function checkRoleExists(roleId) {
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT 1 FROM roles WHERE id = ?", [roleId]);
		return rows.length > 0;
	} catch (err) {
		throw err;
	}
}

module.exports = checkRoleExists;
