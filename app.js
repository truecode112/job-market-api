const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require('express-fileupload');

const gamersRoutes = require("./routes/gamers.routes");
const jobsRoutes = require("./routes/jobs.routes");
const gamerJobOfferRoutes = require("./routes/gamer-job-offer.routes");
const gamerJobApplicantRoutes = require("./routes/gamer-job-application.routes");
const AppError = require("./utils/appError"); // import the AppError class for handling application level errors
const errorHandler = require("./utils/errorHandler"); // import the error handler middleware

const app = express(); // create an instance of express

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));

app.use(express.static('uploads'));
app.use(bodyParser.json());
app.use("/api", gamersRoutes);
app.use("/api", jobsRoutes);
app.use("/api", gamerJobOfferRoutes);
app.use("/api", gamerJobApplicantRoutes);
// this middleware is handling all the routes that doesn't match any defined routes
app.all("*", (req, res, next) => {
	next(new AppError(`The URL ${req.originalUrl} does not exists`, 404));
});

app.use(errorHandler); // use the error handler middleware for handling errors.

const PORT = 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`); //log the port the server is listening on
});
module.exports = app;
