const AppError = require("../utils/appError");
const { pool } = require("../services/db");

//function to get all the jobs that a gamer has applied for, get their job_id, job_name and application_state
exports.getGamerJobsApplications = async (req, res, next) => {
	try {
		const { gamer_id } = req.body;
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT job_name, gamers_jobs_applications.job_id, application_state, application_date FROM gamers_jobs_applications INNER JOIN jobs ON gamers_jobs_applications.job_id = jobs.job_id WHERE gamer_id = ? ORDER BY job_name`,
				[gamer_id]
			);
		res.status(200).json({
			status: "success",
			data: rows
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function to make a gamer apply for a job
exports.applyForJob = async (req, res, next) => {
	const { job_id } = req.params;
	const { gamer_id } = req.body;

	try {
		await pool
			.promise()
			.execute(
				`INSERT INTO gamers_jobs_applications (gamer_id, job_id) VALUES (?, ?)`,
				[gamer_id, job_id]
			);
		res.status(200).json({
			status: "success",
			message: "Gamer applied for job successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function for a gamer to delete an application for a job, //TODO MIDDLEWARE if the application is pending
exports.deleteApplication = async (req, res, next) => {
	const { job_id } = req.params;
	const { gamer_id } = req.body;

	try {
		await pool
			.promise()
			.execute(
				`DELETE FROM gamers_jobs_applications WHERE gamer_id = ? AND job_id = ?`,
				[gamer_id, job_id]
			);
		res.status(200).json({
			status: "success",
			message: "Gamer deleted application for job successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function to get all the applications for a job, get their gamer_id, their gamer_name and application_state
exports.getJobApplications = async (req, res, next) => {
	const { job_id } = req.params;
	try {
		const [rows] = await pool
			.promise()
			.execute(`SELECT * FROM gamers_jobs_applications WHERE job_id = ?`, [
				job_id
			]);
		res.status(200).json({
			status: "success",
			data: rows
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function for a recruiter to approve an application for a job
exports.approveApplication = async (req, res, next) => {
	const connection = await pool.promise().getConnection();

	try {
		await connection.beginTransaction();

		const { job_id, gamer_id } = req.params;

		await connection.execute(
			`UPDATE gamers_jobs_applications SET application_state = 'Approved' WHERE job_id = ? AND gamer_id = ?`,
			[job_id, gamer_id]
		);
		await connection.execute(
			`UPDATE jobs SET job_state = 'In progress', chosen_gamer_id = ? WHERE job_id = ?`,
			[gamer_id, job_id]
		);

		await connection.commit();
		res.status(200).json({
			status: "success",
			message: "Application approved successfully"
		});
	} catch (err) {
		await connection.rollback();
		return next(new AppError(err.message, 400));
	} finally {
		connection.release();
	}
};

//function for a recruiter to reject an application for a job
exports.rejectApplication = async (req, res, next) => {
	try {
		const { job_id, gamer_id } = req.params;

		await pool
			.promise()
			.execute(
				`UPDATE gamers_jobs_applications SET application_state = 'Rejected' WHERE job_id = ? AND gamer_id = ?`,
				[job_id, gamer_id]
			);
		res.status(200).json({
			status: "success",
			message: "Application rejected successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};
