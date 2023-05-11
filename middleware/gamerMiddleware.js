const AppError = require("../utils/appError");
const { pool } = require("../services/db");
const checkRoleExists = require("./checkRoleExists");
const checkGameExists = require("./checkGameExists");
const checkBadgeExists = require("./checkBadgeExists");
const fs = require('fs');

async function checkUsername(req, res, next) {
	try {
		const [existingUser] = await pool
			.promise()
			.execute("SELECT * FROM gamers WHERE username = ?", [req.body.username]);

		if (existingUser.length == 0) {
			next();
		}
		//if the username already exists, check if it belongs to the same user that is trying to update its profile (in this case, the username is not duplicated)
		else if (
			req.params.gamer_id &&
			existingUser.length > 0 &&
			existingUser[0].gamer_id == req.params.gamer_id
		) {
			next();
		} else {
			return next(new AppError("Username already taken", 400));
		}
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

function checkProfileType(req, res, next) {
	if (
		req.body.profile_type &&
		req.body.profile_type !== "Gamer" &&
		req.body.profile_type !== "Recruiter" &&
		req.body.profile_type !== "Guild Manager"
	) {
		return next(new AppError("Incorrect type of profile", 400));
	}

	next();
}

function checkBirthdateFormat(req, res, next) {
	if (req.body.birthdate && !req.body.birthdate.match(/^\d{4}-\d{2}-\d{2}$/)) {
		return next(new AppError("Incorrect date format", 400));
	}

	next();
}

function checkMinHourRate(req, res, next) {
	if (req.body.min_hour_rate && req.body.min_hour_rate <= 0) {
		return next(new AppError("Wrong minimum hour rate value", 400));
	}

	next();
}

function checkHoursPerDay(req, res, next) {
	if (
		req.body.hours_per_day &&
		(req.body.hours_per_day <= 0 || req.body.hours_per_day > 24)
	) {
		return next(new AppError("Wrong hours per day value", 400));
	}

	next();
}

//function to check if game exist if one or more are set in the body
async function checkGamesExist(req, res, next) {
	try {
		if (req.body.favorite_games_id) {
			for (let i = 0; i < req.body.favorite_games_id.length; i++) {
				const existingGame = await checkGameExists(
					req.body.favorite_games_id[i]
				);
				if (!existingGame) {
					return next(new AppError("Game does not exist", 400));
				}
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to check if role exist if one or more are set in the body
async function checkRolesExist(req, res, next) {
	try {
		if (req.body.favorite_roles_id) {
			for (let i = 0; i < req.body.favorite_roles_id.length; i++) {
				const existingRole = await checkRoleExists(
					req.body.favorite_roles_id[i]
				);
				if (!existingRole) {
					return next(new AppError("Role does not exist", 400));
				}
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

//function to update total_earned of a gamer, will be used when a job where the gamer is assigned as chosen_gamer is set to done
async function updateTotalEarned(req, res, next) {
	if (!req.params.gamer_id) {
		return next(new AppError("No gamer gamer_id found", 404));
	}
	try {
		const connection = await pool.promise().getConnection();
		await connection.beginTransaction();

		//get the total_earned of the gamer
		const [data] = await connection.execute(
			"SELECT SUM(payment_amount) AS total_earned FROM jobs WHERE chosen_gamer_id = ? AND job_state = 'Done'",
			[req.params.gamer_id]
		);

		let totalEarned = data[0].total_earned;
		//if the gamer has no jobs done, so result is null, set total_earned to 0
		if (totalEarned == null) {
			totalEarned = 0;
		}

		//update the total_earned of the gamer
		await connection.execute(
			"UPDATE gamers SET total_earned = ? WHERE gamer_id = ?",
			[totalEarned, req.params.gamer_id]
		);

		await connection.commit();
		connection.release();

		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

async function checkGamerExists(req, res, next) {
	try {
		const [rows, fields] = await pool
			.promise()
			.execute("SELECT * FROM gamers WHERE gamer_id = ?", [
				req.params.gamer_id
			]);
		if (rows.length == 0) {
			return next(new AppError("Gamer does not exist", 404));
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

async function checkFileExists(req, res, next) {
  try {
    if (!req.files) {
      return next(new AppError("No avatar of gamer", 404));
    }
    next();
  } catch (err) {
    return next(new AppError(err, 500));
  }
}

function checkGamerAvatarExists(req, res, next) {
  console.log('req.body.avatar_file >>>', req.body.avatar_file);
	if (
		req.body.avatar_file &&
    !fs.existsSync('uploads/avatars/' + req.body.avatar_file)
	) {
		return next(new AppError("Invalid avatar file. Not exist", 400));
	}

	next();
}

async function checkBadgesExists(req, res, next) {
	try {
		if (req.body.badges_id) {
			for (let i = 0; i < req.body.badges_id.length; i++) {
				const existingBadge = await checkBadgeExists(
					req.body.badges_id[i]
				);
				if (!existingBadge) {
					return next(new AppError("Badge does not exist", 400));
				}
			}
		}
		next();
	} catch (err) {
		return next(new AppError(err, 500));
	}
}

module.exports = {
	checkUsername,
	checkProfileType,
	checkBirthdateFormat,
	checkMinHourRate,
	checkHoursPerDay,
	checkGamesExist,
	checkRolesExist,
	updateTotalEarned,
	checkGamerExists,
  checkFileExists,
  checkGamerAvatarExists,
  checkBadgesExists
};
