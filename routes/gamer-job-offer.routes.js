const express = require("express");
const router = express.Router();
const {
	getGamerJobsOffers,
	getJobOffers,
	offerGamerForJob,
	deleteJobOffer,
	acceptJobOffer,
	refuseJobOffer
} = require("../controllers/gamer-job-offer.js");

//midlleware import
const {
	checkApplicantOfferedIdExists,
	checkJobIdExists,
	checkJobOfferExists,
	checkJobOfferAccepted,
	checkJobOfferRefused,
	checkDuplicateGamerJobRelationship,
	checkRecruiterCantSelfApplyOfferJob
} = require("../middleware/gamer-jobMiddleware.js");

//routes to interact with all job offers for a gamer
router
	.route("/offers/gamer")
	.get(checkApplicantOfferedIdExists, getGamerJobsOffers); //for the gamer to get all their offers

//routes to interact with a specific job offer
router.route("/offers/job/:job_id").get(checkJobIdExists, getJobOffers); //for the recruiter to get all the offers for a job

router
	.route("/offers/job/:job_id/gamer/:gamer_id")
	.post(
		[
			checkApplicantOfferedIdExists,
			checkJobIdExists,
			checkDuplicateGamerJobRelationship,
			checkRecruiterCantSelfApplyOfferJob
		],
		offerGamerForJob
	) //for the recruiter to offer a gamer for a job
	.delete(
		[checkJobOfferExists, checkJobOfferAccepted, checkJobOfferRefused],
		deleteJobOffer
	); //for the recruiter to delete an offer

//routes for gamers being offered for jobs by recruiters to accept or refuse the offer
router
	.route("/offers/job/:job_id/accept")
	.put([checkJobOfferExists, checkJobOfferAccepted], acceptJobOffer);
router
	.route("/offers/job/:job_id/refuse")
	.put(
		[checkJobOfferExists, checkJobOfferAccepted, checkJobOfferRefused],
		refuseJobOffer
	);

module.exports = router;
