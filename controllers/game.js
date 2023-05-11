const AppError = require("../utils/appError");
const connection = require("../services/db");

//function to get all games
exports.getAllGames = async (req, res, next) => {
	try {
		connection.query("SELECT * FROM games", function (err, result) {
			if (err) return next(new AppError(err, 500));
			res.status(200).json({
				status: "success",
				length: result?.length,
				data: result
			});
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to create game, require name, others are optional
exports.createGame = async (req, res, next) => {
	try {
		if (!req.body) return next(new AppError("No game data found", 404));
		if (!req.body.name) return next(new AppError("No game name found"));

		//initialize query and values
		let query = "INSERT INTO games (name)";
		let values = [req.body.name];

		//connect to database
		connection.beginTransaction(function (err) {
			if (err) {
				return next(new AppError(err, 500));
			}

			//check if game name already exists
			connection.query(
				"SELECT * FROM games WHERE name = ?",
				[req.body.name],
				function (err, result) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					if (result.length > 0) {
						return connection.rollback(function () {
							return next(new AppError("Game name already exists", 400));
						});
					}
				}
			);

			//query to create the game
			connect.query(query, values, function (err, result) {
				if (err) {
					return connection.rollback(function () {
						return next(new AppError(err, 500));
					});
				}

				//commit the transaction
				connection.commit(function (err) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					res.status(201).json({
						status: "success",
						message: "Game created successfully",
						data: {
							game_id: result.insertId
						}
					});
				});
			});
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to update game, require id, others are optional
exports.updateGame = async (req, res, next) => {
	try {
		if (!req.body) return next(new AppError("No game data found", 404));
		if (!req.params.id) return next(new AppError("No game id found"));

		//initialize query and values
		let query = "UPDATE games SET ";
		let values = [];

		//connect to database
		connection.beginTransaction(function (err) {
			if (err) {
				return next(new AppError(err, 500));
			}

			//check if game name already exists
			connection.query(
				"SELECT 1 FROM games WHERE name = ?",
				[req.body.name],
				function (err, result) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					if (result.length > 0) {
						return connection.rollback(function () {
							return next(new AppError("Game name already exists", 400));
						});
					}
				}
			);

			//query to update the game
			connection.query(query, values, function (err, result) {
				if (err) {
					return connection.rollback(function () {
						return next(new AppError(err, 500));
					});
				}

				//commit the transaction
				connection.commit(function (err) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					res.status(200).json({
						status: "success",
						message: "Game updated successfully",
						data: {
							game_id: result.insertId
						}
					});
				});
			});
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to delete game, require id
exports.deleteGame = async (req, res, next) => {
	try {
		if (!req.params.id) return next(new AppError("No game id found"));
		connection.query(
			"DELETE FROM games WHERE id = ?",
			[req.params.id],
			function (err, result) {
				if (err) return next(new AppError(err, 500));
				res.status(200).json({
					status: "success",
					message: "Game deleted successfully",
					data: {
						game_id: req.params.id
					}
				});
			}
		);
	} catch (err) {
		return next(new AppError(err, 500));
	}
};
