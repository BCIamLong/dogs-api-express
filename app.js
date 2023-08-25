const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const dogsRouter = require("./routes/dogsRouter");
const usersRouter = require("./routes/usersRouter");
const errorsHandler = require("./middlewares/errorsHandler");
const AppError = require("./utils/AppError");

const app = express();

app.use(helmet());

app.use(cookieParser());

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) =>
    res.status(429).json({
      status: "fails",
      message: "Too much requests, please wait and try again",
    }),
});

app.use(limiter);

// app.use(express.json());
app.use(bodyParser.json({ limit: "90kb" }));
// app.use(express.static(''))

app.use(
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      console.warn(` This request[${key}] is sanitized`); // req);
    },
  }),
);

app.use(
  hpp({
    whitelist: ["popularity", "intelligence"],
  }),
);

app.use("/api/v1/dogs", dogsRouter);
app.use("/api/v1/users", usersRouter);

app.all("*", (req, res, next) => {
  next(new AppError("The link you access not exits", 404));
});

//global errors catch handler
app.use(errorsHandler);

module.exports = app;
