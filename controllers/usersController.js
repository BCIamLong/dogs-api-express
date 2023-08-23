const User = require("../models/userModel");
const asyncCatch = require("../utils/asyncCatch");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");

const getAllUsers = asyncCatch(async (req, res, next) => {
  const count = await User.countDocuments();
  const apiFeatures = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .select()
    .pagination(count);
  const users = await apiFeatures.query;

  res.status(200).json({
    status: "success",
    data: {
      users,
    },
  });
});

/**
 * Filter all not allow fields in object
 *
 * @param {Object} ob - the ob is an object we need to filter
 * @param  {Array} fields - the fields array constain field we wanna pass into ob object
 * @returns {Object} filterOb = the filter object is object we filtered
 */
const filterObject = (ob, ...fields) => {
  const filterOb = {};
  Object.keys(ob).forEach(field => {
    if (fields.includes(field)) filterOb[field] = ob[field];
  });
  return filterOb;
};

/**
 * Allow user logged in can update user data
 *
 * User only update allow fields
 * @param {function} asyncCatch - the async catch wrapper funtion (like try catch block)
 * @returns {function} middleware function - the middleware function is standard of express can execute in middleware stack
 */
const updateMe = asyncCatch(async (req, res, next) => {
  const filterBody = filterObject(req.body, "name", "email", "avatar");

  const user = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

/**
 * Allow user logged in can delete userself
 *
 * User not really be deleted, we only set user active fields is false, because maybe in the future user can back and trigged the account again
 * @param {function} asyncCatch - the async catch wrapper funtion (like try catch block)
 * @returns {function} middleware function - the middleware function is standard of express can execute in middleware stack
 */
const deleteMe = asyncCatch(async (req, res, next) => {
  const { reason, password } = req.body;
  if (!reason)
    return next(
      new AppError("Please choose your reason to delete account", 400),
    );
  if (!password)
    return next(new AppError("Please fill your password to confirm", 400));
  const user = await User.findById(req.user.id).select("+password");
  const check = await user.checkPassword(password, user.password);
  if (!check) return next(new AppError("Your password is not correct!", 401));
  user.active = false;
  user.reasonDeleteAccout = reason;
  await user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});
module.exports = { getAllUsers, updateMe, deleteMe };
