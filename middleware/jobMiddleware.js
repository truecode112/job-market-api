const AppError = require("../utils/appError");
const { pool } = require("../services/db");
const checkUserExists = require("../middleware/checkUserExists");
const checkGameExists = require("./checkGameExists");
const checkRoleExists = require("./checkRoleExists");

//function to check if job exists if it is set in the params
async function checkJobExists(req, res, next) {
	try {
		const [existingJob] = await pool
			.promise()
			.execute("SELECT 1 FROM jobs WHERE job_id = ?", [req.params.job_id]);
		if (existingJob.length == 0) {
			return next(new AppError("Job not found", 404));
		} else {
			next();
		}
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if game exists if it is set in the body
async function checkGameJobExists(req, res, next) {
	try {
		if (req.body.game_id) {
			const existingGame = await checkGameExists(req.body.game_id);
			if (!existingGame) {
				return next(new AppError("Game not found", 404));
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if job_state is correct if it is set
async function checkJobState(req, res, next) {
	try {
		if (req.body.job_state) {
			if (
				req.body.job_state != "Available" &&
				req.body.job_state != "In progress" &&
				req.body.job_state != "Done"
			) {
				return next(new AppError("Job state is not correct", 400));
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if payment_amount is correct if it is set
async function checkPaymentAmount(req, res, next) {
	if (req.body.payment_amount) {
		const paymentAmount = req.body.payment_amount;
		if (paymentAmount < 0) {
			return next(new AppError("Payment amount must be positive", 400));
		}
		if (isNaN(paymentAmount)) {
			return next(new AppError("Payment amount must be a number", 400));
		}

		const paymentAmountString = paymentAmount.toString();
		const decimalIndex = paymentAmountString.indexOf(".");
		if (decimalIndex == !-1) {
			const decimalPart = paymentAmountString.substring(decimalIndex + 1);
			const integerPart = paymentAmountString.substring(0, decimalIndex);
			if (decimalPart.length > 2) {
				return next(
					new AppError("Payment amount must have at most 2 decimal places", 400)
				);
			}
			if (integerPart.length > 10) {
				return next(
					new AppError(
						"Payment amount must have at most 10 digits before the decimal point",
						400
					)
				);
			}
		} else {
			if (paymentAmountString.length > 10) {
				return next(
					new AppError(
						"Payment amount must have at most 10 digits before the decimal point",
						400
					)
				);
			}
		}
	}
	next();
}

//function to check if duration is correct if it is set
async function checkDuration(req, res, next) {
	if (req.body.duration) {
		if (req.body.duration < 0)
			return next(new AppError("Duration must be positive", 400));
		if (isNaN(req.body.duration))
			return next(new AppError("Duration must be a number", 400));
		if (!Number.isInteger(req.body.duration))
			return next(new AppError("Duration must be an integer", 400));
	}
	next();
}

//function to check if recruiter_id exists if it is set
async function checkRecruiterExists(req, res, next) {
	try {
		if (req.body.recruiter_id) {
			const existingUser = await checkUserExists(req.body.recruiter_id);
			if (!existingUser) {
				return next(new AppError("Recruiter not found", 404));
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if chosen_gamer_id exists if it is set
async function checkChosenGamerExists(req, res, next) {
	try {
		if (req.body.chosen_gamer_id) {
			const existingUser = await checkUserExists(req.body.chosen_gamer_id);
			if (!existingUser) {
				return next(new AppError("Chosen gamer not found", 404));
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if role exist if one or more are set
async function checkRolesExist(req, res, next) {
	try {
		if (req.body.roles_id) {
			for (let i = 0; i < req.body.roles_id.length; i++) {
				const existingRole = await checkRoleExists(req.body.roles_id[i]);
				if (!existingRole) {
					return next(new AppError("Role not found", 404));
				}
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check that chosen_gamer_id is not the same as recruiter_id
async function checkChosenGamerIsNotRecruiter(req, res, next) {
	try {
		if (req.body.chosen_gamer_id && req.body.recruiter_id) {
			if (req.body.chosen_gamer_id == req.body.recruiter_id) {
				return next(
					new AppError("Chosen gamer cannot be the same as recruiter", 400)
				);
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if job is done, if it is, then it cannot be modified
async function checkJobIsDone(req, res, next) {
	try {
		const [connection] = await pool
			.promise()
			.execute("SELECT job_state FROM jobs WHERE job_id = ?", [
				req.params.job_id
			]);
		if (connection[0].job_state == "Done") {
			return next(new AppError("Job is done, it cannot be modified", 400));
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

module.exports = {
	checkJobExists,
	checkGameJobExists,
	checkJobState,
	checkPaymentAmount,
	checkDuration,
	checkRecruiterExists,
	checkChosenGamerExists,
	checkRolesExist,
	checkChosenGamerIsNotRecruiter,
	checkJobIsDone
};
