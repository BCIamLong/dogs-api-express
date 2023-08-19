const express = require("express");
const morgan = require("morgan");
const dogsRouter = require("./routes/dogsRouter");
const usersRouter = require("./routes/usersRouter");
const errorsHandler = require("./middlewares/errorsHandler");
const AppError = require("./utils/AppError");

const app = express();

app.use(morgan("dev"));
app.use(express.json());
// app.use(express.static(''))

app.use("/api/v1/dogs", dogsRouter);
app.use("/api/v1/users", usersRouter);

app.all("*", (req, res, next) => {
  next(new AppError("The link you access not exits", 404));
});

//global errors catch handler
app.use(errorsHandler);

module.exports = app;
