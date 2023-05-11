const AppError = require("../utils/appError");
const { pool } = require("../services/db");
const checkUserExists = require("./checkUserExists");
const checkJobExists = require("./checkJobExists");

//function to check if gamer_id exists
async function checkApplicantOfferedIdExists(req, res, next) {
	try {
		const gamer_id = req.params.gamer_id
			? req.params.gamer_id
			: req.body.gamer_id;

		const existingUser = await checkUserExists(gamer_id);
		if (!existingUser) {
			return next(new AppError("Applicant not found", 404));
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if job_id applied for exists
async function checkJobIdExists(req, res, next) {
	try {
		const existingJob = await checkJobExists(req.params.job_id);
		if (!existingJob) {
			return next(new AppError("Job not found", 404));
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if application exists
async function checkApplicationExists(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const { job_id } = req.params;

	if (!gamer_id) return next(new AppError("gamer_id is required", 400));
	if (!job_id) return next(new AppError("job_id is required", 400));

	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_applications WHERE gamer_id = ? AND job_id = ?`,
				[gamer_id, job_id]
			);
		if (rows.length === 0) {
			return next(new AppError("Job application not found", 404));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if offer for gamer exists
async function checkJobOfferExists(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const { job_id } = req.params;

	if (!gamer_id) return next(new AppError("gamer_id is required", 400));
	if (!job_id) return next(new AppError("job_id is required", 400));

	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_offers WHERE gamer_id = ? AND job_id = ?`,
				[gamer_id, job_id]
			);
		if (rows.length === 0) {
			return next(new AppError("Job offer not found", 404));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if application is already approved
async function checkApplicationApproved(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const job_id = req.params.job_id;
	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_applications WHERE job_id = ? AND gamer_id = ? AND application_state = ?`,
				[job_id, gamer_id, "Approved"]
			);
		if (rows.length > 0) {
			return next(new AppError("Application already been approved", 400));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if offer job is already accepted
async function checkJobOfferAccepted(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const job_id = req.params.job_id;
	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_offers WHERE job_id = ? AND gamer_id = ? AND offer_state = ?`,
				[job_id, gamer_id, "Accepted"]
			);
		if (rows.length > 0) {
			return next(new AppError("Job offer already been accepted", 400));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if application is already rejected
async function checkApplicationRejected(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const job_id = req.params.job_id;
	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_applications WHERE job_id = ? AND gamer_id = ? AND application_state = ?`,
				[job_id, gamer_id, "Rejected"]
			);
		if (rows.length > 0) {
			return next(new AppError("Application already been rejected", 400));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if offer for job is already refused
async function checkJobOfferRefused(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const job_id = req.params.job_id;
	try {
		const [rows] = await pool
			.promise()
			.execute(
				`SELECT * FROM gamers_jobs_offers WHERE job_id = ? AND gamer_id = ? AND offer_state = ?`,
				[job_id, gamer_id, "Refused"]
			);
		if (rows.length > 0) {
			return next(new AppError("Offer job already been refused", 400));
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

//function to check if there is already a gamer-job relationship with this gamer and job, for applications or offers
async function checkDuplicateGamerJobRelationship(req, res, next) {
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	const job_id = req.params.job_id;

	const connection = await pool.promise().getConnection();
	try {
		await connection.beginTransaction();

		//check if there is already a gamer-job-offer relationship with this gamer and job
		const [rows] = await connection.execute(
			`SELECT * FROM gamers_jobs_offers WHERE job_id = ? AND gamer_id = ?`,
			[job_id, gamer_id]
		);
		if (rows.length > 0) {
			return next(new AppError("Gamer already offered for this job", 400));
		}

		//check if there is already a gamer-job-application relationship with this gamer and job
		const [rows2] = await connection.execute(
			`SELECT * FROM gamers_jobs_applications WHERE job_id = ? AND gamer_id = ?`,
			[job_id, gamer_id]
		);
		if (rows2.length > 0) {
			return next(new AppError("Gamer already applied for this job", 400));
		}

		await connection.commit();
		next();
	} catch (err) {
		await connection.rollback();
		return next(new AppError(err.message, 400));
	} finally {
		connection.release();
	}
}

//function to check that a recruiter can't apply or offer for his own job
async function checkRecruiterCantSelfApplyOfferJob(req, res, next) {
	const job_id = req.params.job_id;
	const gamer_id = req.params.gamer_id
		? req.params.gamer_id
		: req.body.gamer_id;
	try {
		const [rows] = await pool
			.promise()
			.execute(`SELECT * FROM jobs WHERE job_id = ? AND recruiter_id = ?`, [
				job_id,
				gamer_id
			]);
		if (rows.length > 0) {
			return next(
				new AppError("Recruiter can't apply or offer for his own job", 400)
			);
		}
		next();
	} catch (err) {
		return next(new AppError(err.message, 400));
	}
}

module.exports = {
	checkApplicantOfferedIdExists,
	checkApplicationExists,
	checkApplicationApproved,
	checkApplicationRejected,
	checkJobIdExists,
	checkJobOfferExists,
	checkJobOfferAccepted,
	checkJobOfferRefused,
	checkDuplicateGamerJobRelationship,
	checkRecruiterCantSelfApplyOfferJob
};
