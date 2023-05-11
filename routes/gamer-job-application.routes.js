const express = require("express");
const router = express.Router();
const {
	getGamerJobsApplications,
	getJobApplications,
	applyForJob,
	approveApplication,
	rejectApplication,
	deleteApplication
} = require("../controllers/gamer-job-application.js");

//middleware import
const {
	checkApplicantOfferedIdExists,
	checkJobIdExists,
	checkApplicationExists,
	checkApplicationApproved,
	checkApplicationRejected,
	checkDuplicateGamerJobRelationship,
	checkRecruiterCantSelfApplyOfferJob
} = require("../middleware/gamer-jobMiddleware.js");

//routes
router
	.route("/applications/gamer")
	.get(checkApplicantOfferedIdExists, getGamerJobsApplications); //for the gamer to get all their applications

//routes to interact with a specific job application
router
	.route("/applications/job/:job_id")
	.post(
		[
			checkApplicantOfferedIdExists,
			checkJobIdExists,
			checkDuplicateGamerJobRelationship,
			checkRecruiterCantSelfApplyOfferJob
		],
		applyForJob
	) //for the gamer to apply for a job
	.delete(
		[
			checkApplicationExists,
			checkApplicationApproved,
			checkApplicationRejected
		],
		deleteApplication
	) //for the gamer to delete an application
	.get(getJobApplications); //for the recruiter to get all the applications for a job

//routes for recruiters to approve or reject applications
router
	.route("/applications/job/:job_id/gamer/:gamer_id/approve")
	.put([checkApplicationExists, checkApplicationApproved], approveApplication);
router
	.route("/applications/job/:job_id/gamer/:gamer_id/reject")
	.put(
		[
			checkApplicationExists,
			checkApplicationApproved,
			checkApplicationRejected
		],
		rejectApplication
	);

module.exports = router;
