const AppError = require("../utils/appError");
const connection = require("../services/db");

//function to get all roles
exports.getAllRoles = async (req, res, next) => {
	try {
		connection.query("SELECT * FROM roles", function (err, result) {
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

//function to create role, require name, others are optional
exports.createRole = async (req, res, next) => {
	try {
		if (!req.body) return next(new AppError("No role data found", 404));
		if (!req.body.name) return next(new AppError("No role name found"));

		//initialize query and values
		let query = "INSERT INTO roles (name)";
		let values = [req.body.name];

		//connect to database
		connection.beginTransaction(function (err) {
			if (err) {
				return next(new AppError(err, 500));
			}

			//check if role name already exists
			connection.query(
				"SELECT * FROM roles WHERE name = ?",
				[req.body.name],
				function (err, result) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					if (result.length > 0) {
						return connection.rollback(function () {
							return next(new AppError("Role name already exists", 400));
						});
					}
				}
			);

			//query to create the role
			connection.query(query, values, function (err, result) {
				if (err) {
					return connection.rollback(function () {
						return next(new AppError(err, 500));
					});
				}
				connection.commit(function (err) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					res.status(201).json({
						status: "success",
						data: {
							id: result.insertId,
							name: req.body.name
						}
					});
				});
			});
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function update role, require id and name, others are optional
exports.updateRole = async (req, res, next) => {
	try {
		if (!req.body) return next(new AppError("No role data found", 404));
		if (!req.body.id) return next(new AppError("No role id found"));
		if (!req.body.name) return next(new AppError("No role name found"));

		//initialize query and values
		let query = "UPDATE roles SET name = ?";
		let values = [req.body.name];

		//connect to database
		connection.beginTransaction(function (err) {
			if (err) {
				return next(new AppError(err, 500));
			}

			//check if role name already exists
			connection.query(
				"SELECT * FROM roles WHERE name = ?",
				[req.body.name],
				function (err, result) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					if (result.length > 0) {
						return connection.rollback(function () {
							return next(new AppError("Role name already exists", 400));
						});
					}
				}
			);

			//query to update the role
			connection.query(query, values, function (err, result) {
				if (err) {
					return connection.rollback(function () {
						return next(new AppError(err, 500));
					});
				}
				connection.commit(function (err) {
					if (err) {
						return connection.rollback(function () {
							return next(new AppError(err, 500));
						});
					}
					res.status(201).json({
						status: "success",
						data: {
							id: req.body.id,
							name: req.body.name
						}
					});
				});
			});
		});
	} catch (err) {
		return next(new AppError(err, 500));
	}
};

//function to delete role, require id
exports.deleteRole = async (req, res, next) => {
	try {
		if (req.params.id) return next(new AppError("No role id found"));
		connection.query(
			"DELETE FROM roles WHERE id = ?",
			[req.params.id],
			function (err, result) {
				if (err) return next(new AppError(err, 500));
				res.status(200).json({
					status: "success",
					message: "Role deleted successfully",
					data: result
				});
			}
		);
	} catch (err) {
		return next(new AppError(err, 500));
	}
};
