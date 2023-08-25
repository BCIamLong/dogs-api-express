const { promisify } = require("util");
const crypto = require("crypto");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const asyncCatch = require("../utils/asyncCatch");
const AppError = require("../utils/AppError");
const { sendEmail } = require("../utils/email");

const signToken = user =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const optionsCookie = {
  httpOnly: true,
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
  ),
};

if (process.env.NODE_ENV === "production") optionsCookie.secure = true;

const sendJWT = (res, statusCode, user) => {
  const token = signToken(user);
  res.cookie("jwt", token, optionsCookie);
  res.status(statusCode).json({
    status: "success",
    token,
  });
};
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

  sendJWT(res, 200, newUser);
});

const login = asyncCatch(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please fill required fill to login", 400));

  const user = await User.findOne({ email }).select("+password");
  const check = await user?.checkPassword(password, user.password);
  if (!user || !check)
    return next(
      new AppError(
        "Email or password not correct, please check and try again",
        400,
      ),
    );
  sendJWT(res, 200, user);
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
        401,
      ),
    );

  if (currentUser.checkPasswordChangeAfter(decoded.iat))
    return next(
      new AppError(
        "This user recently changed password, please login again to get access ",
        401,
      ),
    );
  console.log(currentUser);
  req.user = currentUser;
  next();
});

/**
 *Restrict user perform the actions related to create, delete, update data which is the action for admin, manager,..., this is also authorization
 *
 * Of course if user try to perform this action we will accounced or forbbiden
 * @param  {array} roles - The roles array constain valid roles can perform an action like delete user, dogs,...
 * @return {function} middleware function - the middleware function (req, res next) is standard of express middleware can run in middleware stack
 */
const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You don't have permission to perform this feature ", 403),
      );

    next();
  };

/**
 * Allow user who forgot password can send request to reset password
 *
 * User need to provide email, then app will check this email if true we send reset password to user email
 *
 * Of course if user email is false, we will accnouced user
 * @param {funtion} asyncCatch - the async wrapper function (like try catch block)
 * @return {function} middleware function - the middleware function(req, res, next)
 */
const forgotPassword = asyncCatch(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Please fill your email", 400));
  if (!validator.isEmail(email))
    return next(new AppError("Please fill the valid email", 400));
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Your email is not correct", 401));

  const resetToken = user.createResetTokenPwd();

  await user.save({ validateBeforeSave: false });

  const message = `You forgot password, please click this link ${req.protocol}://${req.hostname}:3000/api/v1/users/reset-password/${resetToken}. If you didn't forgot your password, just ignore this mail`;
  const subject = "Reset your password (valid in 12 minutes)";
  try {
    await sendEmail({ email, subject, message });

    res.status(200).json({
      status: "success",
      message: "Sent mail to your email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenTimeout = undefined;
    await user.save();
  }
});

/**
 * Check and allow user can reset password when user perform forgot password feature
 *
 * First user perform forgot password feature then get a mail in user email
 *
 * Two user click the link in reset password mail in user email
 *
 * Three user fill password and confirm reset password
 *
 * If user password and confirm not in the same we also need to accouced
 *
 * If reset token password expired user must to back and perform forgot password feature again
 * @param {function} asyncCatch - the async wrapper function(constain try catch block)
 * @return {function} middleware funtion - the middeware function(req, res, next)
 */
const resetPassword = asyncCatch(async (req, res, next) => {
  const passwordResetToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken,
    passwordResetTokenTimeout: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Your token is invalid or expired", 401));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenTimeout = undefined;
  await user.save();

  sendJWT(res, 201, user);
});

/**
 * Allow user logged in can update the current user password
 *
 * First: user login in to app
 *
 * Second: user re-enter password to confirm perform this feature
 *
 * Third: user enter new password and confirm (check type and password confirm is correct)
 *
 * Fourth: update user password
 * @param {function} function - the wrapper function
 * @return {function} function - the middeware function(req, nex, next)
 */
const updatePassword = asyncCatch(async (req, res, next) => {
  //check current passwor: empty, valid
  const { currentPassword } = req.body;
  if (!currentPassword)
    return next(
      new AppError("Please fill your current password to confirm", 400),
    );
  if (currentPassword.length < 8)
    return next(new AppError("Password must have at least 8 characters", 400));

  const user = await User.findById(req.user.id).select("+password");
  const check = await user.checkPassword(currentPassword, user.password);
  if (!check)
    return next(new AppError("Your current password is not correct", 401));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  sendJWT(res, 201, user);
});

/**
 * Allow user verify email to use more features of our app
 *
 * User must to login, re-enter email, click verify
 *
 * We will send OTP code mail to user email
 *
 * @param {function} function - the wrapper function
 * @return {function} function - the middeware function(req, nex, next)
 */
const verifyEmail = asyncCatch(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new AppError("Please enter your email to confirm ", 400));
  const user = await User.findOne({ email });
  if (!user) return next(new AppError("Your email is not correct ", 401));
  const otp = await user.createVerifyEmailOTP();
  await user.save({ validateBeforeSave: false });
  const subject = "Your verify email mail";
  const message = `This is your OTP code ${otp}, use this for your email confirm turn`;

  try {
    await sendEmail({ email, subject, message });
    res.status(200).json({
      status: "success",
      message: "Sent otp code to your email",
    });
  } catch (err) {
    user.emailVerifyOTP = undefined;
    user.emailVerifyOTPTimeout = undefined;
    await user.save({ validateBeforeSave: false });
  }
});

/**
 * Allow user confirm email when user has OTP code from user email
 *
 * OTP must to correct, not expires
 *
 * @param {function} function - the wrapper function
 * @return {function} function - the middeware function(req, nex, next)
 */
const confirmEmail = asyncCatch(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    emailVerifyOTPTimeout: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Your OTP code is expired", 401));

  const { otp } = req.body;
  if (!otp)
    return next(
      new AppError("Please enter your OTP code to confirm email", 400),
    );
  const check = await user.checkPassword(otp, user.emailVerifyOTP);
  if (!check) return next(new AppError("Your OTP code is not correct", 401));

  user.emailVerify = true;
  user.emailVerifyOTP = undefined;
  user.emailVerifyOTPTimeout = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: "success",
    message: "Your email was confirm",
  });
});

/**
 * Restict user don't verified can't use certain features, if user wanna use this user must verify email
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next function to use for go to the next middleware
 */
const restricVerified = (req, res, next) => {
  if (!(req.user.emailVerify === true))
    return next(
      new AppError("You need to verified to perform this feature", 403),
    );

  next();
};

module.exports = {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  restrictTo,
  verifyEmail,
  confirmEmail,
  restricVerified,
};
