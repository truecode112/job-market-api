const express = require("express");
const gamerControllers = require("../controllers/gamer");
const {
	checkUsername,
	checkProfileType,
	checkBirthdateFormat,
	checkMinHourRate,
	checkHoursPerDay,
	checkGamesExist,
	checkRolesExist,
	checkGamerExists,
	updateTotalEarned,
  checkFileExists,
  checkGamerAvatarExists,
  checkBadgesExists
} = require("../middleware/gamerMiddleware");
const router = express.Router();

//middleware for gamers creation and update
const gamerMiddlewareCreateOrUpdate = [
	checkUsername,
	checkProfileType,
	checkBirthdateFormat,
	checkMinHourRate,
	checkHoursPerDay,
	checkGamesExist,
	checkRolesExist,
  checkGamerAvatarExists,
  checkBadgesExists
];

//routes for gamers
router
	.route("/gamers")
	.get(gamerControllers.getAllGamers)
	.post(gamerMiddlewareCreateOrUpdate, gamerControllers.createGamer);

router
	.route("/gamers/:gamer_id")
	.get(updateTotalEarned, gamerControllers.getGamer)
	.put(gamerMiddlewareCreateOrUpdate, gamerControllers.updateGamer)
	.delete([checkGamerExists], gamerControllers.deleteGamer);

// router.route("/gamer/gamer_id").get(gamerControllers.getGamerId);

router
	.route("/gamers/:gamer_id/jobs")
	.get(checkGamerExists, gamerControllers.getGamerJobs);

router
	.route("/gamers/:gamer_id/createdJobs")
	.get(gamerControllers.getGamerCreatedJobs);

router
  .route("/gamers/upload")
  .post(checkFileExists, gamerControllers.uploadGamerAvatar);

module.exports = router;
