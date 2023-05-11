const AppError = require("../utils/appError");
const { pool } = require("../services/db");
const uuidv4 = require("uuid").v4;
const { nanoid } = require('nanoid/async');
const mime = require('mime-types');

// function to create gamer, require username, others are optional
exports.createGamer = async (req, res, next) => {
	if (!req.body) return next(new AppError("No form data found", 404));
	if (!req.body.username) return next(new AppError("No username found", 404));

	const connection = await pool.promise().getConnection();

	try {
		await connection.beginTransaction();

		//generate a unique gamer_id for the gamer
		const gamer_id = uuidv4();

		//initialize query and values, username is required
		let query = "INSERT INTO gamers (gamer_id, username";
		let values = [gamer_id, req.body.username];

		//possibility to set other attributes of the gamer
		const columnMap = {
			profile_type: "profile_type",
			location: "location",
			birthdate: "birthdate",
			description: "description",
			name_discord: "name_discord",
			link_twitter: "link_twitter",
			link_linkedin: "link_linkedin",
			link_facebook: "link_facebook",
			min_hour_rate: "min_hour_rate",
			hours_per_day: "hours_per_day",
      avatar_file: "avatar_file",
		};

		Object.keys(columnMap).forEach((key) => {
			if (req.body[key]) {
				query += `, ${columnMap[key]}`;
				values.push(req.body[key]);
			}
		});

		query += ") VALUES(?";
		for (let i = 1; i < values.length; i++) {
			query += ",?";
		}
		query += ")";

		//execute query to insert gamer
		await connection.execute(query, values);

		//insert favorite games if any
		if (req.body.favorite_games_id) {
			query = "INSERT INTO gamers_games (gamer_id, game_id) VALUES";
			values = [];
			req.body.favorite_games_id.forEach((game_id) => {
				query += "(?,?),";
				values.push(gamer_id);
				values.push(game_id);
			});
			query = query.slice(0, -1);

			await connection.execute(query, values);
		}

		//insert favorite roles if any
		if (req.body.favorite_roles_id) {
			query = "INSERT INTO gamers_roles (gamer_id, role_id) VALUES ";
			values = [];
			req.body.favorite_roles_id.forEach((role_id) => {
				query += "(?,?),";
				values.push(gamer_id);
				values.push(role_id);
			});
			query = query.slice(0, -1);

      console.log('query >>>', query);
      console.log('values >>>', values);

			await connection.execute(query, values);
		}

    //insert badges if any
    if (req.body.badges_id) {
      query = "INSERT INTO gamers_badges (gamer_id, badge_id) VALUES";
      values = [];
      req.body.badges_id.forEach((badge_id) => {
        query += "(?,?),";
        values.push(gamer_id);
        values.push(badge_id);
      });
      query = query.slice(0, -1);
      console.log('badge insert query >>>', query);
      await connection.execute(query, values);
    }

		await connection.commit();
		res.status(201).json({
			status: "success",
			message: "Gamer created successfully",
			data: {
				gamer_id: gamer_id
			}
		});

		connection.release();
	} catch (err) {
		return next(new AppError(err, 500));
	} finally {
		connection.release();
	}
};

//TODO: add pagination ? and select only username and gamer_id, roles, games
//function to get all gamers
exports.getAllGamers = async (req, res, next) => {
	try {
		const [rows] = await pool.promise().execute(`
			SELECT gamers.*,
			GROUP_CONCAT(DISTINCT games.game_name SEPARATOR ', ') AS favorite_games,
			GROUP_CONCAT(DISTINCT roles.role_name SEPARATOR ', ') AS favorite_roles
			FROM gamers
			LEFT JOIN gamers_games ON gamers.gamer_id = gamers_games.gamer_id
			LEFT JOIN gamers_roles ON gamers.gamer_id = gamers_roles.gamer_id
			LEFT JOIN games ON gamers_games.game_id = games.id
			LEFT JOIN roles ON gamers_roles.role_id = roles.id
			GROUP BY gamers.gamer_id
		`);
		res.status(200).json({
			status: "success",
			length: rows?.length,
			data: rows
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to get a gamer's gamer_id using its username
// exports.getGamerId = async (req, res, next) => {
// 	try {
// 		if (!req.body.username)
// 			return next(new AppError("No gamer username found", 404));
// 		connection.query(
// 			"SELECT gamer_id FROM gamers WHERE username = ?",
// 			[req.body.username],
// 			function (err, data, fields) {
// 				if (err) return next(new AppError(err, 500));
// 				res.status(200).json({
// 					status: "success",
// 					length: data?.length,
// 					data: data
// 				});
// 			}
// 		);
// 	} catch (err) {
// 		return next(new AppError(err, 500));
// 	}
// };

//function to get a gamer using its gamer_id
exports.getGamer = async (req, res, next) => {
	if (!req.params.gamer_id) return next(new AppError("No gamer_id found", 404));
	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT * FROM gamers WHERE gamer_id = ?", [
				req.params.gamer_id
			]);

		res.status(200).json({
			status: "success",
			length: rows.length,
			data: rows
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

// function to update a gamer
exports.updateGamer = async (req, res, next) => {
  // console.log(req.params.gamer_id);
	if (!req.params.gamer_id || !req.body || Object.keys(req.body).length === 0)
		return next(new AppError("No gamer gamer_id or form data found", 404));

	const connection = await pool.promise().getConnection();

	try {
		await connection.beginTransaction();

		if (
			req.body.username ||
			req.body.profile_type ||
			req.body.birthdate ||
			req.body.description ||
			req.body.location ||
			req.body.name_discord ||
			req.body.link_twitter ||
			req.body.link_linkedin ||
			req.body.link_facebook ||
			req.body.min_hour_rate ||
			req.body.hours_per_day ||
      req.body.avatar_file
		) {
			// initiate query and values
			let query = "UPDATE gamers SET ";
			let values = [];

			const columnMap = {
				username: "username",
				profile_type: "profile_type",
				birthdate: "birthdate",
				description: "description",
				location: "location",
				name_discord: "name_discord",
				link_twitter: "link_twitter",
				link_linkedin: "link_linkedin",
				link_facebook: "link_facebook",
				min_hour_rate: "min_hour_rate",
				hours_per_day: "hours_per_day",
        avatar_file: "avatar_file"
			};

			Object.keys(columnMap).forEach((key) => {
				if (req.body[key]) {
					query += `${columnMap[key]} = ?, `;
					values.push(req.body[key]);
				}
			});

			query = query.slice(0, -2); // Removing the last comma and space
			query += " WHERE gamer_id = ?";
			values.push(req.params.gamer_id);

			// update gamer info
			await connection.execute(query, values);
		}

		if (req.body.favorite_games_id) {
			// delete existing favorite games for the gamer
			await connection.execute("DELETE FROM gamers_games WHERE gamer_id = ?", [
				req.params.gamer_id
			]);

			// add the new favorite games for the gamer for each game if any
			if (req.body.favorite_games_id.length > 0) {
				const gameValues = req.body.favorite_games_id.map((game_id) => [
					req.params.gamer_id,
					game_id
				]);
				const gameQuery =
					"INSERT INTO gamers_games (gamer_id, game_id) VALUES ?";
				await connection.execute(gameQuery, [gameValues]);
			}
		}

		if (req.body.favorite_roles_id) {
			// delete existing favorite roles for the gamer
			await connection.execute("DELETE FROM gamers_roles WHERE gamer_id = ?", [
				req.params.gamer_id
			]);

			// add the new favorite roles for the gamer if any
			if (req.body.favorite_roles_id.length > 0) {
				// const roleValues = req.body.favorite_roles_id.map((role_id) => [
				// 	req.params.gamer_id,
				// 	role_id
				// ]);
        const roleValues = [
          [ 'ebca6fcb-99f8-4506-a51f-9e1642d681c0', 1 ]
        ];

        console.log('roleValues >>>', roleValues);
				const roleQuery =
					"INSERT INTO gamers_roles (gamer_id, role_id) VALUES ?";
				await connection.execute(roleQuery, [roleValues]);
			}
		}

    if (req.body.badges_id) {
			// delete existing favorite roles for the gamer
			await connection.execute("DELETE FROM gamers_badges WHERE gamer_id = ?", [
				req.params.gamer_id
			]);

			// add the new favorite roles for the gamer if any
			if (req.body.badges_id.length > 0) {
				const badgeValues = req.body.badges_id.map((badge_id) => [
					req.params.gamer_id,
					badge_id
				]);
				const badgeQuery =
					"INSERT INTO gamers_badges (gamer_id, badge_id) VALUES ?";
				await connection.execute(badgeQuery, [badgeValues]);
			}
		}

		await connection.commit();
		res.status(200).json({
			status: "success",
			message: "gamer updated!"
		});
	} catch (err) {
		await connection.rollback();
		return next(new AppError(err, 500));
	} finally {
		connection.release();
	}
};

//function to delete a gamer using its gamer_id
exports.deleteGamer = async (req, res, next) => {
	if (!req.params.gamer_id)
		return next(new AppError("No gamer gamer_id found", 404));

	const connection = await pool.promise().getConnection();

	try {
		await connection.beginTransaction();

		//first delete the games and roles associated with the gamer
		await connection.execute("DELETE FROM gamers_games WHERE gamer_id=?", [
			req.params.gamer_id
		]);

		await connection.execute("DELETE FROM gamers_roles WHERE gamer_id=?", [
			req.params.gamer_id
		]);

		//then delete the gamer
		await connection.execute("DELETE FROM gamers WHERE gamer_id=?", [
			req.params.gamer_id
		]);

		await connection.commit();
		res.status(204).json({
			status: "success",
			message: "gamer deleted!"
		});
	} catch (err) {
		await connection.rollback();
		return next(new AppError(err, 500));
	} finally {
		connection.release();
	}
};

//function to get total_earned of a gamer, if null does the request and save it
exports.getTotalEarned = async (req, res, next) => {
	if (!req.params.gamer_id)
		return next(new AppError("No gamer gamer_id found", 404));

	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT total_earned FROM gamers WHERE gamer_id = ?", [
				req.params.gamer_id
			]);

		const data = rows[0];

		res.status(200).json({
			status: "success",
			data: data
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to get all the jobs of a gamer
exports.getGamerJobs = async (req, res, next) => {
	if (!req.params.gamer_id)
		return next(new AppError("No gamer gamer_id found", 404));

	try {
		const [rows] = await pool
			.promise()
			.execute("SELECT * FROM jobs WHERE chosen_gamer_id = ?", [
				req.params.gamer_id
			]);
		res.status(200).json({
			status: "success",
			length: rows.length,
			data: rows
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to get all the jobs created by a gamer
exports.getGamerCreatedJobs = async (req, res, next) => {
	if (!req.params.gamer_id)
		return next(new AppError("No gamer gamer_id found", 404));

	try {
		const [rows] = await connection
			.promise()
			.execute("SELECT * FROM jobs WHERE created_by = ?", [
				req.params.gamer_id
			]);
		res.status(200).json({
			status: "success",
			length: rows.length,
			data: rows
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

exports.uploadGamerAvatar = async (req, res, next) => {
  try {
    let avatar = req.files.avatar;
    const extension = mime.extension(avatar.mimetype);
    const uploadFileName = await nanoid() + '.' + extension;
    avatar.mv('./uploads/avatars/' + uploadFileName);
    res.status(200).json({
      status: "success",
      message: "Avatar is uploaded",
      data: {
        mimetype: avatar.mimetype,
        size: avatar.size,
        filename: uploadFileName
      }
    });
  } catch (err) {
    return next(new AppError(err, 500));
  }
}