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
const { protect } = require("../controllers/authController");

const router = express.Router();

router.get("/dogs-stats", getDogsStats);
router.get("/top-3-smart-dogs", getTop3SmartDogs);

router.route("/").get(protect, getAllDogs).post(createDog);
router.route("/:id").get(getDog).patch(updateDog).delete(deleteDog);

module.exports = router;
