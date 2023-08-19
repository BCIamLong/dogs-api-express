const User = require("../models/userModel");
const asyncCatch = require("../utils/asyncCatch");
const APIFeatures = require("../utils/APIFeatures");

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

module.exports = { getAllUsers };
