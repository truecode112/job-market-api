const AppError = require("../utils/appError");
const { pool } = require("../services/db");

//function to get all the gamers that have been offered a job, get their gamer_id, gamer_name and offer_state
exports.getJobOffers = async (req, res, next) => {
	try {
		const { job_id } = req.params;
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT gamer_name, gamers_jobs_offers.gamer_id, offer_state FROM gamers_jobs_offers INNER JOIN gamers ON gamers_jobs_offers.gamer_id = gamers.gamer_id WHERE job_id = ?`,
				[job_id]
			);
		res.status(200).json({
			status: "success",
			data: rows
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function for a recruiter to offer a gamer for a job
exports.offerGamerForJob = async (req, res, next) => {
	try {
		const { gamer_id, job_id } = req.params;

		await pool
			.promise()
			.execute(
				`INSERT INTO gamers_jobs_offers (gamer_id, job_id) VALUES (?, ?)`,
				[gamer_id, job_id]
			);
		res.status(200).json({
			status: "success",
			message: "Gamer offered for job successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//function to delete a job offered to a gamer
exports.deleteJobOffer = async (req, res, next) => {
	try {
		const { gamer_id, job_id } = req.params;

		await pool
			.promise()
			.execute(
				`DELETE FROM gamers_jobs_offers WHERE gamer_id = ? AND job_id = ?`,
				[gamer_id, job_id]
			);
		res.status(200).json({
			status: "success",
			message: "Job offered to a gamer deleted successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};

//DONE function to get all the jobs that a gamer has been offered for, get their job_id, job_name and offer_state
exports.getGamerJobsOffers = async (req, res, next) => {
	try {
		const { gamer_id } = req.body;

		const [rows] = await pool
			.promise()
			.execute(
				`SELECT job_name, job_id, offer_state FROM gamers_jobs_offers INNER JOIN jobs ON gamers_jobs_offers.job_id = jobs.job_id WHERE gamer_id = ?`,
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

//function for a gamer to accept a job offered to him
exports.acceptJobOffer = async (req, res, next) => {
	const connection = await pool.promise().getConnection();

	try {
		await connection.beginTransaction();

		const { job_id } = req.params;
		const { gamer_id } = req.body;

		await connection.execute(
			`UPDATE gamers_jobs_offers SET offer_state = 'Accepted' WHERE gamer_id = ? AND job_id = ?`,
			[gamer_id, job_id]
		);

		await connection.execute(
			`UPDATE jobs SET chosen_gamer_id = ?, job_state = 'In progress' WHERE job_id = ?`,
			[gamer_id, job_id]
		);

		await connection.commit();
		res.status(200).json({
			status: "success",
			message: "Job accepted successfully"
		});
	} catch (err) {
		await connection.rollback();
		return next(new AppError(err.message, 400));
	} finally {
		connection.release();
	}
};

//function for a gamer to refuse a job offered to him
exports.refuseJobOffer = async (req, res, next) => {
	try {
		const { job_id } = req.params;
		const { gamer_id } = req.body;

		await pool
			.promise()
			.execute(
				`UPDATE gamers_jobs_offers SET offer_state = 'Refused' WHERE gamer_id = ? AND job_id = ?`,
				[gamer_id, job_id]
			);
		res.status(200).json({
			status: "success",
			message: "Job refused successfully"
		});
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
};
