const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncCatch = require("../utils/asyncCatch");
const AppError = require("../utils/AppError");

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const signup = asyncCatch(async (req, res, next) => {
  const { name, email, password, passwordConfirm, passwordChangedAt } =
    req.body;
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    passwordChangedAt,
  });
  const token = signToken(newUser);
  res.status(200).json({
    status: "success",
    token,
  });
});

const login = asyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please fill required fill to login", 400));

  const user = await User.findOne({ email });
  const check = await user?.checkPassword(password, user.password);
  if (!user || !check)
    return next(
      new AppError(
        "Email or password not correct, please check and try again",
        400
      )
    );
  const token = signToken(user);
  res.status(200).json({
    status: "success",
    token,
  });
});

const protect = asyncCatch(async (req, res, next) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  )
    return next(new AppError("Please login to use this feature", 401));
  const token = req.headers.authorization.split(" ")[1];
  if (!token)
    return next(new AppError("Please login to use this feature", 401));

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        "This user has been deleted, please contact with us to know detail or signup ",
        401
      )
    );

  if (currentUser.checkPasswordChangeAfter(decoded.iat))
    return next(
      new AppError(
        "This user recently changed password, please login again to get access ",
        401
      )
    );

  req.user = currentUser;
  next();
});
module.exports = { signup, login, protect };
