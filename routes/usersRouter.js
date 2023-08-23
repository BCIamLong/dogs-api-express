const express = require("express");
const {
  getAllUsers,
  updateMe,
  deleteMe,
} = require("../controllers/usersController");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
} = require("../controllers/authController");

const router = express.Router();

router.patch("/update-current-password", protect, updatePassword);
router.post("/forgot-password", forgotPassword);
router.patch("/reset-password/:token", resetPassword);

router.post("/signup", signup);
router.post("/login", login);
router.route("/").get(protect, getAllUsers);
router.patch("/update-me", protect, updateMe);
router.delete("/delete-me", protect, deleteMe);

module.exports = router;
