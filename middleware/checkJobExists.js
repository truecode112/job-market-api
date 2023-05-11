const { pool } = require("../services/db");

// function to check if the job exists
async function checkJobExists(jobId) {
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT 1 FROM jobs WHERE job_id = ?", [jobId]);
		return rows.length > 0;
	} catch (error) {
		throw error;
	}
}

module.exports = checkJobExists;
