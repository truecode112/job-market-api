const express = require("express");
const jobControllers = require("../controllers/job");
const jobMiddleware = require("../middleware/jobMiddleware");
const router = express.Router();

//middleware for jobs creation and update
const jobMiddlewareCreate = [
	jobMiddleware.checkGameJobExists,
	jobMiddleware.checkJobState,
	jobMiddleware.checkPaymentAmount,
	jobMiddleware.checkDuration,
	jobMiddleware.checkRecruiterExists,
	jobMiddleware.checkRolesExist
];

const jobMiddlewareUpdate = [
	jobMiddleware.checkJobExists,
	jobMiddleware.checkGameJobExists,
	jobMiddleware.checkJobState,
	jobMiddleware.checkDuration,
	jobMiddleware.checkRolesExist,
	jobMiddleware.checkJobIsDone
];

//routes for jobs
router
	.route("/jobs")
	.get(jobControllers.getAllJobs)
	.post(jobMiddlewareCreate, jobControllers.createJob);
router
	.route("/jobs/:job_id")
	.get(jobControllers.getJob)
	.put(jobMiddlewareUpdate, jobControllers.updateJob)
	.delete(jobControllers.deleteJob);
router
	.route("/jobs/:job_id/chosen_gamer/:gamer_id")
	.put(jobControllers.deleteChosenGamer);
module.exports = router;
