const express = require("express");
const {
  getAllDogs,
  getDog,
  createDog,
  updateDog,
  deleteDog,
  getTop3SmartDogs,
  getDogsStats,
} = require("../controllers/dogsController");
const { protect, restrictTo } = require("../controllers/authController");

const router = express.Router();

router.get("/dogs-stats", getDogsStats);
router.get("/top-3-smart-dogs", getTop3SmartDogs);

router
  .route("/")
  .get(protect, getAllDogs)
  .post(protect, restrictTo("admin", "seller"), createDog);
router
  .route("/:id")
  .get(getDog)
  .patch(protect, restrictTo("admin", "seller"), updateDog)
  .delete(protect, restrictTo("admin", "seller"), deleteDog);

module.exports = router;
