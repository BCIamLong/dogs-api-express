const Dog = require("../models/dogModel");
const asynCatch = require("../utils/asyncCatch");
const APIFeatures = require("../utils/APIFeatures");
const AppError = require("../utils/AppError");

const getAllDogs = asynCatch(async (req, res, next) => {
  const count = await Dog.countDocuments();
  const apiFeatures = new APIFeatures(Dog.find(), req.query)
    .filter()
    .sort()
    .select()
    .pagination(count);
  const dogs = await apiFeatures.query;

  res.status(200).json({
    status: "success",
    data: {
      dogs,
    },
  });
});

const createDog = asynCatch(async (req, res, next) => {
  const dog = await Dog.create(req.bodys);

  res.status(200).json({
    status: "success",
    data: {
      dog,
    },
  });
});

const getDog = asynCatch(async (req, res, next) => {
  const dog = await Dog.findById(req.params.id);
  if (!dog) return next(new AppError("Dog id invalid", 400));
  res.status(200).json({
    status: "success",
    data: {
      dog,
    },
  });
});

const updateDog = asynCatch(async (req, res, next) => {
  const dog = await Dog.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!dog) return next(new AppError("Dog id invalid", 400));

  res.status(201).json({
    status: "success",
    data: {
      dog,
    },
  });
});

const deleteDog = asynCatch(async (req, res, next) => {
  const dog = await Dog.findByIdAndDelete(req.params.id);
  if (!dog) return next(new AppError("Dog id invalid", 400));
  res.status(204).json({
    status: "success",
    data: null,
  });
});

const getTop3SmartDogs = asynCatch(async (req, res, next) => {
  const dogs = await Dog.aggregate([
    {
      $sort: { intelligence: -1 },
    },
    {
      $limit: 3,
    },
  ]);
  res.status(200).json({
    status: "success",
    data: {
      dogs,
    },
  });
});

const getDogsStats = asynCatch(async (req, res, next) => {
  const stats = await Dog.aggregate([
    {
      $group: {
        _id: "$breedType",
        avgPopularity: { $avg: "$popularity" },
        popularity: { $sum: "$popularity" },
        intelligence: { $sum: "$intelligence" },
        avgIntelligence: { $avg: "$intelligence" },
      },
    },
    {
      $sort: { popularity: -1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

module.exports = {
  getAllDogs,
  getDog,
  createDog,
  updateDog,
  deleteDog,
  getTop3SmartDogs,
  getDogsStats,
};
